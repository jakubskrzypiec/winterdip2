// =========================================================
// Własny licznik ruchu do panelu /admin (bez cookies i bez danych
// osobowych — dlatego działa bez zgody na cookies).
// Zdarzenia: pv (wejście na stronę), view (produkt), add (koszyk),
// checkout (przejście do kasy).
// =========================================================
const URL_HIT = 'api/hit.php';
const params = new URLSearchParams(location.search);
const source = params.get('utm_source')
  || (params.has('fbclid') ? 'facebook' : '')
  || (params.has('gclid') ? 'google' : '')
  || (params.has('ttclid') ? 'tiktok' : '');

export function hit(t, product = '') {
  if (location.hostname !== 'winterdip.pl') return;   // tylko strona produkcyjna
  try {
    const body = JSON.stringify({ t, p: product, s: source, r: document.referrer, u: location.pathname + location.search });
    const blob = new Blob([body], { type: 'application/json' });
    if (!(navigator.sendBeacon && navigator.sendBeacon(URL_HIT, blob))) {
      fetch(URL_HIT, { method: 'POST', body, keepalive: true, headers: { 'Content-Type': 'application/json' } }).catch(() => {});
    }
  } catch {}
}
