// =========================================================
// HERO — zdjęcie z „żywymi” detalami:
//  - cienie gałęzi na ścianie lekko się kołyszą (CSS, .hero-stage__shadows)
//  - płomyki świeczek migoczą i rzucają drgające światło
//  - z kubków unosi się para
// Pozycje świeczek i kubków są podane w pikselach zdjęcia (1672 × 941).
// =========================================================
const gsap = window.gsap;

const IMG_W = 1672, IMG_H = 941;
const CANDLES = [
  { x: 1003, y: 626, glow: { x: 1000, y: 612, r: 95 } },   // kubek beżowy
  { x: 1297, y: 558, glow: { x: 1295, y: 545, r: 80 } },   // kubek czerwony
];
const STEAM = [
  { x: 1000, y: 336, w: 120 },   // kubek beżowy
  { x: 1305, y: 286, w: 110 },   // kubek czerwony
];

export async function initHero(reduced) {
  const hero = document.querySelector('.hero');
  if (!hero) return;

  if (!reduced) {
    const ov = hero.querySelector('.hero__overlay');
    if (ov) {
      gsap.from(ov.querySelectorAll('.hero__headline > span'), { y: 50, opacity: 0, duration: 1.3, stagger: 0.1, ease: 'expo.out', delay: 0.3 });
      gsap.from(ov.querySelectorAll('.hero__btns'), { opacity: 0, y: 24, duration: 1.1, ease: 'expo.out', delay: 0.5 });
    }
  }

  const stage = hero.querySelector('.hero-stage');
  const canvas = hero.querySelector('.hero-stage__fx');
  if (!stage || !canvas) return;
  const ctx = canvas.getContext('2d');

  // miękka „kropla” pary, rysowana raz
  const puff = document.createElement('canvas'); puff.width = puff.height = 128;
  {
    const g = puff.getContext('2d'), gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.45, 'rgba(255,255,255,.45)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  }

  let w = 0, h = 0, s = 1, dpr = 1;
  function resize() {
    dpr = Math.min(devicePixelRatio || 1, 1.5);
    w = stage.clientWidth; h = stage.clientHeight; s = w / IMG_W;
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  addEventListener('resize', resize); resize();

  // ---------- para ----------
  const puffs = [];
  function spawn(src) {
    puffs.push({
      src, x: src.x + (Math.random() - 0.5) * src.w * 0.7, y: src.y,
      age: 0, life: 3.6 + Math.random() * 2.4,
      vy: 26 + Math.random() * 18, r0: 10 + Math.random() * 10,
      ph: Math.random() * 6.28, f: 0.6 + Math.random() * 0.8, sway: 10 + Math.random() * 16,
      a: 0.045 + Math.random() * 0.04,
    });
  }

  // płynny „szum” do migotania (suma sinusów)
  const noise = (t, k) => 0.5 + 0.22 * Math.sin(t * 7.3 + k) + 0.16 * Math.sin(t * 13.1 + k * 2.1) + 0.12 * Math.sin(t * 23.7 + k * 3.7);

  let visible = true, last = performance.now(), acc = 0;
  new IntersectionObserver(([e]) => (visible = e.isIntersecting)).observe(hero);

  (function loop(now) {
    requestAnimationFrame(loop);
    const dt = Math.min((now - last) / 1000, 0.05); last = now;
    if (!visible || document.hidden) return;
    const t = now / 1000;
    ctx.clearRect(0, 0, w, h);

    // światło świeczek (canvas ma mix-blend-mode: screen)
    CANDLES.forEach((c, i) => {
      const f = reduced ? 0.5 : noise(t, i * 10);
      const gx = c.glow.x * s, gy = c.glow.y * s, gr = c.glow.r * s * (0.92 + f * 0.16);
      const glow = ctx.createRadialGradient(gx, gy, 0, gx, gy, gr);
      glow.addColorStop(0, `rgba(255,170,70,${0.16 + f * 0.14})`);
      glow.addColorStop(1, 'rgba(255,140,40,0)');
      ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(gx, gy, gr, 0, 6.29); ctx.fill();

      // płomyk: jasny rdzeń, lekko się wydłuża i przechyla
      const fh = 20 * s * (0.85 + f * 0.35), fw = 6 * s * (0.9 + f * 0.15);
      const fx = c.x * s + Math.sin(t * 5 + i) * 0.8 * s, fy = c.y * s;
      ctx.save(); ctx.translate(fx, fy); ctx.rotate(Math.sin(t * 3.1 + i * 2) * 0.06);
      const fl = ctx.createRadialGradient(0, fh * 0.15, 0, 0, 0, fh);
      fl.addColorStop(0, `rgba(255,250,225,${0.55 + f * 0.3})`);
      fl.addColorStop(0.45, `rgba(255,200,110,${0.25 + f * 0.2})`);
      fl.addColorStop(1, 'rgba(255,150,50,0)');
      ctx.fillStyle = fl; ctx.scale(fw / fh, 1);
      ctx.beginPath(); ctx.arc(0, -fh * 0.25, fh, 0, 6.29); ctx.fill();
      ctx.restore();
    });

    // para
    if (!reduced) {
      acc += dt;
      while (acc > 0.24) { acc -= 0.24; STEAM.forEach(spawn); }
    }
    for (let i = puffs.length - 1; i >= 0; i--) {
      const p = puffs[i];
      p.age += dt;
      if (p.age > p.life) { puffs.splice(i, 1); continue; }
      const k = p.age / p.life;
      const y = p.y - p.vy * p.age;
      const x = p.x + Math.sin(p.age * p.f + p.ph) * p.sway * k + k * k * 18;
      const r = (p.r0 + k * 46) * s;
      const a = p.a * Math.sin(Math.PI * Math.min(1, k * 1.15)) ;
      ctx.globalAlpha = Math.max(0, a);
      ctx.drawImage(puff, x * s - r, y * s - r, r * 2, r * 2);
    }
    ctx.globalAlpha = 1;
  })(performance.now());
}

// ---------- śnieg nad filmem: pada CAŁY CZAS, także bez scrollowania ----------
// Mieszanka: kryształki-śnieżynki (jak w logo) + miękkie płatki, 3 warstwy głębi.
export function initHeroSnow(canvas, reduced) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const dpr = Math.min(devicePixelRatio || 1, 2);

  // kryształek: 6 zaokrąglonych ramion z gałązkami
  function crystal(size, color) {
    const c = document.createElement('canvas'); c.width = c.height = size;
    const g = c.getContext('2d');
    const r = size * 0.42;
    g.translate(size / 2, size / 2);
    g.strokeStyle = color; g.lineCap = 'round'; g.lineWidth = size * 0.07;
    g.shadowColor = 'rgba(255,255,255,.8)'; g.shadowBlur = size * 0.08;
    for (let i = 0; i < 6; i++) {
      g.save(); g.rotate((i * Math.PI) / 3);
      g.beginPath(); g.moveTo(0, 0); g.lineTo(0, -r);
      g.moveTo(0, -r * 0.55); g.lineTo(-r * 0.22, -r * 0.78);
      g.moveTo(0, -r * 0.55); g.lineTo(r * 0.22, -r * 0.78);
      g.stroke(); g.restore();
    }
    g.beginPath(); g.arc(0, 0, size * 0.06, 0, 7); g.fillStyle = color; g.fill();
    return c;
  }
  function dot(size, soft) {
    const c = document.createElement('canvas'); c.width = c.height = size;
    const g = c.getContext('2d');
    const gr = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    gr.addColorStop(0, 'rgba(255,255,255,1)');
    gr.addColorStop(soft ? 0.3 : 0.6, 'rgba(255,252,248,.9)');
    gr.addColorStop(1, 'rgba(255,252,248,0)');
    g.fillStyle = gr; g.fillRect(0, 0, size, size);
    return c;
  }
  const IMG = {
    crystalW: crystal(96, '#ffffff'),
    crystalI: crystal(96, '#cfeeff'),
    dot: dot(32, false),
    soft: dot(64, true),
  };

  // warstwy: tło (małe, wolne), środek, przód (duże, szybkie, lekko rozmyte)
  const layers = [
    { density: 0.00016, kinds: ['dot', 'dot', 'crystalW'], size: [2, 5], crystal: [9, 15], speed: [22, 38], sway: 12, alpha: [0.45, 0.75], par: 0.12 },
    { density: 0.00007, kinds: ['dot', 'crystalW', 'crystalI'], size: [4, 7], crystal: [16, 26], speed: [40, 65], sway: 20, alpha: [0.7, 0.95], par: 0.3 },
    { density: 0.000016, kinds: ['soft', 'crystalW'], size: [12, 22], crystal: [30, 48], speed: [70, 110], sway: 30, alpha: [0.35, 0.6], par: 0.6, blur: true },
  ];
  const rnd = (a) => a[0] + Math.random() * (a[1] - a[0]);
  let w = 0, h = 0, flakes = [];

  function make(L, anywhere) {
    const kind = L.kinds[(Math.random() * L.kinds.length) | 0];
    const isCrystal = kind.startsWith('crystal');
    return {
      L, kind, img: IMG[kind], isCrystal,
      x: Math.random() * w, y: anywhere ? Math.random() * h : -40,
      s: isCrystal ? rnd(L.crystal) : rnd(L.size),
      v: rnd(L.speed), a: rnd(L.alpha),
      ph: Math.random() * 6.28, f: 0.3 + Math.random() * 0.7,
      rot: Math.random() * 6.28, vr: (Math.random() - 0.5) * 1.2,
    };
  }
  function resize() {
    w = canvas.clientWidth; h = canvas.clientHeight;
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    flakes = [];
    for (const L of layers) {
      const n = Math.max(8, Math.round(w * h * L.density * (reduced ? 0.3 : 1)));
      for (let i = 0; i < n; i++) flakes.push(make(L, true));
    }
  }
  resize(); addEventListener('resize', resize);

  let visible = true, lastY = scrollY, last = performance.now();
  new IntersectionObserver(([e]) => (visible = e.isIntersecting)).observe(canvas);

  (function loop(now) {
    requestAnimationFrame(loop);
    const dt = Math.min((now - last) / 1000, 0.05); last = now;
    const dy = scrollY - lastY; lastY = scrollY;
    if (!visible || document.hidden) return;
    ctx.clearRect(0, 0, w, h);
    const t = now / 1000;
    const wind = 8 + Math.sin(t * 0.15) * 10; // delikatne podmuchy
    for (const p of flakes) {
      p.y += p.v * dt * (reduced ? 0.4 : 1) - dy * p.L.par;
      p.x += (Math.sin(t * p.f + p.ph) * p.L.sway + wind) * dt;
      p.rot += p.vr * dt;
      if (p.y > h + 40) Object.assign(p, make(p.L, false));
      if (p.y < -60) { p.y = h + 30; p.x = Math.random() * w; }
      if (p.x > w + 40) p.x = -40; else if (p.x < -40) p.x = w + 40;
      ctx.globalAlpha = p.a;
      if (p.isCrystal) {
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
        ctx.drawImage(p.img, -p.s / 2, -p.s / 2, p.s, p.s);
        ctx.restore();
      } else {
        ctx.drawImage(p.img, p.x - p.s / 2, p.y - p.s / 2, p.s, p.s);
      }
    }
    ctx.globalAlpha = 1;
  })(performance.now());
}
