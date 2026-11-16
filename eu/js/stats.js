// Licznik ruchu do panelu /admin — wersja DE (adres oznaczony /de/ w ścieżce).
const URL_HIT = '/api/hit.php';
const params = new URLSearchParams(location.search);
const source = params.get('utm_source')
  || (params.has('fbclid') ? 'facebook' : '')
  || (params.has('gclid') ? 'google' : '')
  || (params.has('ttclid') ? 'tiktok' : '');

export function hit(t, product = '') {
  if (!/(^|\.)winterdip\.(pl|de|at|com)$/.test(location.hostname)) return;
  try {
    const body = JSON.stringify({ t, p: product, s: source, r: document.referrer, u: location.pathname + location.search });
    const blob = new Blob([body], { type: 'application/json' });
    if (!(navigator.sendBeacon && navigator.sendBeacon(URL_HIT, blob))) {
      fetch(URL_HIT, { method: 'POST', body, keepalive: true, headers: { 'Content-Type': 'application/json' } }).catch(() => {});
    }
  } catch {}
}
