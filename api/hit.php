<?php
// =========================================================
// Licznik ruchu Winter Dip (bez cookies, bez zapisywania IP).
// Strona wysyła tu zdarzenia: pv (wejście), view (produkt),
// add (dodanie do koszyka), checkout (przejście do kasy).
// Unikalni odwiedzający: skrót (IP + przeglądarka + dzienna sól),
// sól zmienia się codziennie i stara jest kasowana — nie da się
// powiązać osoby między dniami ani odtworzyć IP.
// Dane: admin/data/ (zablokowane dla przeglądarek przez .htaccess).
// =========================================================
header('Content-Type: text/plain; charset=utf-8');
header('Cache-Control: no-store');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); exit; }
$raw = file_get_contents('php://input', false, null, 0, 4096);
$in = json_decode($raw ?: '', true);
if (!is_array($in)) { http_response_code(400); exit; }

$ua = $_SERVER['HTTP_USER_AGENT'] ?? '';
if ($ua === '' || preg_match('/bot|crawl|spider|slurp|preview|facebookexternalhit|headless|lighthouse|pingdom|monitor/i', $ua)) { http_response_code(204); exit; }

$type = in_array($in['t'] ?? '', ['pv', 'view', 'add', 'checkout'], true) ? $in['t'] : null;
if (!$type) { http_response_code(400); exit; }

$tz = new DateTimeZone('Europe/Warsaw');
$day = (new DateTime('now', $tz))->format('Y-m-d');
$dir = dirname(__DIR__) . '/admin/data';
if (!is_dir($dir)) @mkdir($dir, 0750, true);

// ---- dzienna sól (stare sole są kasowane) ----
$saltFile = "$dir/salt-$day.txt";
if (!is_file($saltFile)) {
  foreach (glob("$dir/salt-*.txt") ?: [] as $old) @unlink($old);
  foreach (glob("$dir/uniq-*.txt") ?: [] as $old) if (basename($old) !== "uniq-$day.txt") @unlink($old);
  @file_put_contents($saltFile, bin2hex(random_bytes(16)), LOCK_EX);
}
$salt = (string)@file_get_contents($saltFile);
$ip = $_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'] ?? '';
$ip = trim(explode(',', $ip)[0]);
$vid = substr(hash('sha256', $salt . '|' . $ip . '|' . $ua), 0, 16);

// ---- źródło ruchu ----
$src = strtolower((string)($in['s'] ?? ''));
$ref = strtolower((string)($in['r'] ?? ''));
$source = 'bezpośrednio';
$hay = $src . ' ' . $ref;
if (preg_match('/facebook|fb\b|fbclid/', $hay)) $source = 'Facebook';
elseif (str_contains($hay, 'instagram') || preg_match('/\big\b/', $hay)) $source = 'Instagram';
elseif (str_contains($hay, 'tiktok')) $source = 'TikTok';
elseif (str_contains($hay, 'google')) $source = 'Google';
elseif ($ref !== '' && !str_contains($ref, 'winterdip.pl') && !str_contains($ref, 'myshopify.com')) $source = 'inne strony';
$device = preg_match('/mobile|android|iphone|ipad/i', $ua) ? 'telefon' : 'komputer';
$product = preg_replace('/[^a-z0-9\-]/', '', (string)($in['p'] ?? ''));
$path = substr(preg_replace('/[^a-zA-Z0-9\-\._\/?=&]/', '', (string)($in['u'] ?? '/')), 0, 80);
$path = preg_replace('/[?&](fbclid|gclid|ttclid|utm_[a-z]+)=[^&]*/', '', $path);

// ---- zapis (z blokadą pliku) ----
$file = "$dir/stats-$day.json";
$fh = fopen($file, 'c+');
if (!$fh) { http_response_code(500); exit; }
flock($fh, LOCK_EX);
$d = json_decode(stream_get_contents($fh) ?: '', true) ?: [];
$d += ['pv' => 0, 'visitors' => 0, 'view' => 0, 'add' => 0, 'checkout' => 0, 'sources' => [], 'devices' => [], 'products' => [], 'pages' => [], 'funnel' => []];

$uniqFile = "$dir/uniq-$day.txt";
$seen = is_file($uniqFile) ? array_flip(file($uniqFile, FILE_IGNORE_NEW_LINES) ?: []) : [];
$isNew = !isset($seen[$vid]);
if ($isNew) {
  file_put_contents($uniqFile, $vid . "\n", FILE_APPEND | LOCK_EX);
  $d['visitors']++;
  $d['sources'][$source] = ($d['sources'][$source] ?? 0) + 1;
  $d['devices'][$device] = ($d['devices'][$device] ?? 0) + 1;
}
// lejek: ile osób (nie kliknięć) doszło do danego kroku
$marker = "$vid#$type";
if (!isset($seen[$marker])) {
  file_put_contents($uniqFile, $marker . "\n", FILE_APPEND | LOCK_EX);
  $d['funnel'][$type] = ($d['funnel'][$type] ?? 0) + 1;
}

if ($type === 'pv') {
  $d['pv']++; $d['pages'][$path] = ($d['pages'][$path] ?? 0) + 1;
  $h = (int)(new DateTime('now', $tz))->format('G');
  $d['hours'][$h] = ($d['hours'][$h] ?? 0) + 1;
}
else $d[$type]++;
if ($product !== '' && $type !== 'pv') {
  $d['products'][$product] ??= ['view' => 0, 'add' => 0, 'checkout' => 0];
  $d['products'][$product][$type] = ($d['products'][$product][$type] ?? 0) + 1;
}

ftruncate($fh, 0); rewind($fh);
fwrite($fh, json_encode($d, JSON_UNESCAPED_UNICODE));
fflush($fh); flock($fh, LOCK_UN); fclose($fh);
http_response_code(204);
