// Dopisuje skrypt przekierowania (shopify-przekierowanie.txt) zaraz po <head> w layout/theme.liquid
// opublikowanego motywu. Nie wypisuje żadnych kluczy. Uruchamiane z GitHub Actions.
import { readFileSync } from 'node:fs';

const DOMAIN = 'wmqk7f-cr.myshopify.com';
const VER = '2026-10';
const MARK = '/* winterdip.pl redirect */';
const snippet = readFileSync(new URL('../shopify-przekierowanie.txt', import.meta.url), 'utf8').trim();

async function token() {
  if (!process.env.SHOPIFY_CLIENT_ID && process.env.SHOPIFY_ADMIN_TOKEN) return process.env.SHOPIFY_ADMIN_TOKEN;
  const r = await fetch(`https://${DOMAIN}/admin/oauth/access_token`, {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'client_credentials', client_id: process.env.SHOPIFY_CLIENT_ID, client_secret: process.env.SHOPIFY_CLIENT_SECRET }),
  });
  const j = await r.json();
  if (!j.access_token) throw new Error('Brak tokenu: HTTP ' + r.status + ' ' + (j.error_description || j.error || ''));
  return j.access_token;
}

const t = await token();
const gql = async (query, variables = {}) => {
  const r = await fetch(`https://${DOMAIN}/admin/api/${VER}/graphql.json`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': t },
    body: JSON.stringify({ query, variables }),
  });
  const j = await r.json();
  if (j.errors) throw new Error(JSON.stringify(j.errors).slice(0, 500));
  return j.data;
};

const scopes = (await gql('{ currentAppInstallation { accessScopes { handle } } }')).currentAppInstallation.accessScopes.map((s) => s.handle);
console.log('Uprawnienia aplikacji:', scopes.join(', '));
if (!scopes.includes('write_themes')) {
  console.log('BRAK write_themes — trzeba dodać to uprawnienie w Dev Dashboard (Konfiguracja → Zakresy) i zainstalować nową wersję.');
  process.exit(2);
}

const th = await gql(`{ themes(first: 10, roles: [MAIN]) { nodes { id name files(filenames: ["layout/theme.liquid"]) { nodes { body { ... on OnlineStoreThemeFileBodyText { content } } } } } } }`);
const theme = th.themes.nodes[0];
const content = theme.files.nodes[0].body.content;
console.log('Motyw:', theme.name);
if (content.includes(MARK)) { console.log('Przekierowanie już jest w motywie — nic nie zmieniam.'); process.exit(0); }
const i = content.indexOf('<head>');
if (i < 0) throw new Error('Nie znaleziono <head> w theme.liquid');
const next = content.slice(0, i + 6) + '\n    ' + snippet + content.slice(i + 6);

const res = await gql(`mutation($id: ID!, $files: [OnlineStoreThemeFilesUpsertFileInput!]!) {
  themeFilesUpsert(themeId: $id, files: $files) { upsertedThemeFiles { filename } userErrors { field message } } }`,
  { id: theme.id, files: [{ filename: 'layout/theme.liquid', body: { type: 'TEXT', value: next } }] });
const ue = res.themeFilesUpsert.userErrors;
if (ue.length) { console.log('Błędy:', JSON.stringify(ue)); process.exit(1); }
console.log('Zapisano:', res.themeFilesUpsert.upsertedThemeFiles.map((f) => f.filename).join(', '));
