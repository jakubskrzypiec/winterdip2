<?php
declare(strict_types=1);
require __DIR__ . '/lib.php';
header('X-Robots-Tag: noindex, nofollow');
header('Cache-Control: no-store');
header("Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data: blob:; connect-src 'self'; frame-ancestors 'none'");

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
<meta name="theme-color" content="#27363f">
<title>Panel · Winter Dip</title>
<link rel="icon" href="../assets/brand/favicon-32.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@500;600;700;800&family=Nunito:wght@500;600;700;800;900&display=swap" rel="stylesheet">
<style>
:root{--snow:#dce0e8;--snow-2:#eef0f4;--snow-3:#f6f7fa;--pine:#27363f;--pine-d:#1b262d;--pine-2:rgba(39,54,63,.62);--line:rgba(39,54,63,.1);--berry:#6b212c;--berry-l:#a3172b;--ok:#2f7d5b;--ok-bg:#e1f2e9;--bad-bg:#f8e3e5;--gold:#f2c14e;--r:20px;--sh:0 1px 2px rgba(39,54,63,.04),0 10px 30px -18px rgba(39,54,63,.35)}
*{box-sizing:border-box}
html{scroll-behavior:smooth}
body{margin:0;background:var(--snow);color:var(--pine);font:15px/1.5 Nunito,system-ui,sans-serif;-webkit-font-smoothing:antialiased}
h1,h2,h3,.num,.pop{font-family:Poppins,system-ui,sans-serif}
a{color:var(--berry)}
button{font:inherit;cursor:pointer}
.wrap{max-width:1320px;margin:0 auto;padding:0 20px}
/* ---- header ---- */
header{position:sticky;top:0;z-index:20;background:linear-gradient(120deg,var(--pine-d),var(--pine) 55%,#3a2a33);color:#fff;box-shadow:0 10px 30px -20px rgba(0,0,0,.6)}
header .wrap{display:flex;align-items:center;gap:14px;height:66px}
.brand{display:flex;align-items:center;gap:10px;font:700 15px Poppins;letter-spacing:.02em}
.brand span{opacity:.6;font-weight:500}
.logo-chip{background:var(--snow);border-radius:12px;padding:5px 10px;display:flex}
.logo-chip img{height:26px;display:block}
.tabs{display:flex;gap:4px;margin-left:10px;background:rgba(255,255,255,.08);padding:4px;border-radius:99px}
.tabs button{border:0;background:none;color:var(--snow);font-weight:800;font-size:13px;padding:8px 16px;border-radius:99px}
.tabs button.on{background:var(--snow);color:var(--pine)}
.sp{flex:1}
.live{display:flex;align-items:center;gap:8px;font-size:13px;font-weight:700;background:rgba(255,255,255,.08);padding:7px 12px;border-radius:99px;white-space:nowrap}
.live i{width:8px;height:8px;border-radius:50%;background:#4ade80;box-shadow:0 0 0 0 rgba(74,222,128,.7);animation:ping 2s infinite}
@keyframes ping{0%{box-shadow:0 0 0 0 rgba(74,222,128,.6)}70%{box-shadow:0 0 0 9px rgba(74,222,128,0)}100%{box-shadow:0 0 0 0 rgba(74,222,128,0)}}
.hbtn{border:0;background:none;color:var(--snow);font-weight:800;font-size:13px;text-decoration:none;opacity:.85;padding:6px}
.hbtn:hover{opacity:1}
/* ---- toolbar ---- */
main{padding:26px 0 70px}
.top{display:flex;align-items:flex-end;justify-content:space-between;gap:14px;flex-wrap:wrap;margin-bottom:18px}
.top h1{margin:0;font-size:28px;line-height:1.1}
.top p{margin:4px 0 0;color:var(--pine-2);font-weight:700}
.ranges{display:flex;gap:4px;background:#fff;padding:4px;border-radius:99px;box-shadow:var(--sh)}
.ranges button{border:0;background:none;color:var(--pine);font-weight:800;font-size:13px;padding:8px 14px;border-radius:99px}
.ranges button.on{background:var(--pine);color:#fff}
.ghost{border:1px solid var(--line);background:#fff;border-radius:99px;padding:9px 14px;font-weight:800;font-size:13px;color:var(--pine)}
/* ---- cards ---- */
.card{background:#fff;border-radius:var(--r);padding:20px 22px;box-shadow:var(--sh);position:relative;overflow:hidden}
.card h2{margin:0 0 14px;font-size:16px;display:flex;align-items:center;gap:8px}
.card h2 small{font:700 12px Nunito;color:var(--pine-2);margin-left:auto}
.kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px}
.kpi .label{font-size:12px;font-weight:900;letter-spacing:.08em;text-transform:uppercase;color:var(--pine-2);display:flex;align-items:center;gap:6px}
.kpi .num{font-size:30px;font-weight:700;margin-top:8px;white-space:nowrap;letter-spacing:-.01em}
.kpi .sub{font-size:13px;color:var(--pine-2);margin-top:4px;font-weight:600;display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.kpi.hero{background:radial-gradient(120% 140% at 100% 0%,#8d2a39 0%,var(--berry) 45%,#4a1620 100%);color:#fff}
.kpi.hero .label,.kpi.hero .sub{color:rgba(255,255,255,.78)}
.kpi.hero::after{content:"";position:absolute;right:-30px;top:-30px;width:140px;height:140px;border-radius:50%;background:rgba(255,255,255,.07)}
.delta{display:inline-flex;align-items:center;gap:3px;font-size:12px;font-weight:900;padding:2px 8px;border-radius:99px;background:var(--snow-2);color:var(--pine-2)}
.delta.up{background:var(--ok-bg);color:var(--ok)}
.delta.down{background:var(--bad-bg);color:var(--berry)}
.kpi.hero .delta{background:rgba(255,255,255,.16);color:#fff}
.grid{display:grid;gap:14px;margin-top:14px}
.g21{grid-template-columns:minmax(0,2fr) minmax(0,1fr)}
.g12{grid-template-columns:minmax(0,1fr) minmax(0,2fr)}
.g111{grid-template-columns:repeat(3,minmax(0,1fr))}
.chart{position:relative;height:270px}
.chart.sm{height:200px}
table{width:100%;border-collapse:collapse;font-size:14px}
th{text-align:left;font-size:11px;letter-spacing:.07em;text-transform:uppercase;color:var(--pine-2);font-weight:900;padding:8px 6px;border-bottom:1px solid var(--line)}
td{padding:10px 6px;border-bottom:1px solid var(--line);vertical-align:top}
td.r,th.r{text-align:right;white-space:nowrap}
tr:last-child td{border-bottom:0}
tr.muted td{color:var(--pine-2)}
.bar{height:8px;border-radius:99px;background:var(--snow-2);overflow:hidden;margin-top:6px}
.bar i{display:block;height:100%;background:linear-gradient(90deg,var(--berry),var(--berry-l));border-radius:99px;transition:width .8s cubic-bezier(.2,.8,.2,1)}
.row{display:flex;justify-content:space-between;gap:10px;font-weight:800}
.list > div{margin-bottom:12px}
.pill{display:inline-block;font-size:11px;font-weight:900;padding:3px 9px;border-radius:99px;background:var(--snow-2);white-space:nowrap}
.pill.ok{background:var(--ok-bg);color:var(--ok)}.pill.bad{background:var(--bad-bg);color:var(--berry)}
.note{border-radius:14px;padding:12px 16px;background:#fff6e6;color:#6b4a12;font-size:14px;font-weight:700;margin-bottom:12px;border:1px solid #f1d9a8}
.muted{color:var(--pine-2)}
.empty{color:var(--pine-2);font-weight:700;padding:14px 0}
/* funnel */
.funnel .step{display:grid;grid-template-columns:1fr auto;gap:2px 10px;margin-bottom:12px}
.funnel .step .bar{grid-column:1/-1;height:12px}
.funnel .drop{grid-column:1/-1;font-size:12px;color:var(--pine-2);font-weight:700}
/* goal */
.goal-ring{display:flex;align-items:center;gap:18px}
.ring{--p:0;width:118px;height:118px;border-radius:50%;background:conic-gradient(var(--berry) calc(var(--p)*1%),var(--snow-2) 0);display:grid;place-items:center;flex:none;transition:--p 1s}
.ring div{width:88px;height:88px;border-radius:50%;background:#fff;display:grid;place-items:center;text-align:center;font:800 20px Poppins}
.ring small{display:block;font:800 11px Nunito;color:var(--pine-2)}
.inline-in{border:1px solid var(--line);border-radius:10px;padding:6px 10px;font:800 14px Nunito;width:110px;color:var(--pine)}
.profit .num{font-size:30px}
.mini{display:grid;grid-template-columns:1fr auto;gap:4px 12px;font-size:14px;margin-top:10px}
.mini span:nth-child(even){text-align:right;font-weight:800}
details summary{cursor:pointer;font-weight:800;font-size:13px;color:var(--pine-2);margin-top:10px}
/* insights */
.insights{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;margin-top:14px}
.ins{display:flex;gap:12px;align-items:flex-start}
.ins .ic{width:40px;height:40px;border-radius:12px;display:grid;place-items:center;background:var(--snow-2);font-size:20px;flex:none}
.ins b{display:block;font:700 15px Poppins}
.ins p{margin:2px 0 0;font-size:13px;color:var(--pine-2);font-weight:700}
/* toast + confetti */
.toast{position:fixed;z-index:60;right:20px;bottom:20px;display:flex;gap:12px;align-items:center;background:var(--pine);color:#fff;border-radius:18px;padding:14px 18px;box-shadow:0 20px 40px -18px rgba(0,0,0,.6);transform:translateY(140%);transition:transform .5s cubic-bezier(.2,.9,.2,1.2);max-width:min(420px,calc(100% - 40px))}
.toast.show{transform:none}
.toast .big{font:800 22px Poppins}
.toast .ic{font-size:30px}
#confetti{position:fixed;inset:0;pointer-events:none;z-index:55}
/* ---- FLEX ---- */
.flex-layout{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:26px;align-items:start}
.opts .card{margin-bottom:14px}
.opt-row{display:flex;flex-wrap:wrap;gap:8px}
.chip{border:1px solid var(--line);background:#fff;border-radius:99px;padding:8px 14px;font-weight:800;font-size:13px;color:var(--pine)}
.chip.on{background:var(--pine);color:#fff;border-color:var(--pine)}
.toggle{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:8px 0;font-weight:800;border-bottom:1px solid var(--line)}
.toggle:last-child{border-bottom:0}
.toggle input{width:20px;height:20px;accent-color:var(--berry)}
.btn{border:0;border-radius:99px;background:var(--berry);color:#fff;font-weight:900;font-size:14px;padding:12px 20px}
.btn.dark{background:var(--pine)}
.stage{width:360px;flex:none}
.flexcard{width:360px;height:640px;border-radius:28px;position:relative;overflow:hidden;color:#fff;font-family:Poppins,sans-serif;box-shadow:0 30px 60px -30px rgba(39,54,63,.7);display:flex;flex-direction:column;padding:34px 30px 30px}
.flexcard.t-berry{background:radial-gradient(130% 90% at 100% 0%,#9b2c3d 0%,#6b212c 45%,#2a0c12 100%)}
.flexcard.t-pine{background:radial-gradient(130% 90% at 100% 0%,#3d5361 0%,#27363f 50%,#121a1f 100%)}
.flexcard.t-snow{background:linear-gradient(170deg,#ffffff 0%,#dce0e8 100%);color:#27363f}
.flexcard .fl-top{display:flex;align-items:center;justify-content:space-between}
.flexcard .fl-logo{background:#fff;border-radius:14px;padding:7px 12px;display:flex}
.flexcard .fl-logo img{height:26px;display:block}
.flexcard .fl-tag{font:800 11px Nunito;letter-spacing:.16em;text-transform:uppercase;padding:6px 10px;border-radius:99px;background:rgba(255,255,255,.14)}
.flexcard.t-snow .fl-tag{background:rgba(39,54,63,.08)}
.flexcard .fl-label{margin-top:46px;font:800 13px Nunito;letter-spacing:.18em;text-transform:uppercase;opacity:.75}
.flexcard .fl-rev{font-weight:800;font-size:58px;line-height:1;margin-top:10px;letter-spacing:-.02em;white-space:nowrap}
.flexcard .fl-rev small{font-size:26px;font-weight:700;margin-left:4px}
.flexcard .fl-stats{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:22px}
.flexcard .fl-stat{background:rgba(255,255,255,.1);border-radius:16px;padding:12px 14px}
.flexcard.t-snow .fl-stat{background:#fff}
.flexcard .fl-stat b{display:block;font-size:24px;font-weight:800;line-height:1.1}
.flexcard .fl-stat span{font:800 11px Nunito;letter-spacing:.1em;text-transform:uppercase;opacity:.72}
.flexcard .fl-chart{margin-top:auto;height:110px}
.flexcard .fl-chart svg{width:100%;height:100%;display:block;overflow:visible}
.flexcard .fl-foot{display:flex;justify-content:space-between;align-items:center;margin-top:16px;font:800 12px Nunito;opacity:.8}
.flexcard .snow{position:absolute;border-radius:50%;background:#fff;opacity:.35}
.flexcard.t-snow .snow{background:#6b212c;opacity:.12}
.flexcard .fl-badge{position:absolute;right:26px;top:150px;background:var(--gold);color:#3a2a10;font:900 12px Nunito;padding:6px 10px;border-radius:99px;transform:rotate(6deg);box-shadow:0 10px 20px -10px rgba(0,0,0,.6)}
.flexcard:fullscreen{width:100vh;height:100vh;border-radius:0;max-width:56.25vh;margin:auto}
.hint{font-size:13px;color:var(--pine-2);font-weight:700;margin-top:10px}
/* login */
.login{min-height:100vh;display:grid;place-items:center;padding:20px;background:radial-gradient(120% 80% at 80% 0%,#3a4d59,var(--pine-d))}
.login form{width:min(380px,100%);background:#fff;border-radius:24px;padding:34px 30px;text-align:center;box-shadow:0 40px 80px -40px rgba(0,0,0,.7)}
.login img{height:46px;margin-bottom:14px}
.login input{width:100%;padding:14px 16px;border-radius:14px;border:1px solid var(--line);font:700 16px Nunito;margin:16px 0}
.err{color:var(--berry);font-weight:800;font-size:14px}
.loading .num{opacity:.4}
[hidden]{display:none!important}
@media (max-width:1100px){.kpis{grid-template-columns:repeat(2,minmax(0,1fr))}.g21,.g12,.g111,.insights{grid-template-columns:minmax(0,1fr)}.flex-layout{grid-template-columns:minmax(0,1fr)}.stage{margin:0 auto}}
@media (max-width:640px){header .wrap{flex-wrap:wrap;height:auto;padding:10px 20px}.live{order:5;width:100%;justify-content:center}.kpi .num{font-size:24px}.tabs{margin-left:0}}
</style>
</head>
<body>
<?php if (!$in): ?>
<div class="login">
  <form method="post" autocomplete="off">
    <img src="../assets/brand/logo-red.webp" alt="Winter Dip">
    <h1 style="margin:0;font-size:22px">Panel sklepu</h1>
    <p class="muted" style="margin:6px 0 0;font-weight:700">Sprzedaż, reklamy i ruch w jednym miejscu</p>
    <input type="password" name="password" placeholder="Hasło" autofocus required>
    <?php if ($error): ?><p class="err"><?= htmlspecialchars($error) ?></p><?php endif; ?>
    <button class="btn" style="width:100%">Zaloguj</button>
  </form>
</div>
<?php else: ?>
<header>
  <div class="wrap">
    <div class="brand"><div class="logo-chip"><img src="../assets/brand/logo-red.webp" alt="Winter Dip"></div><span>Panel</span></div>
    <div class="tabs"><button data-tab="overview" class="on">📊 Przegląd</button><button data-tab="flex">✨ Flex</button></div>
    <div class="sp"></div>
    <div class="live" title="Odświeżane co 45 s"><i></i><span id="live-text">Na żywo…</span></div>
    <button class="hbtn" id="notif-btn" title="Powiadomienia o nowych zamówieniach">🔔</button>
    <a class="hbtn" href="../" target="_blank" rel="noopener">Sklep ↗</a>
    <a class="hbtn" href="?logout">Wyloguj</a>
  </div>
</header>

<main class="wrap">
<!-- ================= PRZEGLĄD ================= -->
<section id="tab-overview">
  <div class="top">
    <div><h1 id="hello">Cześć!</h1><p id="period">Ładowanie…</p></div>
    <div style="display:flex;gap:8px;flex-wrap:wrap">
      <div class="ranges" id="ranges"><button data-r="today">Dziś</button><button data-r="7" class="on">7 dni</button><button data-r="30">30 dni</button><button data-r="all">Od startu</button></div>
      <button class="ghost" id="refresh">↻ Odśwież</button>
    </div>
  </div>
  <div id="notes"></div>

  <div class="kpis" id="kpis">
    <div class="card kpi hero"><div class="label">💰 Przychód</div><div class="num" data-k="revenue">—</div><div class="sub"><span class="delta" data-d="revenue"></span><span data-s="aov"></span></div></div>
    <div class="card kpi"><div class="label">📦 Zamówienia</div><div class="num" data-k="orders">—</div><div class="sub"><span class="delta" data-d="orders"></span><span data-s="items"></span></div></div>
    <div class="card kpi"><div class="label">📣 Wydatki na reklamy</div><div class="num" data-k="spend">—</div><div class="sub"><span class="delta" data-d="spend" data-inv="1"></span><span data-s="impr"></span></div></div>
    <div class="card kpi"><div class="label">🚀 ROAS</div><div class="num" data-k="roas">—</div><div class="sub" data-s="roashint">przychód ÷ wydatki</div></div>
    <div class="card kpi"><div class="label">👀 Odwiedzający</div><div class="num" data-k="visitors">—</div><div class="sub"><span class="delta" data-d="visitors"></span><span data-s="pv"></span></div></div>
    <div class="card kpi"><div class="label">🎯 Konwersja</div><div class="num" data-k="conversion">—</div><div class="sub">zamówienia ÷ odwiedzający</div></div>
    <div class="card kpi"><div class="label">🖱️ Kliknięcia w reklamy</div><div class="num" data-k="clicks">—</div><div class="sub"><span class="delta" data-d="linkClicks"></span><span data-s="ctr"></span></div></div>
    <div class="card kpi"><div class="label">🧾 Koszt zamówienia</div><div class="num" data-k="cpa">—</div><div class="sub">wydatki ÷ zamówienia</div></div>
  </div>

  <div class="insights" id="insights"></div>

  <div class="grid g12">
    <div class="card profit">
      <h2>🧮 Szacowany zysk <small>po reklamach i towarze</small></h2>
      <div class="num" id="profit">—</div>
      <div class="mini" id="profit-break"></div>
      <details><summary>⚙️ Ustaw koszty</summary>
        <div class="mini" style="align-items:center">
          <span>Koszt kubka z wysyłką (Zendrop)</span><span><input class="inline-in" id="c-unit" type="number" step="0.01" min="0"> zł</span>
          <span>Prowizja za płatność</span><span><input class="inline-in" id="c-fee" type="number" step="0.1" min="0"> %</span>
        </div>
      </details>
    </div>
    <div class="card">
      <h2>💸 Przychód i wydatki na reklamy <small id="best-day"></small></h2>
      <div class="chart"><canvas id="ch-money"></canvas></div>
    </div>
  </div>

  <div class="grid g21">
    <div class="card"><h2>📈 Ruch na stronie</h2><div class="chart"><canvas id="ch-traffic"></canvas></div></div>
    <div class="card">
      <h2>🏁 Cel na <span id="goal-month"></span></h2>
      <div class="goal-ring"><div class="ring" id="goal-ring"><div><span id="goal-pct">0%</span><small>celu</small></div></div>
        <div><div class="num pop" style="font-size:24px;font-weight:700" id="goal-now">—</div><div class="muted" style="font-weight:700">z <input class="inline-in" id="goal-in" type="number" step="100" min="0"> zł</div><div class="muted" style="font-weight:700;margin-top:6px;font-size:13px" id="goal-left"></div></div>
      </div>
    </div>
  </div>

  <div class="grid g21">
    <div class="card"><h2>⏰ Kiedy ludzie wchodzą i kupują <small>najlepsza pora na posty</small></h2><div class="chart sm"><canvas id="ch-hours"></canvas></div></div>
    <div class="card"><h2>🪜 Lejek sprzedaży</h2><div class="funnel" id="funnel"></div></div>
  </div>

  <div class="grid g111">
    <div class="card"><h2>🌍 Skąd przychodzą</h2><div class="list" id="sources"></div></div>
    <div class="card"><h2>📱 Urządzenia</h2><div class="list" id="devices"></div></div>
    <div class="card"><h2>☕ Kubki</h2><div id="products"></div></div>
  </div>

  <div class="grid">
    <div class="card"><h2>📣 Kampanie reklamowe</h2><div id="campaigns"></div></div>
  </div>

  <div class="grid g21">
    <div class="card"><h2>🧾 Ostatnie zamówienia</h2><div id="orders"></div></div>
    <div class="card"><h2>📄 Najczęściej oglądane</h2><div class="list" id="pages"></div></div>
  </div>
  <p class="muted" style="margin-top:22px;font-size:13px;font-weight:600">Sprzedaż: Shopify (bez zamówień testowych i anulowanych). Reklamy: Meta, konto Winter Dip. Ruch: własny licznik strony bez cookies. Strzałki ▲▼ porównują z poprzednim okresem tej samej długości. Koszty i cel zapisują się w tej przeglądarce.</p>
</section>

<!-- ================= FLEX ================= -->
<section id="tab-flex" hidden>
  <div class="top"><div><h1>✨ Flex pod TikToka</h1><p>Karta 9:16 z wynikami sklepu — pobierz jako obrazek albo nagraj ekran z animacją.</p></div></div>
  <div class="flex-layout">
    <div class="opts">
      <div class="card"><h2>Okres</h2><div class="opt-row" id="fx-range"><button class="chip" data-r="today">Dziś</button><button class="chip on" data-r="7">7 dni</button><button class="chip" data-r="30">30 dni</button><button class="chip" data-r="all">Od startu</button></div></div>
      <div class="card"><h2>Wygląd</h2><div class="opt-row" id="fx-theme"><button class="chip on" data-t="berry">🍒 Berry</button><button class="chip" data-t="pine">🌲 Pine</button><button class="chip" data-t="snow">❄️ Snowflake</button></div></div>
      <div class="card"><h2>Co pokazać</h2>
        <label class="toggle">Przychód <input type="checkbox" id="fx-rev" checked></label>
        <label class="toggle">Zamówienia i sprzedane kubki <input type="checkbox" id="fx-ord" checked></label>
        <label class="toggle">Wydatki na reklamy i ROAS <input type="checkbox" id="fx-ads"></label>
        <label class="toggle">Wykres dzienny <input type="checkbox" id="fx-chart" checked></label>
        <label class="toggle">Naklejka „rekord dnia” <input type="checkbox" id="fx-badge" checked></label>
        <label class="toggle">Zaokrąglij kwoty (np. „1,2 tys. zł”) <input type="checkbox" id="fx-round"></label>
        <label class="toggle">Ukryj kwoty (zostaw tylko zamówienia) <input type="checkbox" id="fx-hide"></label>
      </div>
      <div class="card">
        <h2>Gotowe?</h2>
        <div class="opt-row"><button class="btn" id="fx-png">⬇️ Pobierz PNG (1080×1920)</button><button class="btn dark" id="fx-play">▶ Animuj liczby</button><button class="chip" id="fx-full">⛶ Pełny ekran</button></div>
        <p class="hint">Do nagrania: włącz „Pełny ekran”, uruchom nagrywanie ekranu w telefonie lub komputerze i kliknij kartę — liczby policzą się od zera, a na koniec wystrzeli konfetti.</p>
      </div>
    </div>
    <div class="stage">
      <div class="flexcard t-berry" id="flexcard">
        <div class="fl-top"><div class="fl-logo"><img src="../assets/brand/logo-red.webp" alt="Winter Dip"></div><div class="fl-tag" id="fl-tag">7 dni</div></div>
        <div class="fl-badge" id="fl-badge" hidden>🔥 rekord dnia</div>
        <div class="fl-label" id="fl-label">Sprzedaż</div>
        <div class="fl-rev" id="fl-rev">0<small>zł</small></div>
        <div class="fl-stats" id="fl-stats"></div>
        <div class="fl-chart" id="fl-chart"></div>
        <div class="fl-foot"><span>winterdip.pl</span><span id="fl-date"></span></div>
      </div>
    </div>
  </div>
</section>
</main>

<div class="toast" id="toast"><div class="ic">🛒</div><div><div style="font-weight:800;opacity:.8;font-size:13px">NOWE ZAMÓWIENIE</div><div class="big" id="toast-big"></div><div style="font-size:13px;opacity:.8" id="toast-sub"></div></div></div>
<canvas id="confetti"></canvas>

<script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
<script>
// ================= narzędzia =================
const $ = (id) => document.getElementById(id);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const nf = (d = 0) => new Intl.NumberFormat('pl-PL', { maximumFractionDigits: d, minimumFractionDigits: d });
const zl = (n) => n == null ? '—' : new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN', maximumFractionDigits: Math.abs(n) >= 1000 ? 0 : 2, minimumFractionDigits: Math.abs(n) >= 1000 ? 0 : (Number.isInteger(n) ? 0 : 2) }).format(n);
const num = (n, d = 0) => n == null ? '—' : nf(d).format(n);
const pct = (n) => n == null ? '—' : num(n, n < 10 ? 1 : 0) + '%';
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const dshort = (d) => { const [, m, dd] = d.split('-'); return `${+dd}.${m}`; };
const store = { get: (k, def) => { try { const v = localStorage.getItem('wd-' + k); return v == null ? def : JSON.parse(v); } catch { return def; } }, set: (k, v) => { try { localStorage.setItem('wd-' + k, JSON.stringify(v)); } catch {} } };
const NAMES = { 'mug-1': 'Kubek beżowy', 'mug-2': 'Kubek czerwony', 'mug-3': 'Kubek biały' };
const RANGE_LABEL = { today: 'Dzisiaj', '7': 'Ostatnie 7 dni', '30': 'Ostatnie 30 dni', all: 'Od startu sklepu' };
let range = '7', DATA = null, charts = {};
Chart.defaults.font.family = 'Nunito, system-ui, sans-serif';
Chart.defaults.font.weight = 700;
Chart.defaults.color = 'rgba(39,54,63,.62)';

// animowane liczby
function countUp(el, to, fmt, ms = 900) {
  if (to == null || isNaN(to)) { el.textContent = '—'; return; }
  const from = 0, t0 = performance.now();
  const step = (t) => { const p = Math.min(1, (t - t0) / ms), e = 1 - Math.pow(1 - p, 3); el.textContent = fmt(from + (to - from) * e); if (p < 1) requestAnimationFrame(step); };
  requestAnimationFrame(step);
}
function setDelta(el, cur, prev, inverse) {
  if (!el) return;
  if (cur == null || prev == null || (prev === 0 && cur === 0)) { el.textContent = ''; el.className = 'delta'; el.hidden = true; return; }
  el.hidden = false;
  if (prev === 0) { el.textContent = '▲ nowość'; el.className = 'delta up'; return; }
  const ch = (cur - prev) / prev * 100, up = ch >= 0;
  el.textContent = `${up ? '▲' : '▼'} ${num(Math.abs(ch), Math.abs(ch) < 10 ? 1 : 0)}%`;
  el.className = 'delta ' + ((up !== !!inverse) ? 'up' : 'down');
}
function bars(el, entries, fmt = (v) => num(v)) {
  const max = Math.max(1, ...entries.map((e) => e[1]));
  el.innerHTML = entries.length ? entries.map(([k, v]) => `<div><div class="row"><span>${esc(k)}</span><span>${fmt(v)}</span></div><div class="bar"><i style="width:0" data-w="${(v / max) * 100}"></i></div></div>`).join('') : '<p class="empty">Brak danych w tym okresie.</p>';
  requestAnimationFrame(() => $$('i[data-w]', el).forEach((i) => (i.style.width = i.dataset.w + '%')));
}
function chart(id, cfg) { if (charts[id]) charts[id].destroy(); charts[id] = new Chart($(id), cfg); }

// ================= przegląd =================
async function load(fresh = false) {
  $('kpis').classList.add('loading');
  try {
    const r = await fetch(`api.php?range=${range}${fresh ? '&fresh=1' : ''}`, { cache: 'no-store' });
    if (r.status === 401) { location.reload(); return; }
    DATA = await r.json();
  } catch { $('notes').innerHTML = '<div class="note">Nie udało się pobrać danych. Spróbuj odświeżyć.</div>'; return; }
  finally { $('kpis').classList.remove('loading'); }
  render(DATA);
  renderFlex();
}

function render(d) {
  const k = d.kpi, p = d.prev, s = d.shopify, m = d.meta, t = d.traffic;
  const h = new Date().getHours();
  $('hello').textContent = (h < 12 ? 'Dzień dobry' : h < 18 ? 'Cześć' : 'Dobry wieczór') + ' 👋';
  $('period').textContent = `${RANGE_LABEL[d.range] || ''} · ${dshort(d.since)} – ${dshort(d.until)} · stan na ${d.generated}`;
  $('notes').innerHTML = [s, m].filter((x) => !x.ok).map((x) => `<div class="note">⚠️ ${esc(x.error)}</div>`).join('');

  const q = (sel) => document.querySelector(sel);
  countUp(q('[data-k=revenue]'), k.revenue, zl);
  countUp(q('[data-k=orders]'), k.orders, (v) => num(Math.round(v)));
  countUp(q('[data-k=spend]'), k.spend, zl);
  q('[data-k=roas]').textContent = k.roas != null ? num(k.roas, 2) + '×' : '—';
  countUp(q('[data-k=visitors]'), k.visitors, (v) => num(Math.round(v)));
  q('[data-k=conversion]').textContent = pct(k.conversion);
  countUp(q('[data-k=clicks]'), m.ok ? m.totals.linkClicks : null, (v) => num(Math.round(v)));
  q('[data-k=cpa]').textContent = zl(k.cpa);
  setDelta(q('[data-d=revenue]'), k.revenue, p.revenue);
  setDelta(q('[data-d=orders]'), k.orders, p.orders);
  setDelta(q('[data-d=spend]'), k.spend, p.spend, true);
  setDelta(q('[data-d=visitors]'), k.visitors, p.visitors);
  setDelta(q('[data-d=linkClicks]'), m.ok ? m.totals.linkClicks : null, p.linkClicks);
  q('[data-s=aov]').textContent = k.aov != null ? `śr. koszyk ${zl(k.aov)}` : '';
  q('[data-s=items]').textContent = s.ok ? `${num(s.totals.items)} kubków · do wysyłki ${num(s.totals.unfulfilled)}` : '';
  q('[data-s=impr]').textContent = m.ok ? `${num(m.totals.impressions)} wyświetleń` : '';
  q('[data-s=pv]').textContent = `${num(t.totals.pv)} odsłon`;
  q('[data-s=ctr]').textContent = m.ok ? `CTR ${pct(m.totals.ctr)} · CPC ${zl(m.totals.cpc)}` : '';
  q('[data-s=roashint]').textContent = k.roas == null ? 'przychód ÷ wydatki' : (k.roas >= 2 ? '🔥 reklamy się zwracają' : k.roas >= 1 ? 'na plus, ale cienko' : '⚠️ reklamy kosztują więcej niż dają');

  renderProfit(); renderGoal(); renderInsights(d);

  const labels = d.dates.map(dshort);
  chart('ch-money', { data: { labels, datasets: [
    { type: 'bar', label: 'Przychód', data: d.dates.map((x) => s.ok ? +s.daily[x].revenue.toFixed(2) : 0), backgroundColor: '#6b212c', borderRadius: 8, order: 2 },
    { type: 'line', label: 'Reklamy', data: d.dates.map((x) => m.ok ? +m.daily[x].spend.toFixed(2) : 0), borderColor: '#27363f', backgroundColor: '#27363f', tension: .35, pointRadius: 3, order: 1 },
  ] }, options: { maintainAspectRatio: false, interaction: { mode: 'index', intersect: false }, plugins: { legend: { position: 'bottom' }, tooltip: { callbacks: { label: (c) => ` ${c.dataset.label}: ${zl(c.parsed.y)}` } } }, scales: { x: { grid: { display: false } }, y: { beginAtZero: true, ticks: { callback: (v) => v + ' zł' } } } } });
  $('best-day').textContent = s.ok && s.bestDay && s.bestDay.revenue > 0 ? `🏆 najlepszy dzień: ${dshort(s.bestDay.day)} (${zl(s.bestDay.revenue)})` : '';

  chart('ch-traffic', { type: 'line', data: { labels, datasets: [
    { label: 'Odwiedzający', data: d.dates.map((x) => t.daily[x].visitors), borderColor: '#6b212c', backgroundColor: (c) => { const g = c.chart.ctx.createLinearGradient(0, 0, 0, 260); g.addColorStop(0, 'rgba(107,33,44,.28)'); g.addColorStop(1, 'rgba(107,33,44,0)'); return g; }, fill: true, tension: .4, pointRadius: 3 },
    { label: 'Kliknięcia w reklamy', data: d.dates.map((x) => m.ok ? m.daily[x].clicks : 0), borderColor: '#27363f', borderDash: [5, 5], tension: .4, pointRadius: 0 },
  ] }, options: { maintainAspectRatio: false, interaction: { mode: 'index', intersect: false }, plugins: { legend: { position: 'bottom' } }, scales: { x: { grid: { display: false } }, y: { beginAtZero: true, ticks: { precision: 0 } } } } });

  const hours = [...Array(24).keys()];
  chart('ch-hours', { data: { labels: hours.map((x) => x + ':00'), datasets: [
    { type: 'bar', label: 'Wejścia', data: t.hours, backgroundColor: 'rgba(39,54,63,.22)', borderRadius: 5, yAxisID: 'y' },
    { type: 'line', label: 'Zamówienia', data: s.ok ? s.hours : hours.map(() => 0), borderColor: '#6b212c', backgroundColor: '#6b212c', tension: .35, pointRadius: 2, yAxisID: 'y1' },
  ] }, options: { maintainAspectRatio: false, interaction: { mode: 'index', intersect: false }, plugins: { legend: { position: 'bottom' } }, scales: { x: { grid: { display: false }, ticks: { maxTicksLimit: 12 } }, y: { beginAtZero: true, ticks: { precision: 0 } }, y1: { position: 'right', beginAtZero: true, grid: { display: false }, ticks: { precision: 0 } } } } });

  const f = t.funnel, steps = [['👀 Weszli na stronę', f.pv], ['☕ Obejrzeli kubek', f.view], ['🛒 Dodali do koszyka', f.add], ['💳 Przeszli do kasy', f.checkout], ['🎉 Kupili', k.orders ?? 0]];
  const top = Math.max(1, steps[0][1]);
  $('funnel').innerHTML = steps.map(([l, v], i) => {
    const prevV = i ? steps[i - 1][1] : null;
    const drop = i && prevV ? `odpadło ${pct((1 - v / prevV) * 100)} z poprzedniego kroku` : '';
    return `<div class="step"><span style="font-weight:800">${l}</span><span style="font-weight:900">${num(v)}${i ? ` <span class="muted">· ${pct(v / top * 100)}</span>` : ''}</span><div class="bar"><i style="width:0" data-w="${v / top * 100}"></i></div>${drop ? `<div class="drop">${drop}</div>` : ''}</div>`;
  }).join('');
  requestAnimationFrame(() => $$('#funnel i[data-w]').forEach((i) => (i.style.width = i.dataset.w + '%')));

  bars($('sources'), Object.entries(t.sources));
  bars($('devices'), Object.entries(t.devices));

  const pv = t.products, sold = s.ok ? s.products : {};
  $('products').innerHTML = `<table><tr><th>Kubek</th><th class="r">Wyśw.</th><th class="r">Koszyk</th><th class="r">Sprzed.</th></tr>${['mug-1', 'mug-2'].map((id) => `<tr><td>${NAMES[id]}</td><td class="r">${num(pv[id]?.view || 0)}</td><td class="r">${num(pv[id]?.add || 0)}</td><td class="r"><b>${num(sold[NAMES[id]] || 0)}</b></td></tr>`).join('')}</table>`;

  $('campaigns').innerHTML = !m.ok ? '<p class="empty">Podłącz klucz Meta, żeby zobaczyć kampanie.</p>' : (m.campaigns.length ? `<table><tr><th>Kampania</th><th class="r">Wydatki</th><th class="r">Wyświetlenia</th><th class="r">Kliknięcia</th><th class="r">CPC</th><th class="r">Zakupy</th><th class="r">ROAS</th></tr>${m.campaigns.map((c) => `<tr><td><b>${esc(c.name)}</b></td><td class="r">${zl(c.spend)}</td><td class="r">${num(c.impressions)}</td><td class="r">${num(c.clicks)}</td><td class="r">${c.clicks ? zl(c.spend / c.clicks) : '—'}</td><td class="r">${num(c.purchases)}</td><td class="r"><span class="pill ${c.spend && c.value / c.spend >= 1.5 ? 'ok' : (c.spend ? 'bad' : '')}">${c.spend ? num(c.value / c.spend, 2) + '×' : '—'}</span></td></tr>`).join('')}</table>` : '<p class="empty">Brak kampanii w tym okresie — pierwsza kampania pojawi się tu automatycznie.</p>');

  const ST = { PAID: 'opłacone', PENDING: 'oczekuje', REFUNDED: 'zwrócone', PARTIALLY_REFUNDED: 'częściowy zwrot', AUTHORIZED: 'autoryzowane' };
  $('orders').innerHTML = !s.ok ? '<p class="empty">Podłącz klucz Shopify, żeby zobaczyć zamówienia.</p>' : (s.orders.length ? `<table><tr><th>Nr</th><th>Kiedy</th><th>Produkty</th><th class="r">Kwota</th><th>Status</th></tr>${s.orders.map((o) => `<tr${o.counted ? '' : ' class="muted"'}><td><b>${esc(o.name)}</b></td><td>${new Date(o.date).toLocaleString('pl-PL', { day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit' })}</td><td>${esc(o.items)}</td><td class="r"><b>${zl(o.total)}</b></td><td><span class="pill ${o.status === 'PAID' ? 'ok' : (o.counted ? '' : 'bad')}">${esc(ST[o.status] || o.status)}</span> ${o.counted ? `<span class="pill">${o.fulfillment === 'FULFILLED' ? '🚚 wysłane' : '⏳ do wysyłki'}</span>` : ''}</td></tr>`).join('')}</table>` : '<p class="empty">Brak zamówień w tym okresie — pierwsze pojawi się tu od razu (i zadzwoni 🔔).</p>');

  const pages = Object.entries(t.pages).map(([p, v]) => [p.replace(/^\/(index\.html)?$/, 'Strona główna').replace(/^\/produkty\.html.*/, 'Lista kubków').replace(/^\/produkt\.html\?id=(mug-\d)/, (_, id) => NAMES[id] || id).replace(/^\//, ''), v]);
  bars($('pages'), pages);
}

// ---- zysk ----
function costs() { return { unit: +store.get('cost-unit', 45), fee: +store.get('cost-fee', 2.9) }; }
function renderProfit() {
  if (!DATA) return;
  const k = DATA.kpi, c = costs();
  $('c-unit').value = c.unit; $('c-fee').value = c.fee;
  if (k.revenue == null) { $('profit').textContent = '—'; $('profit-break').innerHTML = '<span class="muted">Podłącz Shopify</span><span></span>'; return; }
  const goods = (k.items || 0) * c.unit, fees = k.revenue * c.fee / 100, ads = k.spend || 0, profit = k.revenue - goods - fees - ads;
  countUp($('profit'), profit, zl);
  $('profit').style.color = profit < 0 ? 'var(--berry)' : 'var(--ok)';
  $('profit-break').innerHTML = `<span>Przychód</span><span>${zl(k.revenue)}</span><span>− towar i wysyłka (${num(k.items || 0)} × ${zl(c.unit)})</span><span>${zl(goods)}</span><span>− prowizje płatności (${num(c.fee, 1)}%)</span><span>${zl(fees)}</span><span>− reklamy</span><span>${zl(ads)}</span><span><b>Marża</b></span><span>${k.revenue ? pct(profit / k.revenue * 100) : '—'}</span>`;
}
['c-unit', 'c-fee'].forEach((id) => $(id).addEventListener('change', () => { store.set(id === 'c-unit' ? 'cost-unit' : 'cost-fee', +$(id).value || 0); renderProfit(); }));

// ---- cel miesięczny (liczony z dziennych danych bieżącego miesiąca) ----
let monthRev = null;
async function loadMonth() {
  try { const r = await fetch('api.php?range=30', { cache: 'no-store' }); const d = await r.json(); const ym = new Date().toISOString().slice(0, 7); monthRev = d.shopify.ok ? Object.entries(d.shopify.daily).filter(([day]) => day.startsWith(ym)).reduce((a, [, v]) => a + v.revenue, 0) : null; } catch {}
  renderGoal();
}
function renderGoal() {
  const goal = +store.get('goal', 3000), now = monthRev;
  $('goal-in').value = goal;
  $('goal-month').textContent = new Date().toLocaleDateString('pl-PL', { month: 'long' });
  if (now == null) { $('goal-now').textContent = '—'; return; }
  const p = goal ? Math.min(100, now / goal * 100) : 0;
  $('goal-ring').style.setProperty('--p', p);
  $('goal-ring').style.background = `conic-gradient(var(--berry) ${p}%, var(--snow-2) 0)`;
  $('goal-pct').textContent = Math.round(p) + '%';
  $('goal-now').textContent = zl(now);
  const daysLeft = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate() - new Date().getDate() + 1;
  $('goal-left').textContent = now >= goal ? '🎉 Cel osiągnięty!' : `brakuje ${zl(goal - now)} · ok. ${zl((goal - now) / daysLeft)} dziennie do końca miesiąca`;
}
$('goal-in').addEventListener('change', () => { store.set('goal', +$('goal-in').value || 0); renderGoal(); });

// ---- wnioski ----
function renderInsights(d) {
  const k = d.kpi, t = d.traffic, out = [];
  const src = Object.entries(t.sources)[0];
  if (src) out.push(['🌍', `${src[0]} daje najwięcej ruchu`, `${num(src[1])} odwiedzających (${pct(src[1] / Math.max(1, k.visitors) * 100)})`]);
  const hrs = t.hours.map((v, i) => [i, v]).sort((a, b) => b[1] - a[1])[0];
  if (hrs && hrs[1] > 0) out.push(['⏰', `Szczyt ruchu ok. ${hrs[0]}:00`, 'Wrzucaj TikToki i odpalaj promocje chwilę wcześniej']);
  const f = t.funnel;
  if (f.view > 0) {
    const cart = f.add / f.view * 100;
    out.push(['🛒', `${pct(cart)} oglądających dodaje do koszyka`, cart < 8 ? 'Popraw zdjęcia lub cenę na stronie kubka' : 'Strona produktu dobrze sprzedaje']);
  }
  if (f.checkout > 0 && k.orders != null) out.push(['💳', `${pct(k.orders / f.checkout * 100)} osób z kasy kupuje`, k.orders / f.checkout < .4 ? 'Część ludzi odpada w kasie — sprawdź koszt dostawy' : 'Kasa działa dobrze']);
  if (k.roas != null) out.push(['🚀', `ROAS ${num(k.roas, 2)}×`, k.roas >= 2 ? 'Możesz śmiało podnieść budżet' : 'Testuj nowe kreacje zanim zwiększysz budżet']);
  if (!out.length) out.push(['✨', 'Zbieramy dane', 'Wnioski pojawią się, gdy na stronie będzie trochę ruchu']);
  $('insights').innerHTML = out.slice(0, 3).map(([ic, b, p]) => `<div class="card ins"><div class="ic">${ic}</div><div><b>${esc(b)}</b><p>${esc(p)}</p></div></div>`).join('');
}

// ---- zakładki, zakres ----
$$('.tabs button').forEach((b) => b.addEventListener('click', () => {
  $$('.tabs button').forEach((x) => x.classList.toggle('on', x === b));
  $('tab-overview').hidden = b.dataset.tab !== 'overview';
  $('tab-flex').hidden = b.dataset.tab !== 'flex';
  store.set('tab', b.dataset.tab);
  if (b.dataset.tab === 'flex') loadFlex();
}));
$$('#ranges button').forEach((b) => b.addEventListener('click', () => { $$('#ranges button').forEach((x) => x.classList.toggle('on', x === b)); range = b.dataset.r; load(); }));
$('refresh').addEventListener('click', () => { load(true); pollLive(true); });

// ================= NA ŻYWO: nowe zamówienia =================
let audioCtx = null;
function chaChing() {
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const now = audioCtx.currentTime;
    [[1318.5, 0], [1760, .09], [2637, .18]].forEach(([f, t]) => {
      const o = audioCtx.createOscillator(), g = audioCtx.createGain();
      o.type = 'triangle'; o.frequency.value = f;
      g.gain.setValueAtTime(0, now + t); g.gain.linearRampToValueAtTime(.25, now + t + .01); g.gain.exponentialRampToValueAtTime(.001, now + t + .5);
      o.connect(g).connect(audioCtx.destination); o.start(now + t); o.stop(now + t + .55);
    });
  } catch {}
}
function confetti(ms = 2600) {
  const c = $('confetti'), ctx = c.getContext('2d');
  c.width = innerWidth * devicePixelRatio; c.height = innerHeight * devicePixelRatio; ctx.scale(devicePixelRatio, devicePixelRatio);
  const colors = ['#6b212c', '#a3172b', '#dce0e8', '#27363f', '#f2c14e', '#ffffff'];
  const P = Array.from({ length: 170 }, () => ({ x: innerWidth / 2 + (Math.random() - .5) * 200, y: innerHeight * .35, vx: (Math.random() - .5) * 14, vy: -Math.random() * 14 - 4, s: 5 + Math.random() * 7, r: Math.random() * 6, vr: (Math.random() - .5) * .3, c: colors[(Math.random() * colors.length) | 0] }));
  const t0 = performance.now();
  (function f(t) {
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    P.forEach((p) => { p.vy += .35; p.vx *= .99; p.x += p.vx; p.y += p.vy; p.r += p.vr; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.fillStyle = p.c; ctx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); ctx.restore(); });
    if (t - t0 < ms) requestAnimationFrame(f); else ctx.clearRect(0, 0, innerWidth, innerHeight);
  })(t0);
}
let toastT;
function celebrate(o) {
  $('toast-big').textContent = '+' + zl(o.total);
  $('toast-sub').textContent = `${o.name} · ${o.items}`;
  $('toast').classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => $('toast').classList.remove('show'), 7000);
  chaChing(); confetti();
  if ('Notification' in window && Notification.permission === 'granted') { try { new Notification('🛒 Nowe zamówienie! +' + zl(o.total), { body: o.items, icon: '../assets/brand/favicon-32.png' }); } catch {} }
}
async function pollLive(fresh = false) {
  try {
    const r = await fetch('api.php?live=1' + (fresh ? '&fresh=1' : ''), { cache: 'no-store' });
    if (r.status === 401) return;
    const d = await r.json();
    $('live-text').textContent = d.ok ? `Dziś: ${zl(d.today.revenue)} · ${num(d.today.orders)} zam. · ${num(d.today.visitors)} os.` : `Dziś: ${num(d.today.visitors)} odwiedzających`;
    const seen = new Set(store.get('seen', []));
    const first = !store.get('seen-init', false);
    const newOrders = (d.latest || []).filter((o) => !seen.has(o.name));
    (d.latest || []).forEach((o) => seen.add(o.name));
    store.set('seen', [...seen].slice(-50)); store.set('seen-init', true);
    if (!first && newOrders.length) { newOrders.reverse().forEach((o, i) => setTimeout(() => celebrate(o), i * 2500)); document.title = `(+${newOrders.length}) Panel · Winter Dip`; load(true); }
  } catch {}
}
document.addEventListener('visibilitychange', () => { if (!document.hidden) document.title = 'Panel · Winter Dip'; });
$('notif-btn').addEventListener('click', async () => {
  chaChing();   // odblokowuje dźwięk w przeglądarce
  if ('Notification' in window) { const p = await Notification.requestPermission(); $('notif-btn').textContent = p === 'granted' ? '🔔✓' : '🔕'; }
});
if ('Notification' in window && Notification.permission === 'granted') $('notif-btn').textContent = '🔔✓';

// ================= FLEX =================
let fx = { range: store.get('fx-range', '7'), theme: store.get('fx-theme', 'berry'), data: null };
async function loadFlex() {
  if (DATA && DATA.range === fx.range) { fx.data = DATA; renderFlex(); return; }
  try { const r = await fetch(`api.php?range=${fx.range}`, { cache: 'no-store' }); fx.data = await r.json(); } catch {}
  renderFlex();
}
function fmtMoney(n) {
  if ($('fx-round').checked && n >= 1000) return nf(n >= 10000 ? 0 : 1).format(n / 1000) + '<small>tys. zł</small>';
  return nf(n >= 1000 ? 0 : 0).format(Math.round(n)) + '<small>zł</small>';
}
function spark(vals) {
  const w = 300, h = 100, max = Math.max(1, ...vals), n = vals.length;
  if (n < 2) return '';
  const pts = vals.map((v, i) => [i / (n - 1) * w, h - (v / max) * (h - 10) - 4]);
  const line = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
  const col = fx.theme === 'snow' ? '#6b212c' : '#ffffff';
  return `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none"><defs><linearGradient id="fg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${col}" stop-opacity=".35"/><stop offset="1" stop-color="${col}" stop-opacity="0"/></linearGradient></defs><path d="${line} L${w} ${h} L0 ${h} Z" fill="url(#fg)"/><path d="${line}" fill="none" stroke="${col}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><circle cx="${pts[n - 1][0]}" cy="${pts[n - 1][1]}" r="5" fill="${col}"/></svg>`;
}
function renderFlex() {
  const d = fx.data; if (!d) return;
  const card = $('flexcard'), k = d.kpi, s = d.shopify;
  card.className = 'flexcard t-' + fx.theme;
  $$('#fx-range .chip').forEach((b) => b.classList.toggle('on', b.dataset.r === fx.range));
  $$('#fx-theme .chip').forEach((b) => b.classList.toggle('on', b.dataset.t === fx.theme));
  $('fl-tag').textContent = { today: 'dziś', '7': '7 dni', '30': '30 dni', all: 'od startu' }[fx.range];
  $('fl-label').textContent = fx.range === 'today' ? 'Sprzedaż dzisiaj' : fx.range === 'all' ? 'Sprzedaż od startu' : `Sprzedaż · ${fx.range} dni`;
  const hide = $('fx-hide').checked, showRev = $('fx-rev').checked && !hide;
  $('fl-rev').hidden = !showRev && !$('fx-ord').checked;
  $('fl-rev').innerHTML = showRev ? fmtMoney(k.revenue || 0) : `${num(k.orders || 0)}<small>${(k.orders || 0) === 1 ? 'zamówienie' : 'zamówień'}</small>`;
  const stats = [];
  if ($('fx-ord').checked) { if (showRev) stats.push([num(k.orders || 0), 'zamówień']); stats.push([num(k.items || 0), 'kubków']); }
  if ($('fx-ads').checked && !hide) { if (k.spend != null) stats.push([zl(k.spend).replace(',00', ''), 'na reklamy']); if (k.roas != null) stats.push([num(k.roas, 1) + '×', 'ROAS']); }
  if (stats.length < 2 && k.visitors) stats.push([num(k.visitors), 'odwiedzin']);
  $('fl-stats').innerHTML = stats.slice(0, 4).map(([b, sp]) => `<div class="fl-stat"><b>${b}</b><span>${sp}</span></div>`).join('');
  const vals = s.ok ? d.dates.map((x) => s.daily[x][hide ? 'orders' : 'revenue']) : [];
  $('fl-chart').innerHTML = $('fx-chart').checked ? spark(vals) : '';
  const best = s.ok && s.bestDay && d.dates.length > 1 && s.bestDay.day === d.dates[d.dates.length - 1] && s.bestDay.revenue > 0;
  $('fl-badge').hidden = !($('fx-badge').checked && best);
  $('fl-date').textContent = new Date().toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' });
  if (!card.dataset.snow) {
    card.dataset.snow = 1;
    for (let i = 0; i < 26; i++) { const sEl = document.createElement('i'); sEl.className = 'snow'; const z = 2 + Math.random() * 5; Object.assign(sEl.style, { width: z + 'px', height: z + 'px', left: Math.random() * 100 + '%', top: Math.random() * 100 + '%' }); card.prepend(sEl); }
  }
}
$$('#fx-range .chip').forEach((b) => b.addEventListener('click', () => { fx.range = b.dataset.r; store.set('fx-range', fx.range); loadFlex(); }));
$$('#fx-theme .chip').forEach((b) => b.addEventListener('click', () => { fx.theme = b.dataset.t; store.set('fx-theme', fx.theme); renderFlex(); }));
['fx-rev', 'fx-ord', 'fx-ads', 'fx-chart', 'fx-badge', 'fx-round', 'fx-hide'].forEach((id) => { $(id).checked = store.get(id, $(id).checked); $(id).addEventListener('change', () => { store.set(id, $(id).checked); renderFlex(); }); });

function animateFlex() {
  const d = fx.data; if (!d) return;
  const el = $('fl-rev'), k = d.kpi, showRev = $('fx-rev').checked && !$('fx-hide').checked;
  const target = showRev ? (k.revenue || 0) : (k.orders || 0);
  const t0 = performance.now(), ms = 2200;
  $$('#fl-stats b').forEach((b) => (b.style.opacity = 0));
  (function f(t) {
    const p = Math.min(1, (t - t0) / ms), e = 1 - Math.pow(1 - p, 4), v = target * e;
    el.innerHTML = showRev ? fmtMoney(v) : `${num(Math.round(v))}<small>zamówień</small>`;
    if (p < 1) requestAnimationFrame(f); else { $$('#fl-stats b').forEach((b, i) => setTimeout(() => (b.style.opacity = 1), 150 * i)); confetti(3000); chaChing(); renderFlex(); }
  })(t0);
}
$('fx-play').addEventListener('click', animateFlex);
$('flexcard').addEventListener('click', animateFlex);
$('fx-full').addEventListener('click', () => { const c = $('flexcard'); (c.requestFullscreen || c.webkitRequestFullscreen)?.call(c); });
$('fx-png').addEventListener('click', async () => {
  const b = $('fx-png'); b.disabled = true; b.textContent = 'Tworzę obrazek…';
  try {
    const canvas = await html2canvas($('flexcard'), { scale: 3, backgroundColor: null, useCORS: true });
    const a = document.createElement('a');
    a.download = `winterdip-flex-${fx.range}-${new Date().toISOString().slice(0, 10)}.png`;
    a.href = canvas.toDataURL('image/png'); a.click();
  } catch (e) { alert('Nie udało się zapisać obrazka. Zrób zrzut ekranu karty.'); }
  b.disabled = false; b.textContent = '⬇️ Pobierz PNG (1080×1920)';
});

// ================= start =================
load(); loadMonth(); pollLive();
setInterval(() => load(), 5 * 60 * 1000);
setInterval(() => pollLive(), 45 * 1000);
if (store.get('tab', 'overview') === 'flex') $$('.tabs button')[1].click();
</script>
<?php endif; ?>
</body>
</html>
