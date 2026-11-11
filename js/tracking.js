// =========================================================
// Śledzenie reklam (Meta Pixel, TikTok Pixel) + zgoda na cookies (RODO).
// ID pikseli wpisz w TRACKING w js/data.js. Bez ID nic się nie ładuje
// i baner się nie pokazuje. Piksele ładują się dopiero po zgodzie.
// Zdarzenia: PageView, ViewContent (strona produktu), AddToCart,
// InitiateCheckout. Zakup (Purchase) liczy kasa Shopify przez aplikację
// „Facebook i Instagram” / „TikTok” w Shopify.
// =========================================================
import { TRACKING } from './data.js?v=22';

const KEY = 'winterdip-consent';
const on = () => !!(TRACKING.metaPixel || TRACKING.tiktokPixel);
let loaded = false;
const queue = [];

function getConsent() { try { return localStorage.getItem(KEY); } catch { return null; } }
function setConsent(v) { try { localStorage.setItem(KEY, v); } catch {} }

function loadMeta(id) {
  /* eslint-disable */
  !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};
  if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
  t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
  /* eslint-enable */
  window.fbq('init', id);
  window.fbq('track', 'PageView');
}
function loadTikTok(id) {
  /* eslint-disable */
  !function (w, d, t) {w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=r,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var o=document.createElement("script");o.type="text/javascript",o.async=!0,o.src=r+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};
  ttq.load(id);ttq.page();}(window, document, 'ttq');
  /* eslint-enable */
}

function load() {
  if (loaded || !on()) return;
  loaded = true;
  if (TRACKING.metaPixel) loadMeta(TRACKING.metaPixel);
  if (TRACKING.tiktokPixel) loadTikTok(TRACKING.tiktokPixel);
  queue.splice(0).forEach(([n, d]) => send(n, d));
}

const TT = { ViewContent: 'ViewContent', AddToCart: 'AddToCart', InitiateCheckout: 'InitiateCheckout' };
function send(name, data) {
  if (window.fbq) window.fbq('track', name, data);
  if (window.ttq && TT[name]) window.ttq.track(TT[name], {
    contents: (data.content_ids || []).map((id) => ({ content_id: id, content_type: 'product', content_name: data.content_name })),
    value: data.value, currency: data.currency,
  });
}

// zdarzenie reklamowe; przed zgodą czeka w kolejce (wysyłane tylko po akceptacji)
export function track(name, data = {}) {
  if (!on()) return;
  const d = { currency: 'PLN', ...data };
  if (loaded) send(name, d); else queue.push([name, d]);
}

function banner() {
  const el = document.createElement('div');
  el.className = 'consent';
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-label', 'Zgoda na pliki cookies');
  el.innerHTML = `
    <p><b>Pliki cookies</b>Używamy cookies, żeby sklep działał, oraz — za Twoją zgodą — do mierzenia skuteczności reklam (Meta, TikTok). Możesz to zmienić w każdej chwili w stopce („Ustawienia cookies”).</p>
    <div class="consent__btns">
      <button class="btn btn--ghost" data-consent="no">Tylko niezbędne</button>
      <button class="btn btn--primary" data-consent="yes">Akceptuję</button>
    </div>`;
  document.body.append(el);
  requestAnimationFrame(() => el.classList.add('is-in'));
  el.addEventListener('click', (e) => {
    const b = e.target.closest('[data-consent]');
    if (!b) return;
    const yes = b.dataset.consent === 'yes';
    setConsent(yes ? 'yes' : 'no');
    el.classList.remove('is-in');
    setTimeout(() => el.remove(), 400);
    if (yes) load(); else if (loaded) location.reload();
  });
}

export function initTracking() {
  if (!on()) return;
  const c = getConsent();
  if (c === 'yes') load();
  else if (c !== 'no') banner();
  // link w stopce: ponowny wybór
  document.addEventListener('click', (e) => {
    if (!e.target.closest('[data-cookie-settings]')) return;
    e.preventDefault();
    if (!document.querySelector('.consent')) banner();
  });
}
