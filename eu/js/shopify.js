// Shopify Storefront API — wersja DE/AT: ceny w EUR z rynku Niemcy/Austria (@inContext).
import { SHOPIFY, PRODUCTS, COUNTRY } from './data.js';
import { LANG } from './i18n.js';

export const SF_LANG = LANG === 'en' ? 'EN' : 'DE';
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

const productQuery = () => {
  const fields = 'availableForSale variants(first: 1) { nodes { id availableForSale price { amount currencyCode } } }';
  return `query @inContext(country: ${COUNTRY}, language: ${SF_LANG}) { ` + Object.entries(SHOPIFY.handles)
    .map(([, handle], i) => `p${i}: product(handle: ${JSON.stringify(handle)}) { ${fields} }`).join(' ') + ' }';
};

let syncing = null;
export function syncProducts() {
  if (syncing) return syncing;
  syncing = (async () => {
    if (!shopifyOn()) return false;
    const data = await gql(productQuery());
    Object.keys(SHOPIFY.handles).forEach((id, i) => {
      const p = PRODUCTS[id], sp = data[`p${i}`], v = sp?.variants?.nodes?.[0];
      if (!p || !sp || !v) return;
      p.shopifyVariantId = v.id;
      if (v.price.currencyCode === 'EUR') p.price = Math.round(parseFloat(v.price.amount) * 100) / 100;
      p.oldPrice = 0;
      p.soldOut = !(sp.availableForSale && v.availableForSale);
    });
    return true;
  })().catch((e) => { console.warn('Shopify', e); return false; });
  return syncing;
}

export const syncProductsQuick = (ms = 2500) => Promise.race([syncProducts(), new Promise((r) => setTimeout(() => r(false), ms))]);
