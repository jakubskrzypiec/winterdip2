<?php
declare(strict_types=1);
require __DIR__ . '/lib.php';
header('X-Robots-Tag: noindex, nofollow');
header('Cache-Control: no-store');
header("Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'");

$error = '';
if (isset($_GET['logout'])) { logout(); header('Location: ./'); exit; }
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  if (try_login((string)($_POST['password'] ?? ''))) { header('Location: ./'); exit; }
  $error = cfg('ADMIN_PASSWORD') === '' ? 'Panel nie ma jeszcze ustawionego hasła (ADMIN_PASSWORD).' : 'Nieprawidłowe hasło.';
}
$in = logged_in();
?><!doctype html>
<html lang="pl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Panel · Winter Dip</title>
<link rel="icon" href="../assets/brand/favicon-32.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@500;600;700&family=Nunito:wght@500;600;700;800&display=swap" rel="stylesheet">
<style>
:root{--snow:#dce0e8;--snow-2:#eef0f4;--pine:#27363f;--pine-2:rgba(39,54,63,.66);--line:rgba(39,54,63,.12);--berry:#6b212c;--berry-2:#a3172b;--ok:#2f7d5b;--warn:#b7791f;--card:#fff;}
*{box-sizing:border-box}
body{margin:0;background:var(--snow);color:var(--pine);font:15px/1.5 Nunito,system-ui,sans-serif;-webkit-font-smoothing:antialiased}
h1,h2,h3,.num{font-family:Poppins,system-ui,sans-serif}
a{color:var(--berry)}
.wrap{max-width:1280px;margin:0 auto;padding:0 20px}
header{position:sticky;top:0;z-index:5;background:var(--pine);color:#fff}
header .wrap{display:flex;align-items:center;gap:16px;height:64px}
header img{height:34px}
header .sp{flex:1}
header a{color:var(--snow);font-weight:700;text-decoration:none;font-size:14px}
.ranges{display:flex;gap:6px;background:rgba(255,255,255,.1);padding:4px;border-radius:99px}
.ranges button{border:0;background:none;color:var(--snow);font:700 13px Nunito;padding:7px 14px;border-radius:99px;cursor:pointer}
.ranges button.on{background:var(--snow);color:var(--pine)}
.btn{border:0;border-radius:99px;background:var(--berry);color:#fff;font:700 14px Nunito;padding:10px 18px;cursor:pointer}
.muted{color:var(--pine-2)}
main{padding:24px 0 60px}
.top{display:flex;align-items:baseline;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:18px}
.top h1{margin:0;font-size:26px}
.kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px}
.card{background:var(--card);border:1px solid var(--line);border-radius:18px;padding:18px 20px}
.kpi .label{font-size:13px;font-weight:800;letter-spacing:.04em;text-transform:uppercase;color:var(--pine-2)}
.kpi .num{font-size:28px;font-weight:600;margin-top:6px;white-space:nowrap}
.kpi .sub{font-size:13px;color:var(--pine-2);margin-top:2px}
.kpi.hl{background:var(--berry);color:#fff;border-color:var(--berry)}
.kpi.hl .label,.kpi.hl .sub{color:rgba(255,255,255,.75)}
.grid2{display:grid;grid-template-columns:minmax(0,2fr) minmax(0,1fr);gap:14px;margin-top:14px}
.grid3{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;margin-top:14px}
.card h2{margin:0 0 12px;font-size:17px}
.chart{position:relative;height:260px}
table{width:100%;border-collapse:collapse;font-size:14px}
th{text-align:left;font-size:12px;letter-spacing:.04em;text-transform:uppercase;color:var(--pine-2);font-weight:800;padding:8px 6px;border-bottom:1px solid var(--line)}
td{padding:9px 6px;border-bottom:1px solid var(--line);vertical-align:top}
td.r,th.r{text-align:right;white-space:nowrap}
tr:last-child td{border-bottom:0}
.bar{height:8px;border-radius:99px;background:var(--snow-2);overflow:hidden;margin-top:6px}
.bar i{display:block;height:100%;background:var(--berry);border-radius:99px}
.row{display:flex;justify-content:space-between;gap:10px;font-weight:700}
.list > div{margin-bottom:12px}
.funnel > div{margin-bottom:14px}
.note{border-radius:14px;padding:12px 14px;background:#fff6e6;color:#6b4a12;font-size:14px;margin-top:14px;border:1px solid #f1d9a8}
.pill{display:inline-block;font-size:12px;font-weight:800;padding:3px 9px;border-radius:99px;background:var(--snow-2)}
.pill.ok{background:#e3f2ea;color:var(--ok)}.pill.bad{background:#f8e3e5;color:var(--berry)}
.login{min-height:100vh;display:grid;place-items:center;padding:20px}
.login form{width:min(380px,100%);background:#fff;border-radius:22px;padding:30px;border:1px solid var(--line);text-align:center}
.login img{height:46px;margin-bottom:12px}
.login input{width:100%;padding:13px 16px;border-radius:12px;border:1px solid var(--line);font:600 16px Nunito;margin:14px 0}
.err{color:var(--berry);font-weight:700;font-size:14px}
.loading{opacity:.5;transition:opacity .2s}
@media (max-width:1000px){.kpis{grid-template-columns:repeat(2,minmax(0,1fr))}.grid2,.grid3{grid-template-columns:minmax(0,1fr)}}
@media (max-width:560px){header .wrap{flex-wrap:wrap;height:auto;padding-top:10px;padding-bottom:10px}.kpi .num{font-size:22px}.ranges button{padding:6px 10px}}
</style>
</head>
<body>
<?php if (!$in): ?>
<div class="login">
  <form method="post" autocomplete="off">
    <img src="../assets/brand/logo-red.webp" alt="Winter Dip">
    <h1 style="margin:0;font-size:22px">Panel sklepu</h1>
    <input type="password" name="password" placeholder="Hasło" autofocus required>
    <?php if ($error): ?><p class="err"><?= htmlspecialchars($error) ?></p><?php endif; ?>
    <button class="btn" style="width:100%">Zaloguj</button>
  </form>
</div>
<?php else: ?>
<header>
  <div class="wrap">
    <img src="../assets/brand/logo-red.webp" alt="Winter Dip" style="filter:brightness(0) invert(1)">
    <div class="sp"></div>
    <div class="ranges" id="ranges">
      <button data-r="today">Dziś</button><button data-r="7" class="on">7 dni</button><button data-r="30">30 dni</button><button data-r="90">90 dni</button>
    </div>
    <a href="#" id="refresh">↻ Odśwież</a>
    <a href="?logout">Wyloguj</a>
  </div>
</header>
<main class="wrap" id="app">
  <div class="top"><h1>Przegląd sklepu</h1><span class="muted" id="period">Ładowanie…</span></div>
  <div id="notes"></div>
  <section class="kpis">
    <div class="card kpi hl"><div class="label">Przychód</div><div class="num" id="k-revenue">—</div><div class="sub" id="k-revenue-sub">&nbsp;</div></div>
    <div class="card kpi"><div class="label">Zamówienia</div><div class="num" id="k-orders">—</div><div class="sub" id="k-orders-sub">&nbsp;</div></div>
    <div class="card kpi"><div class="label">Wydatki na reklamy</div><div class="num" id="k-spend">—</div><div class="sub" id="k-spend-sub">&nbsp;</div></div>
    <div class="card kpi"><div class="label">ROAS</div><div class="num" id="k-roas">—</div><div class="sub" id="k-roas-sub">przychód ÷ wydatki</div></div>
    <div class="card kpi"><div class="label">Odwiedzający</div><div class="num" id="k-visitors">—</div><div class="sub" id="k-visitors-sub">&nbsp;</div></div>
    <div class="card kpi"><div class="label">Konwersja</div><div class="num" id="k-conv">—</div><div class="sub">zamówienia ÷ odwiedzający</div></div>
    <div class="card kpi"><div class="label">Kliknięcia w reklamy</div><div class="num" id="k-clicks">—</div><div class="sub" id="k-clicks-sub">&nbsp;</div></div>
    <div class="card kpi"><div class="label">Koszt zamówienia</div><div class="num" id="k-cpa">—</div><div class="sub">wydatki ÷ zamówienia</div></div>
  </section>

  <section class="grid2">
    <div class="card"><h2>Przychód i wydatki na reklamy</h2><div class="chart"><canvas id="ch-money"></canvas></div></div>
    <div class="card"><h2>Lejek sprzedaży</h2><div class="funnel" id="funnel"></div></div>
  </section>

  <section class="grid2">
    <div class="card"><h2>Ruch na stronie</h2><div class="chart"><canvas id="ch-traffic"></canvas></div></div>
    <div class="card"><h2>Skąd przychodzą</h2><div class="list" id="sources"></div><h2 style="margin-top:18px">Urządzenia</h2><div class="list" id="devices"></div></div>
  </section>

  <section class="grid3">
    <div class="card" style="grid-column:span 2"><h2>Kampanie reklamowe</h2><div id="campaigns"></div></div>
    <div class="card"><h2>Produkty</h2><div id="products"></div></div>
  </section>

  <section class="grid2">
    <div class="card"><h2>Ostatnie zamówienia</h2><div id="orders"></div></div>
    <div class="card"><h2>Najczęściej oglądane strony</h2><div id="pages"></div></div>
  </section>
  <p class="muted" style="margin-top:20px;font-size:13px">Sprzedaż: Shopify (bez zamówień testowych i anulowanych). Reklamy: Meta, konto Winter Dip. Ruch: własny licznik strony bez cookies (unikalni odwiedzający liczeni osobno każdego dnia). Dane odświeżane co 5–10 min, „↻ Odśwież” pobiera od razu.</p>
</main>
<script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js"></script>
<script>
const $ = (id) => document.getElementById(id);
const zl = (n) => n == null ? '—' : new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN', maximumFractionDigits: n >= 1000 ? 0 : 2 }).format(n);
const num = (n, d = 0) => n == null ? '—' : new Intl.NumberFormat('pl-PL', { maximumFractionDigits: d, minimumFractionDigits: d }).format(n);
const pct = (n) => n == null ? '—' : num(n, n < 10 ? 1 : 0) + '%';
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const dshort = (d) => { const [, m, dd] = d.split('-'); return `${+dd}.${m}`; };
const PRODUCT_NAMES = { 'mug-1': 'Kubek beżowy', 'mug-2': 'Kubek czerwony', 'mug-3': 'Kubek biały' };
let range = '7', charts = {};

function bars(el, entries, fmt = (v) => num(v)) {
  const max = Math.max(1, ...entries.map((e) => e[1]));
  el.innerHTML = entries.length ? entries.map(([k, v]) => `<div><div class="row"><span>${esc(k)}</span><span>${fmt(v)}</span></div><div class="bar"><i style="width:${(v / max) * 100}%"></i></div></div>`).join('') : '<p class="muted">Brak danych w tym okresie.</p>';
}

function chart(id, cfg) {
  if (charts[id]) charts[id].destroy();
  charts[id] = new Chart($(id), cfg);
}

async function load(fresh = false) {
  $('app').classList.add('loading');
  let d;
  try {
    const r = await fetch(`api.php?range=${range}${fresh ? '&fresh=1' : ''}`, { cache: 'no-store' });
    if (r.status === 401) { location.reload(); return; }
    d = await r.json();
  } catch (e) { $('notes').innerHTML = '<div class="note">Nie udało się pobrać danych. Spróbuj odświeżyć.</div>'; $('app').classList.remove('loading'); return; }
  const k = d.kpi, s = d.shopify, m = d.meta, t = d.traffic;
  $('period').textContent = `${dshort(d.since)} – ${dshort(d.until)} · stan na ${d.generated}`;
  const notes = [];
  if (!s.ok) notes.push(s.error);
  if (!m.ok) notes.push(m.error);
  $('notes').innerHTML = notes.map((n) => `<div class="note">⚠️ ${esc(n)}</div>`).join('');

  $('k-revenue').textContent = zl(k.revenue);
  $('k-revenue-sub').textContent = k.aov != null ? `średni koszyk ${zl(k.aov)}` : ' ';
  $('k-orders').textContent = num(k.orders);
  $('k-orders-sub').textContent = s.ok ? `${num(s.totals.items)} szt. · do wysyłki: ${num(s.totals.unfulfilled)}` : ' ';
  $('k-spend').textContent = zl(k.spend);
  $('k-spend-sub').textContent = m.ok ? `${num(m.totals.impressions)} wyświetleń · zasięg ${num(m.totals.reach)}` : ' ';
  $('k-roas').textContent = k.roas != null ? num(k.roas, 2) + '×' : '—';
  $('k-visitors').textContent = num(k.visitors);
  $('k-visitors-sub').textContent = `${num(t.totals.pv)} wyświetleń stron`;
  $('k-conv').textContent = pct(k.conversion);
  $('k-clicks').textContent = m.ok ? num(m.totals.linkClicks) : '—';
  $('k-clicks-sub').textContent = m.ok ? `CTR ${pct(m.totals.ctr)} · CPC ${zl(m.totals.cpc)}` : ' ';
  $('k-cpa').textContent = zl(k.cpa);

  const labels = d.dates.map(dshort);
  chart('ch-money', { type: 'bar', data: { labels, datasets: [
    { label: 'Przychód', data: d.dates.map((x) => s.ok ? +s.daily[x].revenue.toFixed(2) : 0), backgroundColor: '#6b212c', borderRadius: 6 },
    { label: 'Reklamy', data: d.dates.map((x) => m.ok ? +m.daily[x].spend.toFixed(2) : 0), backgroundColor: '#9aa6b1', borderRadius: 6 },
  ] }, options: { maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } }, scales: { y: { beginAtZero: true, ticks: { callback: (v) => v + ' zł' } } } } });
  chart('ch-traffic', { type: 'line', data: { labels, datasets: [
    { label: 'Odwiedzający', data: d.dates.map((x) => t.daily[x].visitors), borderColor: '#6b212c', backgroundColor: 'rgba(107,33,44,.12)', fill: true, tension: .35 },
    { label: 'Kliknięcia w reklamy', data: d.dates.map((x) => m.ok ? m.daily[x].clicks : 0), borderColor: '#27363f', tension: .35 },
  ] }, options: { maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } }, scales: { y: { beginAtZero: true, ticks: { precision: 0 } } } } });

  const f = t.funnel, steps = [['Weszli na stronę', f.pv], ['Obejrzeli kubek', f.view], ['Dodali do koszyka', f.add], ['Przeszli do kasy', f.checkout], ['Kupili', k.orders ?? 0]];
  const top = Math.max(1, steps[0][1]);
  $('funnel').innerHTML = steps.map(([l, v], i) => `<div><div class="row"><span>${l}</span><span>${num(v)}${i ? ` <span class="muted">(${pct(v / top * 100)})</span>` : ''}</span></div><div class="bar"><i style="width:${v / top * 100}%"></i></div></div>`).join('');

  bars($('sources'), Object.entries(t.sources));
  bars($('devices'), Object.entries(t.devices));

  $('campaigns').innerHTML = !m.ok ? '<p class="muted">Podłącz klucz Meta, żeby zobaczyć kampanie.</p>' : (m.campaigns.length ? `<table><tr><th>Kampania</th><th class="r">Wydatki</th><th class="r">Kliknięcia</th><th class="r">CPC</th><th class="r">Zakupy</th><th class="r">ROAS</th></tr>${m.campaigns.map((c) => `<tr><td>${esc(c.name)}</td><td class="r">${zl(c.spend)}</td><td class="r">${num(c.clicks)}</td><td class="r">${c.clicks ? zl(c.spend / c.clicks) : '—'}</td><td class="r">${num(c.purchases)}</td><td class="r">${c.spend ? num(c.value / c.spend, 2) + '×' : '—'}</td></tr>`).join('')}</table>` : '<p class="muted">Brak aktywnych kampanii w tym okresie.</p>');

  const pv = t.products, sold = s.ok ? s.products : {};
  const ids = Object.keys(PRODUCT_NAMES).filter((id) => pv[id] || id !== 'mug-3');
  $('products').innerHTML = `<table><tr><th>Kubek</th><th class="r">Wyśw.</th><th class="r">Koszyk</th><th class="r">Sprzedane</th></tr>${ids.map((id) => `<tr><td>${PRODUCT_NAMES[id]}</td><td class="r">${num(pv[id]?.view || 0)}</td><td class="r">${num(pv[id]?.add || 0)}</td><td class="r">${num(sold[PRODUCT_NAMES[id]] || 0)}</td></tr>`).join('')}</table>`;

  $('orders').innerHTML = !s.ok ? '<p class="muted">Podłącz klucz Shopify, żeby zobaczyć zamówienia.</p>' : (s.orders.length ? `<table><tr><th>Nr</th><th>Data</th><th>Produkty</th><th class="r">Kwota</th><th>Status</th></tr>${s.orders.map((o) => `<tr${o.counted ? '' : ' class="muted"'}><td>${esc(o.name)}</td><td>${new Date(o.date).toLocaleString('pl-PL', { day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit' })}</td><td>${esc(o.items)}</td><td class="r">${zl(o.total)}</td><td><span class="pill ${o.status === 'PAID' ? 'ok' : (o.counted ? '' : 'bad')}">${esc({ PAID: 'opłacone', PENDING: 'oczekuje', REFUNDED: 'zwrócone', PARTIALLY_REFUNDED: 'częściowy zwrot' }[o.status] || o.status)}</span> <span class="pill">${o.fulfillment === 'FULFILLED' ? 'wysłane' : 'do wysyłki'}</span></td></tr>`).join('')}</table>` : '<p class="muted">Brak zamówień w tym okresie.</p>');

  const pages = Object.entries(t.pages).map(([p, v]) => [p.replace('produkt.html?id=', 'produkt: ').replace(/^\/$/, 'strona główna').replace(/^\//, '').replace('mug-1', 'beżowy').replace('mug-2', 'czerwony').replace('mug-3', 'biały'), v]);
  bars($('pages'), pages);
  $('app').classList.remove('loading');
}

document.querySelectorAll('#ranges button').forEach((b) => b.addEventListener('click', () => {
  document.querySelectorAll('#ranges button').forEach((x) => x.classList.toggle('on', x === b));
  range = b.dataset.r; load();
}));
$('refresh').addEventListener('click', (e) => { e.preventDefault(); load(true); });
load();
setInterval(() => load(), 5 * 60 * 1000);
</script>
<?php endif; ?>
</body>
</html>
