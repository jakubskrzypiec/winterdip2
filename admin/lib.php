<?php
// =========================================================
// Panel Winter Dip — wspólne funkcje: konfiguracja, logowanie, cache.
// Klucze (hasło panelu, token Shopify, token Meta) są w admin/config.php,
// który tworzy wdrożenie z sekretów GitHub — nie ma go w repozytorium.
// =========================================================
declare(strict_types=1);
date_default_timezone_set('Europe/Warsaw');

const DATA_DIR = __DIR__ . '/data';

function cfg(string $key, string $default = ''): string {
  static $c = null;
  if ($c === null) {
    $c = is_file(__DIR__ . '/config.php') ? (require __DIR__ . '/config.php') : [];
    if (!is_array($c)) $c = [];
  }
  $v = $c[$key] ?? '';
  return is_string($v) && $v !== '' ? $v : $default;
}

function start_session(): void {
  if (session_status() === PHP_SESSION_ACTIVE) return;
  session_name('wd_admin');
  session_set_cookie_params(['lifetime' => 0, 'path' => '/admin/', 'secure' => true, 'httponly' => true, 'samesite' => 'Strict']);
  session_start();
}

function logged_in(): bool {
  start_session();
  return !empty($_SESSION['ok']) && ($_SESSION['exp'] ?? 0) > time();
}

function try_login(string $password): bool {
  start_session();
  $real = cfg('ADMIN_PASSWORD');
  if ($real === '' || !hash_equals($real, $password)) { sleep(2); return false; }
  session_regenerate_id(true);
  $_SESSION['ok'] = true;
  $_SESSION['exp'] = time() + 12 * 3600;
  return true;
}

function logout(): void { start_session(); $_SESSION = []; session_destroy(); }

function cache_get(string $key, int $ttl) {
  $f = DATA_DIR . '/cache-' . preg_replace('/[^a-z0-9_\-]/i', '', $key) . '.json';
  if (is_file($f) && filemtime($f) > time() - $ttl) return json_decode((string)file_get_contents($f), true);
  return null;
}
function cache_set(string $key, $value): void {
  if (!is_dir(DATA_DIR)) @mkdir(DATA_DIR, 0750, true);
  @file_put_contents(DATA_DIR . '/cache-' . preg_replace('/[^a-z0-9_\-]/i', '', $key) . '.json', json_encode($value), LOCK_EX);
}

function http_json(string $url, array $headers = [], ?string $body = null): array {
  $ch = curl_init($url);
  curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 20, CURLOPT_CONNECTTIMEOUT => 8,
    CURLOPT_HTTPHEADER => $headers,
  ]);
  if ($body !== null) { curl_setopt($ch, CURLOPT_POST, true); curl_setopt($ch, CURLOPT_POSTFIELDS, $body); }
  $res = curl_exec($ch);
  $code = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
  $err = curl_error($ch);
  curl_close($ch);
  $json = is_string($res) ? json_decode($res, true) : null;
  return ['code' => $code, 'json' => is_array($json) ? $json : null, 'error' => $err];
}
