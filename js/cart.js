import { PRODUCTS, SHOP, SHOPIFY } from './data.js';
import { syncProducts, gql } from './shopify.js';

const KEY = 'winterdip-cart';
const fmt = (n) => n.toFixed(2).replace('.', ',').replace(',00', '') + ' ' + SHOP.currency;

let items = load();

function load() {
  try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; }
}
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(items)); } catch {}
}

export function count() { return Object.values(items).reduce((a, b) => a + b, 0); }
export function subtotal() {
  return Object.entries(items).reduce((s, [id, q]) => s + (PRODUCTS[id]?.price || 0) * q, 0);
}

export function add(id, qty = 1) {
  if (!PRODUCTS[id] || PRODUCTS[id].soldOut) return;
  items[id] = (items[id] || 0) + qty;
  save(); render(); bump();
  toast(`Dodano: ${PRODUCTS[id].name}`);
}
function setQty(id, q) {
  if (q <= 0) delete items[id]; else items[id] = q;
  save(); render();
}

function mediaHTML(p) {
  return `<img src="${p.img}" alt="" loading="lazy">`;
}

function buildDrawer() {
  const wrap = document.createElement('div');
  wrap.innerHTML = `
  <div class="drawer-overlay" data-cart-close></div>
  <aside class="drawer" aria-label="Koszyk" aria-hidden="true">
    <div class="drawer__head"><h3>Twój koszyk</h3><button class="drawer__close" data-cart-close aria-label="Zamknij">×</button></div>
    <div class="ship-bar"><div class="ship-bar__text"></div><div class="ship-bar__track"><div class="ship-bar__fill"></div></div></div>
    <div class="drawer__items"></div>
    <div class="drawer__foot">
      <div class="drawer__total"><span>Razem</span><span class="drawer__sum">0 zł</span></div>
      <button class="btn btn--primary btn--block" data-checkout>Przejdź do kasy
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 5l7 7-7 7"/></svg></button>
      <div class="drawer__trust"><span>🔒 Bezpieczne płatności</span><span>↩ 30 dni na zwrot</span><span>🎁 Pakowanie na prezent</span></div>
    </div>
  </aside>
  <div class="toast-add" role="status" aria-live="polite"></div>`;
  document.body.append(...wrap.children);
}

function render() {
  const n = count();
  document.querySelectorAll('.cart-count').forEach((el) => {
    el.textContent = n; el.classList.toggle('has-items', n > 0);
  });
  const list = document.querySelector('.drawer__items');
  if (!list) return;
  const sum = subtotal();
  const left = Math.max(0, SHOP.freeShippingFrom - sum);
  document.querySelector('.ship-bar__text').innerHTML = left > 0
    ? `Brakuje <b>${fmt(left)}</b> do <b>darmowej dostawy</b>`
    : `🎉 Masz <b>darmową dostawę</b>`;
  document.querySelector('.ship-bar__fill').style.width = Math.min(100, (sum / SHOP.freeShippingFrom) * 100) + '%';
  document.querySelector('.drawer__sum').textContent = fmt(sum + (sum > 0 && left > 0 ? SHOP.shippingCost : 0));

  if (!n) {
    list.innerHTML = `<div class="drawer__empty"><p>Koszyk jest pusty.</p><a class="btn btn--ghost" href="produkty.html">Zobacz kubki</a></div>`;
    return;
  }
  let html = Object.entries(items).map(([id, q]) => {
    const p = PRODUCTS[id];
    return `<div class="c-item">
      ${mediaHTML(p)}
      <div><h5>${p.name}</h5>
        <div class="qty"><button data-dec="${id}" aria-label="Mniej">−</button><span>${q}</span><button data-inc="${id}" aria-label="Więcej">+</button></div>
        <button class="c-item__remove" data-rm="${id}">Usuń</button></div>
      <div class="c-item__price">${fmt(p.price * q)}</div>
    </div>`;
  }).join('');
  if (sum > 0) html += `<p class="drawer__ship">Dostawa: <b>${left > 0 ? fmt(SHOP.shippingCost) : 'gratis'}</b> · dostawa ok. 10–14 dni</p>`;
  list.innerHTML = html;
}

let toastT;
function toast(msg) {
  const el = document.querySelector('.toast-add');
  if (!el) return;
  el.textContent = msg; el.classList.add('show');
  clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('show'), 2200);
}
function bump() {
  document.querySelectorAll('.cart-count').forEach((el) => {
    el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump');
  });
}

export function open() { document.documentElement.classList.add('cart-open'); document.querySelector('.drawer')?.setAttribute('aria-hidden', 'false'); }
export function close() { document.documentElement.classList.remove('cart-open'); document.querySelector('.drawer')?.setAttribute('aria-hidden', 'true'); }

// ---------- kasa: koszyk -> Shopify (Storefront API cartCreate) -> checkoutUrl ----------
async function checkout(btn) {
  const ids = Object.keys(items).filter((id) => items[id] > 0);
  if (!ids.length) return;
  if (!SHOPIFY.domain || !SHOPIFY.storefrontToken) {
    toast('Płatności uruchamiamy za chwilę — napisz do nas, przyjmiemy zamówienie mailowo.');
    return;
  }
  btn.disabled = true;
  await syncProducts();   // ID wariantów i aktualna dostępność z Shopify
  btn.disabled = false;
  if (ids.some((id) => PRODUCTS[id]?.soldOut)) {
    toast('Jeden z produktów właśnie się wyprzedał. Usuń go z koszyka, żeby przejść dalej.');
    return;
  }
  const lines = ids.map((id) => ({ merchandiseId: PRODUCTS[id]?.shopifyVariantId, quantity: items[id] }));
  if (lines.some((l) => !l.merchandiseId)) {
    toast('Jeden z produktów nie jest jeszcze dostępny w kasie. Usuń go z koszyka albo napisz do nas.');
    return;
  }
  btn.disabled = true;
  try {
    const r = await fetch(`https://${SHOPIFY.domain}/api/${SHOPIFY.apiVersion}/graphql.json`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Shopify-Storefront-Access-Token': SHOPIFY.storefrontToken },
      body: JSON.stringify({
        query: 'mutation($input: CartInput!) { cartCreate(input: $input) { cart { checkoutUrl } userErrors { message } } }',
        variables: { input: { lines } },
      }),
    });
    const json = await r.json();
    const url = json?.data?.cartCreate?.cart?.checkoutUrl;
    if (!url) throw new Error(json?.data?.cartCreate?.userErrors?.[0]?.message || json?.errors?.[0]?.message || 'brak checkoutUrl');
    location.href = url;
  } catch (e) {
    console.warn('Shopify checkout', e);
    toast('Nie udało się otworzyć kasy. Spróbuj ponownie za chwilę.');
    btn.disabled = false;
  }
}

export function initCart() {
  buildDrawer();
  render();
  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-add],[data-inc],[data-dec],[data-rm],[data-cart-open],[data-cart-close],[data-checkout]');
    if (!t) return;
    if (t.dataset.add) {
      const qtyEl = t.dataset.qtyFrom && document.querySelector(t.dataset.qtyFrom);
      add(t.dataset.add, qtyEl ? parseInt(qtyEl.textContent, 10) || 1 : 1);
      if (t.dataset.openCart !== undefined) open();
    }
    if (t.dataset.inc) setQty(t.dataset.inc, (items[t.dataset.inc] || 0) + 1);
    if (t.dataset.dec) setQty(t.dataset.dec, (items[t.dataset.dec] || 0) - 1);
    if (t.dataset.rm) setQty(t.dataset.rm, 0);
    if (t.hasAttribute('data-cart-open')) open();
    if (t.hasAttribute('data-cart-close')) close();
    if (t.hasAttribute('data-checkout')) checkout(t);
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
}

export { fmt };
