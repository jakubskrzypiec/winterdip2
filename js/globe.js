// =========================================================
// GLOBUS — przerywnik w barwach strony: ciemna kula, kontynenty
// z kropek (Mist), kontur Polski (Snowflake) i zamówienia.
// Po najechaniu myszką na kulę globus obraca się za kursorem,
// po zjechaniu wraca na Polskę. Scroll nic nie zmienia.
// Zamówienia na żywo: window.WINTERDIP_ORDERS_URL -> JSON
// [{ city: "Kraków", product: "mug-1", ts: 1731150000000 }]
// Bez endpointu działa tryb demo (widoczna plakietka).
// =========================================================
import * as THREE from 'three';
import { Line2 } from 'three/addons/lines/Line2.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';
import { LineGeometry } from 'three/addons/lines/LineGeometry.js';
import { CITIES, PRODUCTS, MUGS } from './data.js';

const gsap = window.gsap;
const DEG = Math.PI / 180;

function latLon(lat, lon, r = 1) {
  const phi = (lon + 180) * DEG, theta = (90 - lat) * DEG;
  return new THREE.Vector3(-Math.cos(phi) * Math.sin(theta) * r, Math.cos(theta) * r, Math.sin(phi) * Math.sin(theta) * r);
}

export async function initGlobe(reduced) {
  const sec = document.querySelector('.globe-sec');
  if (!sec) return;
  const sticky = sec.querySelector('.globe-sec__sticky');
  const canvas = sec.querySelector('.globe-canvas');

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.01, 100);

  const tilt = new THREE.Group(), spin = new THREE.Group();
  tilt.add(spin); scene.add(tilt);

  // ---------- kula: ciemny Pine, ląd z kropek w kolorze Mist ----------
  // zdjęcie Ziemi służy tylko jako maska „ląd / morze”, nie jest widoczne
  const tex = new THREE.TextureLoader().load('assets/img/earth-day.webp');
  tex.colorSpace = THREE.NoColorSpace;   // surowe wartości — tylko do maski
  tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  const earthMat = new THREE.ShaderMaterial({
    uniforms: { map: { value: tex } },
    vertexShader: `varying vec2 vUv; varying vec3 vN; varying vec3 vV;
      void main(){ vUv=uv; vN=normalize(normalMatrix*normal); vec4 mv=modelViewMatrix*vec4(position,1.); vV=normalize(-mv.xyz); gl_Position=projectionMatrix*mv; }`,
    fragmentShader: `uniform sampler2D map; varying vec2 vUv; varying vec3 vN; varying vec3 vV;
      const vec3 BASE = vec3(.18,.247,.286), MIST = vec3(.557,.631,.682), SNOW = vec3(.863,.878,.910);
      void main(){
        vec3 t = texture2D(map, vUv).rgb;
        float land = 1. - smoothstep(.02, .07, t.b - max(t.r, t.g));
        // siatka kropek co ~1,4 stopnia, kropki okrągłe także przy biegunach
        float lat = (vUv.y - .5) * 3.14159;
        vec2 cell = vec2(vUv.x * 360. * cos(lat), vUv.y * 180.) / 1.4;
        float d = length(fract(cell) - .5);
        float aa = fwidth(d) * 1.2;
        float dotm = 1. - smoothstep(.27 - aa, .27 + aa, d);
        float facing = max(dot(vN, vV), 0.);
        vec3 c = BASE * (.78 + .32 * facing);
        c = mix(c, mix(MIST, SNOW, .25), dotm * land * (.55 + .45 * facing));
        c += MIST * pow(1. - facing, 2.6) * .55;
        gl_FragColor = vec4(c, 1.);
      }`,
  });
  spin.add(new THREE.Mesh(new THREE.SphereGeometry(1, 128, 128), earthMat));

  // poświata wokół kuli (Mist)
  scene.add(new THREE.Mesh(new THREE.SphereGeometry(1.12, 64, 64), new THREE.ShaderMaterial({
    side: THREE.BackSide, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: `varying vec3 vN; void main(){ vN=normalize(normalMatrix*normal); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
    fragmentShader: `varying vec3 vN; void main(){ float i = pow(max(.62 - dot(vN, vec3(0,0,1.)), 0.), 3.); gl_FragColor = vec4(.557,.631,.682,1.) * i * .9; }`,
  })));

  // ---------- linie: granice, kontur Polski, siatka ----------
  const lineMats = [];
  const makeLine = (coords, r, color, width, opacity, dashed = false) => {
    const pts = [];
    for (const [lon, lat] of coords) { const v = latLon(lat, lon, r); pts.push(v.x, v.y, v.z); }
    const g = new LineGeometry(); g.setPositions(pts);
    const m = new LineMaterial({ color, linewidth: width, transparent: true, opacity, depthWrite: false, dashed, dashSize: 0.012, gapSize: 0.014 });
    lineMats.push(m);
    const l = new Line2(g, m); l.computeLineDistances(); spin.add(l); return l;
  };
  // delikatna przerywana siatka południków i równoleżników
  for (let lat = -60; lat <= 75; lat += 15) makeLine(Array.from({ length: 121 }, (_, i) => [-180 + i * 3, lat]), 1.001, 0x8ea1ae, 0.8, 0.18, true);
  for (let lon = -180; lon < 180; lon += 15) makeLine(Array.from({ length: 61 }, (_, i) => [lon, -88 + i * 2.93]), 1.001, 0x8ea1ae, 0.8, 0.18, true);
  try {
    const geo = await (await fetch('assets/geo/geo.json')).json();
    geo.borders.forEach((l) => makeLine(l, 1.0015, 0x8ea1ae, 0.9, 0.5));
    geo.near.forEach((l) => makeLine(l, 1.002, 0xdce0e8, 1.1, 0.55));
    geo.poland.forEach((ring) => makeLine([...ring, ring[0]], 1.003, 0xdce0e8, 2.4, 1));
  } catch (e) { console.warn('geo', e); }

  // ---------- miasta ----------
  const dotTex = makeDotTexture();
  const markers = CITIES.map((c) => {
    const pos = latLon(c.lat, c.lon, 1.006);
    const m = new THREE.Sprite(new THREE.SpriteMaterial({ map: dotTex, color: 0xffffff, transparent: true, depthWrite: false }));
    m.position.copy(pos); m.scale.setScalar(dotSize(c));
    spin.add(m);
    const label = document.createElement('span');
    label.className = 'pl-label'; label.textContent = c.name;
    sticky.appendChild(label);
    return { ...c, pos, sprite: m, label };
  });

  function pulse(city) {
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.0022, 0.003, 64), new THREE.MeshBasicMaterial({ color: 0xdce0e8, transparent: true, side: THREE.DoubleSide, depthWrite: false }));
    ring.position.copy(city.pos.clone().multiplyScalar(1.001));
    ring.lookAt(city.pos.clone().multiplyScalar(2));
    spin.add(ring);
    const o = { t: 0 };
    gsap.to(o, { t: 1, duration: 2.2, ease: 'power2.out', onUpdate: () => { ring.scale.setScalar(1 + o.t * 8); ring.material.opacity = 1 - o.t; },
      onComplete: () => { spin.remove(ring); ring.geometry.dispose(); } });
    gsap.fromTo(city.sprite.scale, { x: dotSize(city) * 1.8, y: dotSize(city) * 1.8 }, { x: dotSize(city), y: dotSize(city), duration: 1.2, ease: 'expo.out' });
    city.flash = performance.now();
  }

  // ---------- widok na Polskę; obrót tylko gdy kursor jest nad kulą ----------
  const PL = latLon(52, 19.3);
  const baseY = -Math.atan2(PL.x, PL.z);
  const baseX = 52 * DEG;
  const mobile = () => innerWidth < 960;
  const target = { x: 0, y: 0 }, look = { x: 0, y: 0 };
  const globe = { x: 0, y: 0, r: 1 };   // środek i promień kuli na ekranie (px)

  if (!reduced) {
    sticky.addEventListener('pointermove', (e) => {
      const b = sticky.getBoundingClientRect();
      const dx = (e.clientX - b.left - globe.x) / globe.r, dy = (e.clientY - b.top - globe.y) / globe.r;
      const over = dx * dx + dy * dy < 1;
      sticky.classList.toggle('is-over-globe', over);
      target.x = over ? dx : 0; target.y = over ? dy : 0;
    });
    sticky.addEventListener('pointerleave', () => { target.x = 0; target.y = 0; sticky.classList.remove('is-over-globe'); });
  }

  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
    lineMats.forEach((m) => m.resolution.set(w * renderer.getPixelRatio(), h * renderer.getPixelRatio()));
  }
  addEventListener('resize', resize); resize();

  let visible = false;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { rootMargin: '100px' }).observe(sec);
  const tmp = new THREE.Vector3(), edge = new THREE.Vector3();

  (function loop(now) {
    requestAnimationFrame(loop);
    if (!visible) return;
    const w = canvas.clientWidth, h = canvas.clientHeight;
    const m = mobile();
    // komputer: kula po prawej; telefon: pod tekstem
    camera.setViewOffset(w, h, m ? 0 : -0.24 * w, m ? -0.36 * h : 0, w, h);
    camera.position.set(0, 0, m ? 3.3 : 2.7);
    camera.updateMatrixWorld();

    // środek i promień kuli na ekranie (do wykrywania najechania)
    tmp.set(0, 0, 0).project(camera);
    globe.x = ((tmp.x + 1) / 2) * w; globe.y = ((1 - tmp.y) / 2) * h;
    edge.set(0, 1, 0).project(camera);
    globe.r = Math.abs(((1 - edge.y) / 2) * h - globe.y) * 1.02;

    look.x += (target.x - look.x) * 0.06;
    look.y += (target.y - look.y) * 0.06;
    spin.rotation.y = baseY + look.x * 0.6;
    tilt.rotation.x = baseX + look.y * 0.35;

    renderer.render(scene, camera);

    for (const c of markers) {
      c.sprite.getWorldPosition(tmp);
      const facing = tmp.clone().normalize().dot(camera.position.clone().normalize()) > 0.2;
      tmp.project(camera);
      const flash = c.flash && now - c.flash < 2200;
      c.label.style.opacity = facing && (c.w >= 10 || flash) ? 1 : 0;
      c.label.style.left = ((tmp.x + 1) / 2) * w + 'px';
      c.label.style.top = ((1 - tmp.y) / 2) * h + 'px';
    }
  })(performance.now());

  initFeed(sec, pulse, markers);
}

// rozmiar kropki miasta (większe miasto = większa kropka)
function dotSize(c) { return 0.009 + c.w * 0.0005; }

// ostra kropka: biała (Snowflake) z obwódką Berry, rysowana w wysokiej rozdzielczości
function makeDotTexture() {
  const S = 256, c = document.createElement('canvas'); c.width = c.height = S;
  const g = c.getContext('2d'), mid = S / 2;
  const halo = g.createRadialGradient(mid, mid, S * 0.18, mid, mid, S * 0.5);
  halo.addColorStop(0, 'rgba(220,224,232,.45)'); halo.addColorStop(1, 'rgba(220,224,232,0)');
  g.fillStyle = halo; g.fillRect(0, 0, S, S);
  g.beginPath(); g.arc(mid, mid, S * 0.26, 0, Math.PI * 2); g.fillStyle = '#6b212c'; g.fill();
  g.beginPath(); g.arc(mid, mid, S * 0.18, 0, Math.PI * 2); g.fillStyle = '#dce0e8'; g.fill();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  t.generateMipmaps = true; t.minFilter = THREE.LinearMipmapLinearFilter; t.anisotropy = 8;
  return t;
}

// ---------------- feed zamówień ----------------
function initFeed(sec, pulse, markers) {
  const feed = sec.querySelector('.order-feed');
  const countEl = sec.querySelector('[data-orders-today]');
  const citiesEl = sec.querySelector('[data-orders-cities]');
  const badge = sec.querySelector('.demo-badge');
  const endpoint = window.WINTERDIP_ORDERS_URL;
  const byName = Object.fromEntries(markers.map((m) => [m.name, m]));
  const seenCities = new Set();
  let total = 0, active = false;
  new IntersectionObserver(([e]) => { active = e.isIntersecting; }).observe(sec);

  function push(order) {
    const city = byName[order.city];
    const product = PRODUCTS[order.product] || PRODUCTS[MUGS[0]];
    total++; if (countEl) countEl.textContent = total;
    seenCities.add(order.city); if (citiesEl) citiesEl.textContent = seenCities.size;
    if (city) pulse(city);
    const el = document.createElement('div');
    el.className = 'order-toast';
    const ago = order.ts ? Math.max(0, Math.round((Date.now() - order.ts) / 60000)) : 0;
    el.innerHTML = `<div>Nowe zamówienie · <b>${order.city}</b><small>${product.name} · ${ago ? ago + ' min temu' : 'przed chwilą'}</small></div>`;
    feed.appendChild(el);
    gsap.fromTo(el, { opacity: 0, y: 30, scale: 0.96 }, { opacity: 1, y: 0, scale: 1, duration: 0.7, ease: 'expo.out' });
    const items = feed.querySelectorAll('.order-toast');
    if (items.length > 3) gsap.to(items[0], { opacity: 0, height: 0, padding: 0, margin: 0, duration: 0.4, onComplete: () => items[0].remove() });
  }

  if (endpoint) {
    badge?.remove();
    let lastTs = 0;
    const poll = async () => {
      try {
        const data = await (await fetch(endpoint, { cache: 'no-store' })).json();
        const fresh = data.filter((o) => (o.ts || 0) > lastTs).sort((a, b) => a.ts - b.ts);
        fresh.slice(-5).forEach((o, i) => setTimeout(() => push(o), i * 900));
        if (data.length) lastTs = Math.max(...data.map((o) => o.ts || 0));
      } catch {}
      setTimeout(poll, 8000);
    };
    poll();
    return;
  }

  const avail = MUGS.filter((id) => !PRODUCTS[id].soldOut);
  const weighted = markers.flatMap((m) => Array(m.w).fill(m.name));
  const tick = () => {
    if (active && document.visibilityState === 'visible') {
      push({ city: weighted[(Math.random() * weighted.length) | 0], product: avail[(Math.random() * avail.length) | 0], ts: Date.now() });
    }
    setTimeout(tick, 2200 + Math.random() * 2600);
  };
  setTimeout(tick, 1200);
}
