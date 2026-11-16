// Koszyk — wersja DE/AT (EN/DE). Kasa: Shopify cartCreate z rynkiem DE/AT, EUR, język EN/DE.
import { PRODUCTS, SHOPIFY, COUNTRY } from './data.js';
import { syncProducts, SF_LANG } from './shopify.js';
import { T, t, money as fmt } from './i18n.js';
import { track } from './tracking.js';
import { hit } from './stats.js';

const KEY = 'winterdip-cart-eu';
let items = load();
function load() { try { const o = JSON.parse(localStorage.getItem(KEY)) || {}; Object.keys(o).forEach((k) => { if (!PRODUCTS[k]) delete o[k]; }); return o; } catch { return {}; } }
function save() { try { localStorage.setItem(KEY, JSON.stringify(items)); } catch {} }

export function count() { return Object.values(items).reduce((a, b) => a + b, 0); }
export function subtotal() { return Object.entries(items).reduce((s, [id, q]) => s + (PRODUCTS[id]?.price || 0) * q, 0); }

export function add(id, qty = 1) {
  if (!PRODUCTS[id] || PRODUCTS[id].soldOut) return;
  items[id] = (items[id] || 0) + qty;
  save(); render(); bump();
  toast(t('added', { name: PRODUCTS[id].name }));
  hit('add', 'eu-' + id);
  track('AddToCart', { content_ids: [id], content_name: PRODUCTS[id].name, content_type: 'product', value: PRODUCTS[id].price * qty });
}
function setQty(id, q) { if (q <= 0) delete items[id]; else items[id] = q; save(); render(); }

function buildDrawer() {
  const wrap = document.createElement('div');
  wrap.innerHTML = `
  <div class="drawer-overlay" data-cart-close></div>
  <aside class="drawer" aria-label="${T.cart}" aria-hidden="true">
    <div class="drawer__head"><h3>${T.cart_title}</h3><button class="drawer__close" data-cart-close aria-label="${T.close}">×</button></div>
    <div class="ship-bar"><div class="ship-bar__text">${T.ship_bar}</div><div class="ship-bar__track"><div class="ship-bar__fill" style="width:100%"></div></div></div>
    <div class="drawer__items"></div>
    <div class="drawer__foot">
      <div class="drawer__total"><span>${T.total}</span><span class="drawer__sum">${fmt(0)}</span></div>
      <button class="btn btn--primary btn--block" data-checkout>${T.checkout}
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 5l7 7-7 7"/></svg></button>
      <div class="drawer__trust"><span>${T.trust_pay}</span><span>${T.trust_ret}</span><span>${T.trust_track}</span></div>
    </div>
  </aside>
  <div class="toast-add" role="status" aria-live="polite"></div>`;
  document.body.append(...wrap.children);
}

function render() {
  const n = count();
  document.querySelectorAll('.cart-count').forEach((el) => { el.textContent = n; el.classList.toggle('has-items', n > 0); });
  const list = document.querySelector('.drawer__items');
  if (!list) return;
  const sum = subtotal();
  document.querySelector('.drawer__sum').textContent = fmt(sum);
  if (!n) { list.innerHTML = `<div class="drawer__empty"><p>${T.empty}</p><a class="btn btn--ghost" href="eu/shop.html">${T.see_mugs}</a></div>`; return; }
  let html = Object.entries(items).map(([id, q]) => {
    const p = PRODUCTS[id];
    return `<div class="c-item">
      <img src="${p.img}" alt="" loading="lazy">
      <div><h5>${p.name}</h5>
        <div class="qty"><button data-dec="${id}" aria-label="${T.less}">−</button><span>${q}</span><button data-inc="${id}" aria-label="${T.more}">+</button></div>
        <button class="c-item__remove" data-rm="${id}">${T.remove}</button></div>
      <div class="c-item__price">${fmt(p.price * q)}</div>
    </div>`;
  }).join('');
  html += `<p class="drawer__ship">${t('drawer_ship')}</p>`;
  list.innerHTML = html;
}

let toastT;
function toast(msg) {
  const el = document.querySelector('.toast-add');
  if (!el) return;
  el.textContent = msg; el.classList.add('show');
  clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('show'), 2400);
}
function bump() { document.querySelectorAll('.cart-count').forEach((el) => { el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); }); }

export function open() { document.documentElement.classList.add('cart-open'); document.querySelector('.drawer')?.setAttribute('aria-hidden', 'false'); }
export function close() { document.documentElement.classList.remove('cart-open'); document.querySelector('.drawer')?.setAttribute('aria-hidden', 'true'); }

async function checkout(btn) {
  const ids = Object.keys(items).filter((id) => items[id] > 0 && PRODUCTS[id]);
  if (!ids.length) return;
  btn.disabled = true;
  await syncProducts();
  btn.disabled = false;
  if (ids.some((id) => PRODUCTS[id]?.soldOut)) { toast(T.err_sold); return; }
  const lines = ids.map((id) => ({ merchandiseId: PRODUCTS[id]?.shopifyVariantId, quantity: items[id] }));
  if (lines.some((l) => !l.merchandiseId)) { toast(T.err_load); return; }
  btn.disabled = true;
  try {
    const r = await fetch(`https://${SHOPIFY.domain}/api/${SHOPIFY.apiVersion}/graphql.json`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Shopify-Storefront-Access-Token': SHOPIFY.storefrontToken },
      body: JSON.stringify({
        query: `mutation($input: CartInput!) @inContext(country: ${COUNTRY}, language: ${SF_LANG}) { cartCreate(input: $input) { cart { checkoutUrl } userErrors { message } } }`,
        variables: { input: { lines, buyerIdentity: { countryCode: COUNTRY } } },
      }),
    });
    const json = await r.json();
    const url = json?.data?.cartCreate?.cart?.checkoutUrl;
    if (!url) throw new Error(json?.data?.cartCreate?.userErrors?.[0]?.message || json?.errors?.[0]?.message || 'no checkoutUrl');
    hit('checkout', ids.length === 1 ? 'eu-' + ids[0] : 'eu');
    track('InitiateCheckout', { content_ids: ids, num_items: count(), value: subtotal() });
    const u = new URL(url); u.searchParams.set('locale', SF_LANG.toLowerCase());
    setTimeout(() => { location.href = u.toString(); }, 250);
  } catch (e) {
    console.warn('Shopify checkout', e);
    toast(T.err_open);
    btn.disabled = false;
  }
}

export function initCart() {
  buildDrawer();
  render();
  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-add],[data-inc],[data-dec],[data-rm],[data-cart-open],[data-cart-close],[data-checkout]');
    if (!el) return;
    if (el.dataset.add) {
      const qtyEl = el.dataset.qtyFrom && document.querySelector(el.dataset.qtyFrom);
      add(el.dataset.add, qtyEl ? parseInt(qtyEl.textContent, 10) || 1 : 1);
      if (el.dataset.openCart !== undefined) open();
    }
    if (el.dataset.inc) setQty(el.dataset.inc, (items[el.dataset.inc] || 0) + 1);
    if (el.dataset.dec) setQty(el.dataset.dec, (items[el.dataset.dec] || 0) - 1);
    if (el.dataset.rm) setQty(el.dataset.rm, 0);
    if (el.hasAttribute('data-cart-open')) open();
    if (el.hasAttribute('data-cart-close')) close();
    if (el.hasAttribute('data-checkout')) checkout(el);
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
}

export { fmt };
