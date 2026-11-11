<?php
// =========================================================
// Panel Winter Dip — dane w JSON: sprzedaż (Shopify), reklamy (Meta),
// ruch na stronie (własny licznik api/hit.php). Wymaga zalogowania.
// =========================================================
declare(strict_types=1);
require __DIR__ . '/lib.php';
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
if (!logged_in()) { http_response_code(401); echo json_encode(['error' => 'auth']); exit; }

$range = $_GET['range'] ?? '7';
$days = ['today' => 1, '7' => 7, '30' => 30, '90' => 90][$range] ?? 7;
$fresh = isset($_GET['fresh']);
$until = new DateTimeImmutable('today');
$since = $until->modify('-' . ($days - 1) . ' days');
$dates = [];
for ($d = $since; $d <= $until; $d = $d->modify('+1 day')) $dates[] = $d->format('Y-m-d');
$sinceS = $since->format('Y-m-d'); $untilS = $until->format('Y-m-d');

// ---------------- Shopify ----------------
// Token Admin API: stały (SHOPIFY_ADMIN_TOKEN) albo pobierany z Client ID + Client secret
// aplikacji z Dev Dashboard (client credentials — ważny 24 h, trzymany w cache).
function shopify_token(string $domain, string &$error): string {
  if (($t = cfg('SHOPIFY_ADMIN_TOKEN')) !== '') return $t;
  $id = cfg('SHOPIFY_CLIENT_ID'); $secret = cfg('SHOPIFY_CLIENT_SECRET');
  if ($id === '' || $secret === '') { $error = 'Brak kluczy Shopify (SHOPIFY_CLIENT_ID i SHOPIFY_CLIENT_SECRET).'; return ''; }
  $c = cache_get('shopify-token', 20 * 3600);
  if (is_array($c) && !empty($c['t'])) return $c['t'];
  $r = http_json("https://$domain/admin/oauth/access_token", ['Content-Type: application/x-www-form-urlencoded'],
    http_build_query(['grant_type' => 'client_credentials', 'client_id' => $id, 'client_secret' => $secret]));
  $t = $r['json']['access_token'] ?? '';
  if ($t === '') { $error = 'Shopify: nie udało się pobrać tokenu (HTTP ' . $r['code'] . ' ' . ($r['json']['error_description'] ?? $r['json']['error'] ?? $r['error']) . ').'; return ''; }
  cache_set('shopify-token', ['t' => $t]);
  return $t;
}

function shopify_data(string $since, array $dates, bool $fresh): array {
  $domain = cfg('SHOPIFY_DOMAIN', 'wmqk7f-cr.myshopify.com');
  $key = 'shopify-' . $since;
  if (!$fresh && ($c = cache_get($key, 300))) return $c;
  $err = '';
  $token = shopify_token($domain, $err);
  if ($token === '') return ['ok' => false, 'error' => $err];
  $ver = cfg('SHOPIFY_API_VERSION', '2026-10');
  $orders = []; $after = null;
  for ($page = 0; $page < 8; $page++) {
    $q = 'query($q:String,$after:String){orders(first:100,after:$after,query:$q,sortKey:CREATED_AT,reverse:true){pageInfo{hasNextPage endCursor} nodes{name createdAt test cancelledAt displayFinancialStatus displayFulfillmentStatus totalPriceSet{shopMoney{amount}} totalRefundedSet{shopMoney{amount}} lineItems(first:10){nodes{title quantity}}}}}';
    $r = http_json("https://$domain/admin/api/$ver/graphql.json",
      ['Content-Type: application/json', 'X-Shopify-Access-Token: ' . $token],
      json_encode(['query' => $q, 'variables' => ['q' => "created_at:>=$since", 'after' => $after]]));
    if ($r['code'] !== 200 || !isset($r['json']['data']['orders'])) {
      $msg = $r['json']['errors'][0]['message'] ?? ($r['json']['errors'] ?? null);
      return ['ok' => false, 'error' => 'Shopify: ' . (is_string($msg) ? $msg : ('HTTP ' . $r['code'] . ' ' . $r['error']))];
    }
    $o = $r['json']['data']['orders'];
    foreach ($o['nodes'] as $n) $orders[] = $n;
    if (!$o['pageInfo']['hasNextPage']) break;
    $after = $o['pageInfo']['endCursor'];
  }
  $daily = array_fill_keys($dates, ['orders' => 0, 'revenue' => 0.0]);
  $tot = ['orders' => 0, 'revenue' => 0.0, 'items' => 0, 'cancelled' => 0, 'unfulfilled' => 0];
  $list = []; $products = [];
  foreach ($orders as $n) {
    $day = (new DateTime($n['createdAt']))->setTimezone(new DateTimeZone('Europe/Warsaw'))->format('Y-m-d');
    $total = (float)$n['totalPriceSet']['shopMoney']['amount'] - (float)($n['totalRefundedSet']['shopMoney']['amount'] ?? 0);
    $items = array_map(fn($li) => $li['quantity'] . '× ' . $li['title'], $n['lineItems']['nodes']);
    $valid = !$n['test'] && !$n['cancelledAt'];
    $list[] = ['name' => $n['name'], 'date' => $n['createdAt'], 'total' => round($total, 2), 'items' => implode(', ', $items),
      'status' => $n['cancelledAt'] ? 'anulowane' : ($n['test'] ? 'testowe' : $n['displayFinancialStatus']),
      'fulfillment' => $n['displayFulfillmentStatus'], 'counted' => $valid];
    if (!$valid) { if ($n['cancelledAt']) $tot['cancelled']++; continue; }
    $tot['orders']++; $tot['revenue'] += $total;
    if (isset($daily[$day])) { $daily[$day]['orders']++; $daily[$day]['revenue'] += $total; }
    if ($n['displayFulfillmentStatus'] !== 'FULFILLED') $tot['unfulfilled']++;
    foreach ($n['lineItems']['nodes'] as $li) { $tot['items'] += $li['quantity']; $products[$li['title']] = ($products[$li['title']] ?? 0) + $li['quantity']; }
  }
  arsort($products);
  $out = ['ok' => true, 'totals' => $tot, 'daily' => $daily, 'orders' => array_slice($list, 0, 15), 'products' => $products];
  cache_set($key, $out);
  return $out;
}

// ---------------- Meta (reklamy) ----------------
function meta_data(string $since, string $until, array $dates, bool $fresh): array {
  $token = cfg('META_TOKEN');
  if ($token === '') return ['ok' => false, 'error' => 'Brak klucza Meta (META_TOKEN).'];
  $key = 'meta-' . $since;
  if (!$fresh && ($c = cache_get($key, 600))) return $c;
  $acct = cfg('META_AD_ACCOUNT', '1960712965203736');
  $ver = cfg('META_API_VERSION', 'v22.0');
  $base = "https://graph.facebook.com/$ver/act_$acct/insights";
  $tr = json_encode(['since' => $since, 'until' => $until]);
  $fields = 'spend,impressions,reach,clicks,inline_link_clicks,ctr,cpc,actions,action_values';
  $get = function (array $p) use ($base, $token) {
    $p['access_token'] = $token;
    return http_json($base . '?' . http_build_query($p));
  };
  $purch = function (array $row, string $key): float {
    $best = 0.0;
    foreach ($row[$key] ?? [] as $a) if (in_array($a['action_type'], ['purchase', 'omni_purchase', 'offsite_conversion.fb_pixel_purchase'], true)) $best = max($best, (float)$a['value']);
    return $best;
  };
  $act = function (array $row, string $type): float {
    foreach ($row['actions'] ?? [] as $a) if ($a['action_type'] === $type) return (float)$a['value'];
    return 0.0;
  };
  $r = $get(['fields' => $fields, 'time_range' => $tr, 'time_increment' => 1, 'limit' => 100]);
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
  // zasięg (unikalne osoby) dla całego okresu
  $rr = $get(['fields' => 'reach', 'time_range' => $tr]);
  $tot['reach'] = (int)($rr['json']['data'][0]['reach'] ?? 0);
  $tot['ctr'] = $tot['impressions'] ? $tot['linkClicks'] / $tot['impressions'] * 100 : 0;
  $tot['cpc'] = $tot['linkClicks'] ? $tot['spend'] / $tot['linkClicks'] : 0;
  // kampanie
  $rc = $get(['level' => 'campaign', 'fields' => 'campaign_name,spend,impressions,inline_link_clicks,actions,action_values', 'time_range' => $tr, 'limit' => 50]);
  $campaigns = [];
  foreach ($rc['json']['data'] ?? [] as $row) {
    $campaigns[] = ['name' => $row['campaign_name'], 'spend' => (float)$row['spend'], 'impressions' => (int)$row['impressions'],
      'clicks' => (int)($row['inline_link_clicks'] ?? 0), 'purchases' => $purch($row, 'actions'), 'value' => $purch($row, 'action_values')];
  }
  usort($campaigns, fn($a, $b) => $b['spend'] <=> $a['spend']);
  $out = ['ok' => true, 'totals' => $tot, 'daily' => $daily, 'campaigns' => $campaigns];
  cache_set($key, $out);
  return $out;
}

// ---------------- ruch na stronie ----------------
function traffic_data(array $dates): array {
  $tot = ['pv' => 0, 'visitors' => 0, 'view' => 0, 'add' => 0, 'checkout' => 0];
  $daily = []; $sources = []; $devices = []; $products = []; $pages = []; $funnel = ['pv' => 0, 'view' => 0, 'add' => 0, 'checkout' => 0];
  foreach ($dates as $day) {
    $f = DATA_DIR . "/stats-$day.json";
    $d = is_file($f) ? (json_decode((string)file_get_contents($f), true) ?: []) : [];
    $daily[$day] = ['visitors' => (int)($d['visitors'] ?? 0), 'pv' => (int)($d['pv'] ?? 0)];
    foreach ($tot as $k => $_) $tot[$k] += (int)($d[$k] ?? 0);
    foreach (($d['sources'] ?? []) as $k => $v) $sources[$k] = ($sources[$k] ?? 0) + $v;
    foreach (($d['devices'] ?? []) as $k => $v) $devices[$k] = ($devices[$k] ?? 0) + $v;
    foreach (($d['pages'] ?? []) as $k => $v) $pages[$k] = ($pages[$k] ?? 0) + $v;
    foreach (($d['funnel'] ?? []) as $k => $v) $funnel[$k] = ($funnel[$k] ?? 0) + $v;
    foreach (($d['products'] ?? []) as $k => $v) foreach ($v as $kk => $vv) $products[$k][$kk] = ($products[$k][$kk] ?? 0) + $vv;
  }
  arsort($sources); arsort($pages);
  return ['ok' => true, 'totals' => $tot, 'daily' => $daily, 'sources' => $sources, 'devices' => $devices,
    'products' => $products, 'pages' => array_slice($pages, 0, 8, true), 'funnel' => $funnel];
}

$shop = shopify_data($sinceS, $dates, $fresh);
$meta = meta_data($sinceS, $untilS, $dates, $fresh);
$traffic = traffic_data($dates);

$rev = $shop['ok'] ? $shop['totals']['revenue'] : null;
$ord = $shop['ok'] ? $shop['totals']['orders'] : null;
$spend = $meta['ok'] ? $meta['totals']['spend'] : null;
$kpi = [
  'revenue' => $rev, 'orders' => $ord,
  'aov' => ($ord ?? 0) > 0 ? $rev / $ord : null,
  'spend' => $spend,
  'roas' => ($spend ?? 0) > 0 && $rev !== null ? $rev / $spend : null,
  'cpa' => ($ord ?? 0) > 0 && $spend !== null ? $spend / $ord : null,
  'visitors' => $traffic['totals']['visitors'],
  'conversion' => $traffic['totals']['visitors'] > 0 && $ord !== null ? $ord / $traffic['totals']['visitors'] * 100 : null,
];

echo json_encode(['range' => $range, 'since' => $sinceS, 'until' => $untilS, 'dates' => $dates, 'kpi' => $kpi,
  'shopify' => $shop, 'meta' => $meta, 'traffic' => $traffic, 'generated' => date('H:i')], JSON_UNESCAPED_UNICODE);
