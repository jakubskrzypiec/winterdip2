// =========================================================
// HERO — film na pełny ekran sterowany scrollem
// Klatki: tools/extract-frames.sh -> assets/hero/
//
// Płynność:
//  - klatki pobierane jako skompresowane pliki, dekodowane tylko w oknie
//    wokół bieżącej pozycji i od razu w rozmiarze ekranu (mało pamięci)
//  - pozycja filmu szybko „dogania” scroll (lerp)
//  - rysowanie tylko gdy zmienia się klatka
// =========================================================
const gsap = window.gsap;
const ScrollTrigger = window.ScrollTrigger;

export async function initHero(reduced) {
  const hero = document.querySelector('.hero');
  if (!hero) return;
  const canvas = hero.querySelector('.hero__canvas');
  const loader = hero.querySelector('.hero__loader');

  // w hero widać tylko logo
  // (sprawdzane przy każdym scrollu, więc działa też po odświeżeniu w połowie strony)
  const syncInHero = () => document.documentElement.classList.toggle('in-hero',
    scrollY < hero.offsetTop + hero.offsetHeight - innerHeight * 0.6);
  addEventListener('scroll', syncInHero, { passive: true });
  addEventListener('resize', syncInHero);
  syncInHero();

  initHeroSnow(hero.querySelector('.hero__snow'), reduced);
  const chapters = initChapters(hero, reduced);

  // telefon: zamiast filmu pionowe zdjęcie (lekko, bez pobierania ~25 MB klatek)
  if (matchMedia('(max-width: 760px)').matches) {
    hero.classList.add('is-still');
    if (loader) loader.style.opacity = 0;
    return;
  }

  let manifest = null;
  try {
    const r = await fetch('assets/hero/frames.json', { cache: 'no-cache' });
    if (r.ok) manifest = await r.json();
  } catch {}

  if (!manifest || !manifest.count) {
    hero.classList.add('is-fallback');
    if (loader) loader.style.opacity = 0;
    return;
  }

  const src = manifest;
  const N = src.count;
  const url = (i) => `assets/hero/${src.dir}/${String(i + 1).padStart(4, '0')}.${src.ext || 'webp'}`;
  const ctx = canvas.getContext('2d', { alpha: false });

  // ---------- pamięć ----------
  // Wszystkie klatki trzymamy jako skompresowane pliki (ok. 30 MB).
  // Do rysowania dekodujemy tylko klatki wokół bieżącej pozycji (okno),
  // od razu w rozmiarze ekranu. Dekodowanie wszystkich 481 klatek Full HD
  // naraz zajmowało kilka GB pamięci i zacinało przeglądarkę.
  const blobs = new Array(N);
  const bitmaps = new Map();          // indeks -> ImageBitmap
  const pending = new Set();
  const WINDOW = 30;                  // ile klatek przed bieżącą trzymamy gotowych (za nią: 1/3)
  const useBitmap = 'createImageBitmap' in window;

  // ---------- scroll -> docelowa pozycja ----------
  let target = 0, current = 0, dir = 1;
  ScrollTrigger.create({
    trigger: hero, start: 'top top', end: 'bottom bottom',
    onUpdate: (self) => { target = self.progress * (N - 1); dir = self.direction || dir; chapters(self.progress); },
  });

  // ---------- rozmiar canvasa (bez nadmiarowej rozdzielczości) ----------
  let cw = 0, ch = 0, decodeW = 1280, dirty = true;
  function resize() {
    const full = (src.width || 1920) * 1.1;
    const dpr = Math.min(window.devicePixelRatio || 1, 2, Math.max(1, full / canvas.clientWidth));
    cw = canvas.width = Math.round(canvas.clientWidth * dpr);
    ch = canvas.height = Math.round(canvas.clientHeight * dpr);
    // klatka 16:9 dopasowana „cover” — dekodujemy dokładnie w potrzebnej szerokości
    decodeW = Math.min(src.width || 1920, Math.ceil(Math.max(cw * 0.72, ch * 16 / 9)));
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    bitmaps.forEach((b) => b.close && b.close()); bitmaps.clear();
    dirty = true;
  }
  addEventListener('resize', resize);
  resize();

  async function decode(i) {
    if (!blobs[i] || bitmaps.has(i) || pending.has(i)) return;
    pending.add(i);
    try {
      let img;
      if (useBitmap) {
        // pełna rozdzielczość klatki; zmniejszamy tylko, gdy ekran jest wyraźnie mniejszy
        img = (src.width || 1920) > decodeW * 1.15
          ? await createImageBitmap(blobs[i], { resizeWidth: decodeW, resizeQuality: 'medium' })
          : await createImageBitmap(blobs[i]);
      } else {
        img = new Image(); img.src = URL.createObjectURL(blobs[i]); await img.decode();
      }
      bitmaps.set(i, img);
      if (Math.abs(i - Math.round(current)) < 2) dirty = true;
    } catch {}
    pending.delete(i);
  }

  // utrzymuje okno zdekodowanych klatek wokół bieżącej i zwalnia resztę
  function keepWindow(c) {
    for (const [i, b] of bitmaps) {
      if (Math.abs(i - c) > WINDOW + 6) { b.close && b.close(); bitmaps.delete(i); }
    }
    for (let d = 0; d <= WINDOW && pending.size < 6; d++) {
      const ahead = c + d * dir, behind = c - d * dir;
      if (ahead >= 0 && ahead < N) decode(ahead);
      if (d && d <= WINDOW / 3 && behind >= 0 && behind < N) decode(behind);
    }
  }

  // ---------- rysowanie ----------
  function nearest(i) {
    if (bitmaps.has(i)) return bitmaps.get(i);
    for (let d = 1; d < N; d++) {
      if (bitmaps.has(i - d * dir)) return bitmaps.get(i - d * dir);
      if (bitmaps.has(i + d * dir)) return bitmaps.get(i + d * dir);
    }
    return null;
  }
  let lastKey = '';
  // Kadr: cały film mieści się w wysokości pod paskiem nagłówka (bez mocnego przybliżenia).
  // Gdy ekran jest szerszy niż film, boki wypełnia jednolite tło w kolorze filmu,
  // a ostra klatka ma miękko wygaszone krawędzie — bez widocznych pasów.
  let bgGrad = null;
  const soft = document.createElement('canvas'); const fctx = soft.getContext('2d');
  function topPx() {
    const h = document.querySelector('.header');
    return Math.max(0, h ? h.getBoundingClientRect().bottom : 0) * (cw / canvas.clientWidth || 1);
  }
  function blit(img, alpha) {
    const top = topPx(), ah = ch - top;
    const s = Math.max(ah / img.height, (cw / img.width) * 0.72);
    const w = Math.round(img.width * s), h = Math.round(img.height * s);
    const x = Math.round((cw - w) / 2), y = Math.round(top + (ah - h) / 2);
    ctx.globalAlpha = alpha;
    if (w < cw || y > 0) {
      // stałe tło w kolorze tła filmu (góra ciemniejsza, dół jaśniejszy) — bez migających plam ze wstęg
      if (!bgGrad || bgGrad.h !== ch) {
        bgGrad = ctx.createLinearGradient(0, 0, 0, ch); bgGrad.h = ch;
        bgGrad.addColorStop(0, '#8c96a0'); bgGrad.addColorStop(0.5, '#a3acb5'); bgGrad.addColorStop(1, '#cdd0d6');
      }
      ctx.fillStyle = bgGrad; ctx.fillRect(0, 0, cw, ch);
      if (soft.width !== w || soft.height !== h) { soft.width = w; soft.height = h; }
      fctx.globalCompositeOperation = 'source-over';
      fctx.drawImage(img, 0, 0, w, h);
      fctx.globalCompositeOperation = 'destination-in';
      const g = fctx.createLinearGradient(0, 0, w, 0);
      const e = w < cw ? 0.14 : 0;
      g.addColorStop(0, e ? 'rgba(0,0,0,0)' : '#000'); g.addColorStop(e || 0.0001, '#000');
      g.addColorStop(1 - (e || 0.0001), '#000'); g.addColorStop(1, e ? 'rgba(0,0,0,0)' : '#000');
      fctx.fillStyle = g; fctx.fillRect(0, 0, w, h);
      ctx.drawImage(soft, x, y);
    } else {
      ctx.drawImage(img, x, y, w, h);
    }
  }
  // pos = pozycja z ułamkiem; między klatkami delikatnie je przenikamy,
  // dzięki czemu ruch jest ciągły zamiast „klatka po klatce”
  function draw(pos) {
    const a = Math.max(0, Math.min(N - 1, Math.floor(pos)));
    const b = Math.min(N - 1, a + 1);
    let t = pos - a;
    const imgA = bitmaps.get(a) || nearest(a);
    if (!imgA) return;
    const imgB = t > 0.02 && b !== a ? bitmaps.get(b) : null;
    if (!imgB) t = 0;
    const key = a + ':' + (imgB ? Math.round(t * 16) : 0);
    if (key === lastKey && !dirty) return;
    lastKey = key; dirty = false;
    blit(imgA, 1);
    if (imgB) blit(imgB, Math.round(t * 16) / 16);
    ctx.globalAlpha = 1;
  }

  let heroVisible = true;
  new IntersectionObserver(([e]) => { heroVisible = e.isIntersecting; }).observe(hero);
  (function loop() {
    requestAnimationFrame(loop);
    if (!heroVisible) return;
    const diff = target - current;
    current = reduced || Math.abs(diff) < 0.005 ? target : current + diff * 0.25;
    const i = Math.max(0, Math.min(N - 1, Math.round(current)));
    keepWindow(i);
    draw(Math.max(0, Math.min(N - 1, current)));
  })();

  // ---------- pobieranie: najpierw co 16. klatka (szybki podgląd), potem gęściej ----------
  const order = [], seen = new Set();
  [32, 16, 8, 4, 2, 1].forEach((step) => { for (let i = 0; i < N; i += step) if (!seen.has(i)) { seen.add(i); order.push(i); } });
  let cursor = 0, loaded = 0;
  async function load(i) {
    try { blobs[i] = await (await fetch(url(i))).blob(); } catch {}
    loaded++;
    if (loader) { loader.style.width = (loaded / N) * 100 + '%'; if (loaded === N) loader.style.opacity = 0; }
    if (Math.abs(i - Math.round(current)) <= WINDOW) { dirty = true; }
  }
  async function worker() { while (cursor < order.length) await load(order[cursor++]); }
  await load(order[cursor++]); // pierwsza klatka od razu
  await decode(0); dirty = true;
  for (let k = 0; k < 6; k++) worker();
}

// ---------- napisy-rozdziały nad filmem ----------
// Każdy rozdział ma zakres scrolla (data-from / data-to). Wchodzi słowo po słowie,
// a w trakcie lekko „płynie” w górę (paralaksa). Pasek z prawej pokazuje postęp.
function initChapters(hero, reduced) {
  const chs = [...hero.querySelectorAll('.cine-ch')];
  // podział tytułów na słowa (maska + opóźnienie dla każdego słowa)
  chs.forEach((ch) => {
    let i = 0;
    ch.querySelectorAll('.cine-line').forEach((line) => {
      const walk = (node) => {
        [...node.childNodes].forEach((n) => {
          if (n.nodeType === 3) {
            const frag = document.createDocumentFragment();
            n.textContent.split(/(\s+)/).forEach((w) => {
              if (!w) return;
              if (/^\s+$/.test(w)) { frag.append(w); return; }
              const sp = document.createElement('span');
              sp.className = 'cine-w'; sp.style.setProperty('--i', i++); sp.textContent = w;
              frag.append(sp);
            });
            n.replaceWith(frag);
          } else if (n.nodeType === 1) walk(n);
        });
      };
      walk(line);
    });
  });
  const rail = hero.querySelector('.cine-rail i');
  const cue = hero.querySelector('.cine-cue');
  // pierwszy rozdział wchodzi po załadowaniu strony
  if (!reduced) { chs[0]?.classList.remove('is-in'); requestAnimationFrame(() => setTimeout(() => chs[0]?.classList.add('is-in'), 250)); }
  return function update(p) {
    chs.forEach((ch) => {
      const a = +ch.dataset.from, b = +ch.dataset.to;
      const on = p >= a && p < b;
      ch.classList.toggle('is-in', on);
      if (on) ch.style.setProperty('--lp', ((p - a) / (b - a)).toFixed(3));
    });
    if (rail) rail.style.transform = `scaleY(${p.toFixed(4)})`;
    if (cue) cue.classList.toggle('is-hidden', p > 0.02);
  };
}

// ---------- śnieg nad filmem: pada CAŁY CZAS, także bez scrollowania ----------
// Mieszanka: kryształki-śnieżynki (jak w logo) + miękkie płatki, 3 warstwy głębi.
export function initHeroSnow(canvas, reduced) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const dpr = Math.min(devicePixelRatio || 1, 1.25);

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
      const n = Math.max(6, Math.round(w * h * L.density * 0.6 * (reduced ? 0.3 : 1)));
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
