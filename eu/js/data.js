// =========================================================
// Wersja międzynarodowa (DE + AT): dane sklepu. Teksty są w i18n.js.
// Ceny w EUR pobierane z Shopify (rynek „Niemcy i Austria”, stała cena 16,99 €);
// wartości poniżej działają tylko, dopóki Shopify nie odpowie.
// Bez wyprzedaży i przekreślonych cen (brak historii cen na tym rynku — Omnibus/UWG).
// =========================================================
import { T, COUNTRY } from './i18n.js';
export { COUNTRY };

export const SHOP = {
  deliveryMaxDays: 12,                                  // do daty „arrives by …”
  christmasCutoff: '2026-12-05T23:59:59+01:00',
};

// Dane sprzedawcy (Impressum, AGB, Widerruf). Bez NIP/VAT — działalność nierejestrowana.
export const SELLER = {
  name: 'Jakub Skrzypiec',
  street: 'Radoszowska 108',
  city: '41-707 Ruda Śląska',
  country: 'Polen / Poland',
  email: 'winterrdip@gmail.com',
  phone: '+48 601 863 788',
};

export const TRACKING = { metaPixel: '1110812538488174', tiktokPixel: '' };

export const SHOPIFY = {
  domain: 'wmqk7f-cr.myshopify.com',
  storefrontToken: '6a8d238aa8741fc11ef2d95db0ed99ec',
  apiVersion: '2026-10',
  handles: { 'mug-1': 'kubek-bezowy', 'mug-2': 'kubek-czerwony' },
};

const img = (key) => `assets/products/winter-dips-${key}-01-katalog.webp`;
export const PRODUCTS = {
  'mug-1': { id: 'mug-1', key: 'bezowy', name: T.names['mug-1'], price: 16.99, oldPrice: 0, img: img('bezowy'), shopifyVariantId: '' },
  'mug-2': { id: 'mug-2', key: 'czerwony', name: T.names['mug-2'], price: 16.99, oldPrice: 0, img: img('czerwony'), shopifyVariantId: '' },
};

export const FAQ = T.faq;
