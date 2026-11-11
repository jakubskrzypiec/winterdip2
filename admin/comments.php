<?php
// =========================================================
// Panel Winter Dip — posty i komentarze z Facebooka i Instagrama
// (również komentarze pod reklamami). Wymaga zalogowania.
//   GET               — lista postów i komentarzy (&fresh=1 pomija cache)
//   POST {action, platform, id} — hide | unhide | delete komentarza
// Token: META_PAGE_TOKEN (jeśli ustawiony) albo META_TOKEN użytkownika systemowego
// z uprawnieniami: pages_show_list, pages_read_engagement, pages_read_user_content,
// pages_manage_engagement, instagram_basic, instagram_manage_comments.
// =========================================================
declare(strict_types=1);
require __DIR__ . '/lib.php';
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
if (!logged_in()) { http_response_code(401); echo json_encode(['error' => 'auth']); exit; }

const G_VER = 'v22.0';
$sysToken = cfg('META_PAGE_TOKEN') ?: cfg('META_TOKEN');
$pageId = cfg('META_PAGE_ID', '1486793111174589');
$acct = cfg('META_AD_ACCOUNT', '1960712965203736');

function g(string $path, array $p, string $token, string $method = 'GET'): array {
  $url = 'https://graph.facebook.com/' . cfg('META_API_VERSION', G_VER) . '/' . $path;
  $p['access_token'] = $token;
  if ($method === 'GET') return http_json($url . '?' . http_build_query($p));
  if ($method === 'DELETE') return http_json($url . '?' . http_build_query($p), [], null, 'DELETE');
  return http_json($url, ['Content-Type: application/x-www-form-urlencoded'], http_build_query($p), $method);
}
function gerr(array $r): string { return $r['json']['error']['message'] ?? ('HTTP ' . $r['code'] . ' ' . $r['error']); }

function out(array $a, int $code = 200): void { http_response_code($code); echo json_encode($a, JSON_UNESCAPED_UNICODE); exit; }

// token strony + konto Instagram (cache 1 h)
function page_ctx(string $pageId, string $sysToken, string &$err): ?array {
  if ($sysToken === '') { $err = 'Brak klucza Meta (META_TOKEN).'; return null; }
  $c = cache_get('page-ctx', 3600);
  if (is_array($c) && !empty($c['t'])) return $c;
  $r = g($pageId, ['fields' => 'access_token,name,instagram_business_account{id,username}'], $sysToken);
  $t = $r['json']['access_token'] ?? '';
  if ($t === '') { $err = 'Klucz Meta nie ma dostępu do strony Winterdip (' . gerr($r) . ').'; return null; }
  $ctx = ['t' => $t, 'name' => $r['json']['name'] ?? '', 'ig' => $r['json']['instagram_business_account']['id'] ?? '',
    'igUser' => $r['json']['instagram_business_account']['username'] ?? ''];
  cache_set('page-ctx', $ctx);
  return $ctx;
}

// prosty wykrywacz negatywnych komentarzy (do szybkiego przejrzenia — decyzja zawsze należy do Ciebie)
function is_negative(string $t): bool {
  return (bool)preg_match('/(oszust|oszuk|scam|fake|ściem|sciem|kradzie|złodzie|zlodzie|wyłudz|wyludz|nie przysz|nie dotar|nie doszł|nie doszl|nie polecam|badziew|szajs|syf|chłam|chlam|tandet|beznadziej|kpin|porażk|porazk|dno\b|żal\b|zal\b|aliexpress|ali express|shein|wish\b|chińsk|chinsk|dropship|zwrot|reklamacj|pieniądz|pieniadz|naciąg|naciag|gówn|gown|kurw|chuj|huj|jeb|pierdol|spierdal|debil|idiot|frajer|zjeb)/iu', $t);
}

// ---------------- akcje: ukryj / pokaż / usuń ----------------
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  if (($_SERVER['HTTP_X_WD'] ?? '') !== '1') out(['ok' => false, 'error' => 'Złe żądanie.'], 400);
  $in = json_decode((string)file_get_contents('php://input'), true) ?: [];
  $action = $in['action'] ?? ''; $platform = $in['platform'] ?? ''; $id = (string)($in['id'] ?? '');
  if (!in_array($action, ['hide', 'unhide', 'delete'], true) || !in_array($platform, ['fb', 'ig'], true) || !preg_match('/^[0-9_]{5,60}$/', $id)) out(['ok' => false, 'error' => 'Złe dane.'], 400);
  $err = '';
  $ctx = page_ctx($pageId, $sysToken, $err);
  if (!$ctx) out(['ok' => false, 'error' => $err], 400);
  if ($action === 'delete') $r = g($id, [], $ctx['t'], 'DELETE');
  elseif ($platform === 'fb') $r = g($id, ['is_hidden' => $action === 'hide' ? 'true' : 'false'], $ctx['t'], 'POST');
  else $r = g($id, ['hide' => $action === 'hide' ? 'true' : 'false'], $ctx['t'], 'POST');
  $ok = $r['code'] === 200 && (($r['json']['success'] ?? false) === true || isset($r['json']['id']));
  cache_del('comments');
  out($ok ? ['ok' => true] : ['ok' => false, 'error' => 'Meta: ' . gerr($r)], $ok ? 200 : 400);
}

// ---------------- lista ----------------
if (!isset($_GET['fresh']) && ($c = cache_get('comments', 90))) out($c);
$err = '';
$ctx = page_ctx($pageId, $sysToken, $err);
if (!$ctx) out(['ok' => false, 'needsPerms' => true, 'error' => $err]);
$pt = $ctx['t']; $errors = [];

$fbFields = 'id,message,created_time,permalink_url,full_picture,comments.filter(stream).order(reverse_chronological).limit(40).summary(true){id,message,from{name},created_time,is_hidden,can_hide,can_remove,permalink_url}';
$igFields = 'id,caption,media_type,thumbnail_url,media_url,permalink,timestamp,comments_count,comments.limit(40){id,text,username,timestamp,hidden,like_count}';

$posts = [];
$addFb = function (array $p, ?string $ad = null) use (&$posts) {
  $key = 'fb:' . $p['id'];
  if (isset($posts[$key])) { if ($ad) $posts[$key]['ad'] = $ad; return; }
  $cm = [];
  foreach ($p['comments']['data'] ?? [] as $c) {
    $txt = (string)($c['message'] ?? '');
    $cm[] = ['id' => $c['id'], 'text' => $txt, 'author' => $c['from']['name'] ?? 'Użytkownik Facebooka', 'time' => $c['created_time'] ?? '',
      'hidden' => (bool)($c['is_hidden'] ?? false), 'canHide' => (bool)($c['can_hide'] ?? true), 'canDelete' => (bool)($c['can_remove'] ?? true),
      'link' => $c['permalink_url'] ?? ($p['permalink_url'] ?? ''), 'flag' => is_negative($txt)];
  }
  $posts[$key] = ['key' => $key, 'platform' => 'fb', 'id' => $p['id'], 'text' => (string)($p['message'] ?? ''), 'time' => $p['created_time'] ?? '',
    'link' => $p['permalink_url'] ?? '', 'img' => $p['full_picture'] ?? '', 'ad' => $ad,
    'count' => (int)($p['comments']['summary']['total_count'] ?? count($cm)), 'comments' => $cm];
};
$addIg = function (array $m, ?string $ad = null) use (&$posts) {
  $key = 'ig:' . $m['id'];
  if (isset($posts[$key])) { if ($ad) $posts[$key]['ad'] = $ad; return; }
  $cm = [];
  foreach ($m['comments']['data'] ?? [] as $c) {
    $txt = (string)($c['text'] ?? '');
    $cm[] = ['id' => $c['id'], 'text' => $txt, 'author' => '@' . ($c['username'] ?? 'instagram'), 'time' => $c['timestamp'] ?? '',
      'hidden' => (bool)($c['hidden'] ?? false), 'canHide' => true, 'canDelete' => true, 'link' => $m['permalink'] ?? '', 'flag' => is_negative($txt)];
  }
  $posts[$key] = ['key' => $key, 'platform' => 'ig', 'id' => $m['id'], 'text' => (string)($m['caption'] ?? ''), 'time' => $m['timestamp'] ?? '',
    'link' => $m['permalink'] ?? '', 'img' => $m['thumbnail_url'] ?? ($m['media_url'] ?? ''), 'ad' => $ad,
    'count' => (int)($m['comments_count'] ?? count($cm)), 'comments' => $cm];
};

// 1) reklamy — ich posty (także „ukryte” posty reklamowe, których nie ma na osi czasu)
$adFb = []; $adIg = [];
$ra = g("act_$acct/ads", ['fields' => 'name,effective_status,creative{effective_object_story_id,effective_instagram_media_id}', 'limit' => 60], $sysToken);
foreach ($ra['json']['data'] ?? [] as $a) {
  if (in_array($a['effective_status'] ?? '', ['DELETED', 'ARCHIVED'], true)) continue;
  if (!empty($a['creative']['effective_object_story_id'])) $adFb[$a['creative']['effective_object_story_id']] = $a['name'];
  if (!empty($a['creative']['effective_instagram_media_id'])) $adIg[$a['creative']['effective_instagram_media_id']] = $a['name'];
}
if ($adFb) {
  $r = g('', ['ids' => implode(',', array_keys($adFb)), 'fields' => $fbFields], $pt);
  if ($r['code'] === 200) foreach ($r['json'] ?? [] as $id => $p) $addFb($p, $adFb[$id] ?? null);
  else $errors[] = 'Reklamy (Facebook): ' . gerr($r);
}
if ($adIg) {
  $r = g('', ['ids' => implode(',', array_keys($adIg)), 'fields' => $igFields], $pt);
  if ($r['code'] === 200) foreach ($r['json'] ?? [] as $id => $m) $addIg($m, $adIg[$id] ?? null);
  else $errors[] = 'Reklamy (Instagram): ' . gerr($r);
}

// 2) posty strony na Facebooku
$r = g("$pageId/posts", ['fields' => $fbFields, 'limit' => 12], $pt);
if ($r['code'] === 200) foreach ($r['json']['data'] ?? [] as $p) $addFb($p);
else $errors[] = 'Facebook: ' . gerr($r);

// 3) posty na Instagramie
if ($ctx['ig'] !== '') {
  $r = g($ctx['ig'] . '/media', ['fields' => $igFields, 'limit' => 12], $pt);
  if ($r['code'] === 200) foreach ($r['json']['data'] ?? [] as $m) $addIg($m);
  else $errors[] = 'Instagram: ' . gerr($r);
} else $errors[] = 'Instagram: do strony Winterdip nie jest podpięte konto firmowe Instagram.';

$posts = array_values($posts);
usort($posts, fn($a, $b) => strcmp($b['time'], $a['time']));
$all = array_merge(...array_map(fn($p) => $p['comments'], $posts ?: [['comments' => []]]));
$res = ['ok' => true, 'page' => $ctx['name'], 'ig' => $ctx['igUser'], 'errors' => $errors, 'posts' => $posts,
  'summary' => ['posts' => count($posts), 'comments' => count($all),
    'flagged' => count(array_filter($all, fn($c) => $c['flag'] && !$c['hidden'])),
    'hidden' => count(array_filter($all, fn($c) => $c['hidden']))],
  'generated' => (new DateTime('now', new DateTimeZone('Europe/Warsaw')))->format('H:i')];
cache_set('comments', $res);
out($res);
