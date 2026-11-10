// =========================================================
// SHOPIFY (Storefront API)
// Po wpisaniu domeny i tokenu w data.js strona sama pobiera z Shopify:
//  - ID wariantu (potrzebne do kasy),
//  - cenę i cenę przed obniżką („Porównaj z ceną” w Shopify),
//  - dostępność i liczbę sztuk (jeśli token ma dostęp do stanów).
// Produkt na stronie łączy się z produktem w Shopify po „uchwycie”
// (handle) — SHOPIFY.handles w data.js.
// =========================================================
import { SHOPIFY, PRODUCTS } from './data.js';

export const shopifyOn = () => Boolean(SHOPIFY.domain && SHOPIFY.storefrontToken);

export async function gql(query, variables = {}) {
  const r = await fetch(`https://${SHOPIFY.domain}/api/${SHOPIFY.apiVersion}/graphql.json`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Shopify-Storefront-Access-Token': SHOPIFY.storefrontToken },
    body: JSON.stringify({ query, variables }),
  });
  const json = await r.json();
  if (json.errors?.length) throw new Error(json.errors[0].message);
  return json.data;
}

const productQuery = (withStock) => {
  const fields = `availableForSale variants(first: 1) { nodes { id availableForSale ${withStock ? 'quantityAvailable' : ''} price { amount } compareAtPrice { amount } } }`;
  return '{ ' + Object.entries(SHOPIFY.handles || {})
    .map(([id, handle], i) => `p${i}: product(handle: ${JSON.stringify(handle)}) { ${fields} }`).join(' ') + ' }';
};

let syncing = null;
// Uzupełnia PRODUCTS danymi z Shopify. Zwraca true, gdy się udało.
export function syncProducts() {
  if (syncing) return syncing;
  syncing = (async () => {
    if (!shopifyOn() || !Object.keys(SHOPIFY.handles || {}).length) return false;
    let data;
    try { data = await gql(productQuery(true)); }
    catch { data = await gql(productQuery(false)); }   // token bez dostępu do stanów magazynu
    Object.keys(SHOPIFY.handles).forEach((id, i) => {
      const p = PRODUCTS[id], sp = data[`p${i}`], v = sp?.variants?.nodes?.[0];
      if (!p) return;
      if (!sp || !v) { console.warn(`Shopify: nie znaleziono produktu „${SHOPIFY.handles[id]}”`); return; }
      p.shopifyVariantId = v.id;
      p.price = Math.round(parseFloat(v.price.amount) * 100) / 100;
      const compare = v.compareAtPrice ? parseFloat(v.compareAtPrice.amount) : 0;
      p.oldPrice = compare > p.price ? compare : 0;
      p.soldOut = !(sp.availableForSale && v.availableForSale);
      if (typeof v.quantityAvailable === 'number') p.stock = Math.max(0, v.quantityAvailable);
    });
    return true;
  })().catch((e) => { console.warn('Shopify: nie udało się pobrać produktów', e); return false; });
  return syncing;
}

// Czeka na Shopify najwyżej `ms` milisekund (żeby strona nie wisiała przy wolnym łączu).
export const syncProductsQuick = (ms = 2500) => Promise.race([syncProducts(), new Promise((r) => setTimeout(() => r(false), ms))]);

// Linki do regulaminu i polityk generowanych przez Shopify.
export const policyUrl = (name) => `https://${SHOPIFY.domain}/policies/${name}`;
