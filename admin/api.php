<?php
// =========================================================
// Panel Winter Dip — dane w JSON: sprzedaż (Shopify), reklamy (Meta),
// ruch na stronie (własny licznik api/hit.php). Wymaga zalogowania.
//   ?range=today|7|30|90|all      — przegląd (z porównaniem do poprzedniego okresu)
//   ?live=1                       — szybki podgląd dnia (powiadomienia o zamówieniach)
//   &fresh=1                      — pomija cache
// =========================================================
declare(strict_types=1);
require __DIR__ . '/lib.php';
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
if (!logged_in()) { http_response_code(401); echo json_encode(['error' => 'auth']); exit; }

const STORE_START = '2026-11-10';
$fresh = isset($_GET['fresh']);
$tzW = new DateTimeZone('Europe/Warsaw');

// ---------------- Shopify ----------------
// Token Admin API: stały (SHOPIFY_ADMIN_TOKEN) albo pobierany z Client ID + Client secret
// aplikacji z Dev Dashboard (client credentials — ważny 24 h, trzymany w cache).
function shopify_token(string $domain, string &$error, bool $renew = false): string {
  if (($t = cfg('SHOPIFY_ADMIN_TOKEN')) !== '') return $t;
  $id = cfg('SHOPIFY_CLIENT_ID'); $secret = cfg('SHOPIFY_CLIENT_SECRET');
  if ($id === '' || $secret === '') { $error = 'Brak kluczy Shopify (SHOPIFY_CLIENT_ID i SHOPIFY_CLIENT_SECRET).'; return ''; }
  if (!$renew) { $c = cache_get('shopify-token', 20 * 3600); if (is_array($c) && !empty($c['t'])) return $c['t']; }
  $r = http_json("https://$domain/admin/oauth/access_token", ['Content-Type: application/x-www-form-urlencoded'],
    http_build_query(['grant_type' => 'client_credentials', 'client_id' => $id, 'client_secret' => $secret]));
  $t = $r['json']['access_token'] ?? '';
  if ($t === '') { $error = 'Shopify: nie udało się pobrać tokenu (HTTP ' . $r['code'] . ' ' . ($r['json']['error_description'] ?? $r['json']['error'] ?? $r['error']) . ').'; return ''; }
  cache_set('shopify-token', ['t' => $t]);
  return $t;
}

// pobiera zamówienia od daty (max 800), ponawia token przy 401
function shopify_orders(string $since, int $limitPages, string &$error): ?array {
  $domain = cfg('SHOPIFY_DOMAIN', 'wmqk7f-cr.myshopify.com');
  $ver = cfg('SHOPIFY_API_VERSION', '2026-10');
  $token = shopify_token($domain, $error);
  if ($token === '') return null;
  $orders = []; $after = null; $retried = false;
  $q = 'query($q:String,$after:String){orders(first:100,after:$after,query:$q,sortKey:CREATED_AT,reverse:true){pageInfo{hasNextPage endCursor} nodes{name createdAt test cancelledAt displayFinancialStatus displayFulfillmentStatus totalPriceSet{shopMoney{amount}} totalRefundedSet{shopMoney{amount}} lineItems(first:10){nodes{title quantity}}}}}';
  for ($page = 0; $page < $limitPages; $page++) {
    $r = http_json("https://$domain/admin/api/$ver/graphql.json",
      ['Content-Type: application/json', 'X-Shopify-Access-Token: ' . $token],
      json_encode(['query' => $q, 'variables' => ['q' => "created_at:>=$since", 'after' => $after]]));
    if ($r['code'] === 401 && !$retried) { $retried = true; $token = shopify_token($domain, $error, true); if ($token === '') return null; $page--; continue; }
    if ($r['code'] !== 200 || !isset($r['json']['data']['orders'])) {
      $msg = $r['json']['errors'][0]['message'] ?? ($r['json']['errors'] ?? null);
      $error = 'Shopify: ' . (is_string($msg) ? $msg : ('HTTP ' . $r['code'] . ' ' . $r['error']));
      return null;
    }
    $o = $r['json']['data']['orders'];
    foreach ($o['nodes'] as $n) $orders[] = $n;
    if (!$o['pageInfo']['hasNextPage']) break;
    $after = $o['pageInfo']['endCursor'];
  }
  return $orders;
}

function order_row(array $n, DateTimeZone $tz): array {
  $dt = (new DateTime($n['createdAt']))->setTimezone($tz);
  $total = (float)$n['totalPriceSet']['shopMoney']['amount'] - (float)($n['totalRefundedSet']['shopMoney']['amount'] ?? 0);
  $qty = 0; $items = [];
  foreach ($n['lineItems']['nodes'] as $li) { $qty += (int)$li['quantity']; $items[] = $li['quantity'] . '× ' . $li['title']; }
  return ['name' => $n['name'], 'date' => $n['createdAt'], 'day' => $dt->format('Y-m-d'), 'hour' => (int)$dt->format('G'),
    'total' => round($total, 2), 'qty' => $qty, 'items' => implode(', ', $items), 'lines' => $n['lineItems']['nodes'],
    'status' => $n['cancelledAt'] ? 'anulowane' : ($n['test'] ? 'testowe' : $n['displayFinancialStatus']),
    'fulfillment' => $n['displayFulfillmentStatus'], 'counted' => !$n['test'] && !$n['cancelledAt']];
}

// ---------------- tryb „na żywo” ----------------
if (isset($_GET['live'])) {
  $today = (new DateTimeImmutable('today', $tzW))->format('Y-m-d');
  $out = cache_get('live', 25);
  if (!$out || $fresh) {
    $err = '';
    $orders = shopify_orders((new DateTimeImmutable('today', $tzW))->modify('-2 days')->format('Y-m-d'), 1, $err);
    $rows = $orders === null ? [] : array_map(fn($n) => order_row($n, $GLOBALS['tzW']), $orders);
    $todayRows = array_filter($rows, fn($r) => $r['counted'] && $r['day'] === $today);
    $f = DATA_DIR . "/stats-$today.json";
    $t = is_file($f) ? (json_decode((string)file_get_contents($f), true) ?: []) : [];
    $latest = array_values(array_filter($rows, fn($r) => $r['counted']));
    $out = ['ok' => $orders !== null, 'error' => $err, 'today' => ['orders' => count($todayRows), 'revenue' => array_sum(array_column($todayRows, 'total')),
      'visitors' => (int)($t['visitors'] ?? 0), 'carts' => (int)($t['funnel']['add'] ?? 0)],
      'latest' => array_map(fn($r) => ['name' => $r['name'], 'date' => $r['date'], 'total' => $r['total'], 'items' => $r['items']], array_slice($latest, 0, 5))];
    cache_set('live', $out);
  }
  echo json_encode($out, JSON_UNESCAPED_UNICODE);
  exit;
}

// ---------------- zakres dat ----------------
$range = $_GET['range'] ?? '7';
$until = new DateTimeImmutable('today', $tzW);
if ($range === 'all') {
  $since = new DateTimeImmutable(STORE_START, $tzW);
  $days = (int)$since->diff($until)->days + 1;
} else {
  $days = ['today' => 1, '7' => 7, '30' => 30, '90' => 90][$range] ?? 7;
  $since = $until->modify('-' . ($days - 1) . ' days');
}
$prevSince = $since->modify("-$days days");
$prevUntil = $since->modify('-1 day');
$dates = [];
for ($d = $since; $d <= $until; $d = $d->modify('+1 day')) $dates[] = $d->format('Y-m-d');
$prevDates = [];
for ($d = $prevSince; $d <= $prevUntil; $d = $d->modify('+1 day')) $prevDates[] = $d->format('Y-m-d');
$sinceS = $since->format('Y-m-d'); $untilS = $until->format('Y-m-d');

// ---------------- Shopify: okres + poprzedni okres ----------------
function shopify_data(string $sinceS, string $prevSinceS, array $dates, bool $fresh, DateTimeZone $tz): array {
  $key = 'shopify-' . $prevSinceS . '-' . $sinceS;
  if (!$fresh && ($c = cache_get($key, 240))) return $c;
  $err = '';
  $orders = shopify_orders($prevSinceS, 8, $err);
  if ($orders === null) return ['ok' => false, 'error' => $err];
  $daily = array_fill_keys($dates, ['orders' => 0, 'revenue' => 0.0]);
  $tot = ['orders' => 0, 'revenue' => 0.0, 'items' => 0, 'cancelled' => 0, 'unfulfilled' => 0];
  $prev = ['orders' => 0, 'revenue' => 0.0, 'items' => 0];
  $list = []; $products = []; $hours = array_fill(0, 24, 0); $best = null;
  foreach ($orders as $n) {
    $r = order_row($n, $tz);
    $inCur = $r['day'] >= $sinceS;
    if ($inCur) $list[] = $r;
    if (!$r['counted']) { if ($inCur && $r['status'] === 'anulowane') $tot['cancelled']++; continue; }
    if (!$inCur) { $prev['orders']++; $prev['revenue'] += $r['total']; $prev['items'] += $r['qty']; continue; }
    $tot['orders']++; $tot['revenue'] += $r['total']; $tot['items'] += $r['qty'];
    if (isset($daily[$r['day']])) { $daily[$r['day']]['orders']++; $daily[$r['day']]['revenue'] += $r['total']; }
    $hours[$r['hour']]++;
    if ($r['fulfillment'] !== 'FULFILLED') $tot['unfulfilled']++;
    foreach ($r['lines'] as $li) $products[$li['title']] = ($products[$li['title']] ?? 0) + (int)$li['quantity'];
  }
  foreach ($daily as $d => $v) if ($best === null || $v['revenue'] > $best['revenue']) $best = ['day' => $d] + $v;
  arsort($products);
  foreach ($list as &$l) unset($l['lines']);
  $out = ['ok' => true, 'totals' => $tot, 'prev' => $prev, 'daily' => $daily, 'hours' => $hours, 'bestDay' => $best,
    'orders' => array_slice($list, 0, 15), 'products' => $products];
  cache_set($key, $out);
  return $out;
}

// ---------------- Meta (reklamy) ----------------
function meta_data(string $since, string $until, string $prevSince, string $prevUntil, array $dates, bool $fresh): array {
  $token = cfg('META_TOKEN');
  if ($token === '') return ['ok' => false, 'error' => 'Brak klucza Meta (META_TOKEN).'];
  $key = 'meta-' . $since . '-' . $until;
  if (!$fresh && ($c = cache_get($key, 600))) return $c;
  $acct = cfg('META_AD_ACCOUNT', '1960712965203736');
  $ver = cfg('META_API_VERSION', 'v22.0');
  $base = "https://graph.facebook.com/$ver/act_$acct/insights";
  $get = function (array $p) use ($base, $token) { $p['access_token'] = $token; return http_json($base . '?' . http_build_query($p)); };
  $purch = function (array $row, string $key): float {
    $best = 0.0;
    foreach ($row[$key] ?? [] as $a) if (in_array($a['action_type'], ['purchase', 'omni_purchase', 'offsite_conversion.fb_pixel_purchase'], true)) $best = max($best, (float)$a['value']);
    return $best;
  };
  $act = function (array $row, string $type): float {
    foreach ($row['actions'] ?? [] as $a) if ($a['action_type'] === $type) return (float)$a['value'];
    return 0.0;
  };
  $tr = json_encode(['since' => $since, 'until' => $until]);
  $r = $get(['fields' => 'spend,impressions,inline_link_clicks,actions,action_values', 'time_range' => $tr, 'time_increment' => 1, 'limit' => 120]);
  if ($r['code'] !== 200 || !isset($r['json']['data'])) {
    return ['ok' => false, 'error' => 'Meta: ' . ($r['json']['error']['message'] ?? ('HTTP ' . $r['code'] . ' ' . $r['error']))];
  }
  $daily = array_fill_keys($dates, ['spend' => 0.0, 'clicks' => 0, 'purchases' => 0]);
  $tot = ['spend' => 0.0, 'impressions' => 0, 'reach' => 0, 'linkClicks' => 0, 'purchases' => 0.0, 'purchaseValue' => 0.0, 'addToCart' => 0.0, 'checkouts' => 0.0];
  foreach ($r['json']['data'] as $row) {
    $d = $row['date_start'];
    $tot['spend'] += (float)$row['spend']; $tot['impressions'] += (int)$row['impressions'];
    $tot['linkClicks'] += (int)($row['inline_link_clicks'] ?? 0);
    $tot['purchases'] += $purch($row, 'actions'); $tot['purchaseValue'] += $purch($row, 'action_values');
    $tot['addToCart'] += $act($row, 'offsite_conversion.fb_pixel_add_to_cart');
    $tot['checkouts'] += $act($row, 'offsite_conversion.fb_pixel_initiate_checkout');
    if (isset($daily[$d])) { $daily[$d]['spend'] += (float)$row['spend']; $daily[$d]['clicks'] += (int)($row['inline_link_clicks'] ?? 0); $daily[$d]['purchases'] += $purch($row, 'actions'); }
  }
  $rr = $get(['fields' => 'reach', 'time_range' => $tr]);
  $tot['reach'] = (int)($rr['json']['data'][0]['reach'] ?? 0);
  $tot['ctr'] = $tot['impressions'] ? $tot['linkClicks'] / $tot['impressions'] * 100 : 0;
  $tot['cpc'] = $tot['linkClicks'] ? $tot['spend'] / $tot['linkClicks'] : 0;
  $rp = $get(['fields' => 'spend,inline_link_clicks', 'time_range' => json_encode(['since' => $prevSince, 'until' => $prevUntil])]);
  $prev = ['spend' => (float)($rp['json']['data'][0]['spend'] ?? 0), 'linkClicks' => (int)($rp['json']['data'][0]['inline_link_clicks'] ?? 0)];
  $rc = $get(['level' => 'campaign', 'fields' => 'campaign_name,spend,impressions,inline_link_clicks,actions,action_values', 'time_range' => $tr, 'limit' => 50]);
  $campaigns = [];
  foreach ($rc['json']['data'] ?? [] as $row) {
    $campaigns[] = ['name' => $row['campaign_name'], 'spend' => (float)$row['spend'], 'impressions' => (int)$row['impressions'],
      'clicks' => (int)($row['inline_link_clicks'] ?? 0), 'purchases' => $purch($row, 'actions'), 'value' => $purch($row, 'action_values')];
  }
  usort($campaigns, fn($a, $b) => $b['spend'] <=> $a['spend']);
  $out = ['ok' => true, 'totals' => $tot, 'prev' => $prev, 'daily' => $daily, 'campaigns' => $campaigns];
  cache_set($key, $out);
  return $out;
}

// ---------------- ruch na stronie ----------------
function traffic_data(array $dates): array {
  $tot = ['pv' => 0, 'visitors' => 0, 'view' => 0, 'add' => 0, 'checkout' => 0];
  $daily = []; $sources = []; $devices = []; $products = []; $pages = []; $hours = array_fill(0, 24, 0);
  $funnel = ['pv' => 0, 'view' => 0, 'add' => 0, 'checkout' => 0];
  foreach ($dates as $day) {
    $f = DATA_DIR . "/stats-$day.json";
    $d = is_file($f) ? (json_decode((string)file_get_contents($f), true) ?: []) : [];
    $daily[$day] = ['visitors' => (int)($d['visitors'] ?? 0), 'pv' => (int)($d['pv'] ?? 0)];
    foreach ($tot as $k => $_) $tot[$k] += (int)($d[$k] ?? 0);
    foreach (($d['sources'] ?? []) as $k => $v) $sources[$k] = ($sources[$k] ?? 0) + $v;
    foreach (($d['devices'] ?? []) as $k => $v) $devices[$k] = ($devices[$k] ?? 0) + $v;
    foreach (($d['pages'] ?? []) as $k => $v) $pages[$k] = ($pages[$k] ?? 0) + $v;
    foreach (($d['funnel'] ?? []) as $k => $v) $funnel[$k] = ($funnel[$k] ?? 0) + $v;
    foreach (($d['hours'] ?? []) as $k => $v) $hours[(int)$k] += (int)$v;
    foreach (($d['products'] ?? []) as $k => $v) foreach ($v as $kk => $vv) $products[$k][$kk] = ($products[$k][$kk] ?? 0) + $vv;
  }
  arsort($sources); arsort($pages);
  return ['ok' => true, 'totals' => $tot, 'daily' => $daily, 'sources' => $sources, 'devices' => $devices, 'hours' => $hours,
    'products' => $products, 'pages' => array_slice($pages, 0, 8, true), 'funnel' => $funnel];
}

$shop = shopify_data($sinceS, $prevSince->format('Y-m-d'), $dates, $fresh, $tzW);
$meta = meta_data($sinceS, $untilS, $prevSince->format('Y-m-d'), $prevUntil->format('Y-m-d'), $dates, $fresh);
$traffic = traffic_data($dates);
$trafficPrev = traffic_data($prevDates)['totals'];

$rev = $shop['ok'] ? $shop['totals']['revenue'] : null;
$ord = $shop['ok'] ? $shop['totals']['orders'] : null;
$spend = $meta['ok'] ? $meta['totals']['spend'] : null;
$kpi = [
  'revenue' => $rev, 'orders' => $ord, 'items' => $shop['ok'] ? $shop['totals']['items'] : null,
  'aov' => ($ord ?? 0) > 0 ? $rev / $ord : null,
  'spend' => $spend,
  'roas' => ($spend ?? 0) > 0 && $rev !== null ? $rev / $spend : null,
  'cpa' => ($ord ?? 0) > 0 && $spend !== null ? $spend / $ord : null,
  'visitors' => $traffic['totals']['visitors'],
  'conversion' => $traffic['totals']['visitors'] > 0 && $ord !== null ? $ord / $traffic['totals']['visitors'] * 100 : null,
];
$prev = [
  'revenue' => $shop['ok'] ? $shop['prev']['revenue'] : null,
  'orders' => $shop['ok'] ? $shop['prev']['orders'] : null,
  'spend' => $meta['ok'] ? $meta['prev']['spend'] : null,
  'visitors' => $trafficPrev['visitors'],
  'linkClicks' => $meta['ok'] ? $meta['prev']['linkClicks'] : null,
];

echo json_encode(['range' => $range, 'since' => $sinceS, 'until' => $untilS, 'days' => $days, 'dates' => $dates, 'kpi' => $kpi, 'prev' => $prev,
  'shopify' => $shop, 'meta' => $meta, 'traffic' => $traffic, 'generated' => (new DateTime('now', $tzW))->format('H:i')], JSON_UNESCAPED_UNICODE);
