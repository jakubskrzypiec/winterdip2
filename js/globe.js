// =========================================================
// GLOBUS 3D — od razu w rogu, ustawiony na Polskę. Scroll nic nie
// zmienia, globus lekko podąża za myszką. Widać kontur kraju i miasta.
// Zamówienia na żywo: window.WINTERDIP_ORDERS_URL -> JSON
// [{ city: "Kraków", product: "chocolate-mug", ts: 1731150000000 }]
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
  camera.position.set(0, 0, 4.4);

  const tilt = new THREE.Group(), spin = new THREE.Group();
  tilt.add(spin); scene.add(tilt);

  // ---------- Ziemia ----------
  const tex = new THREE.TextureLoader().load('assets/img/earth-day.webp');
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  const earthMat = new THREE.ShaderMaterial({
    uniforms: { map: { value: tex } },
    vertexShader: `varying vec2 vUv; varying vec3 vN; varying vec3 vV;
      void main(){ vUv=uv; vN=normalize(normalMatrix*normal); vec4 mv=modelViewMatrix*vec4(position,1.); vV=normalize(-mv.xyz); gl_Position=projectionMatrix*mv; }`,
    fragmentShader: `uniform sampler2D map; varying vec2 vUv; varying vec3 vN; varying vec3 vV;
      // przemalowanie zdjęcia Ziemi na paletę strony:
      // morze = Pine, ląd = Branch -> Frosty Silver, śnieg i lód = Snowflake
      const vec3 PINE = vec3(.153,.212,.247), MIST = vec3(.557,.631,.682);
      const vec3 BRANCH = vec3(.408,.337,.322), SILVER = vec3(.745,.702,.675), SNOW = vec3(.863,.878,.910);
      void main(){
        vec3 t = texture2D(map, vUv).rgb;
        float lum = dot(t, vec3(.299,.587,.114));
        float water = smoothstep(.0, .08, t.b - max(t.r, t.g));
        float ice = smoothstep(.55, .8, lum);
        vec3 land = mix(BRANCH, SILVER, smoothstep(.06, .38, lum));
        vec3 sea = mix(PINE * .85, mix(PINE, MIST, .35), smoothstep(.02, .25, lum));
        vec3 c = mix(land, sea, water);
        c = mix(c, SNOW, ice);
        float facing = max(dot(vN, vV), 0.);
        float light = .82 + .3 * max(dot(vN, normalize(vec3(-.35,.45,.85))), 0.);
        c *= light;
        c += MIST * pow(1. - facing, 3.) * .45;
        gl_FragColor = vec4(c, 1.);
      }`,
  });
  spin.add(new THREE.Mesh(new THREE.SphereGeometry(1, 128, 128), earthMat));

  // atmosfera (mglisty błękit z palety)
  scene.add(new THREE.Mesh(new THREE.SphereGeometry(1.1, 64, 64), new THREE.ShaderMaterial({
    side: THREE.BackSide, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: `varying vec3 vN; void main(){ vN=normalize(normalMatrix*normal); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
    fragmentShader: `varying vec3 vN; void main(){ float i = pow(max(.65 - dot(vN, vec3(0,0,1.)), 0.), 3.); gl_FragColor = vec4(.56,.63,.68,1.) * i * 1.3; }`,
  })));

  // ---------- granice i Polska ----------
  const lineMats = [];
  const makeLine = (coords, r, color, width, opacity) => {
    const pts = [];
    for (const [lon, lat] of coords) { const v = latLon(lat, lon, r); pts.push(v.x, v.y, v.z); }
    const g = new LineGeometry(); g.setPositions(pts);
    const m = new LineMaterial({ color, linewidth: width, transparent: true, opacity, depthWrite: false });
    lineMats.push(m);
    const l = new Line2(g, m); l.computeLineDistances(); spin.add(l); return l;
  };
  let plOutline = [], nearLines = [], worldLines = [];
  try {
    const geo = await (await fetch('assets/geo/geo.json')).json();
    worldLines = geo.borders.map((l) => makeLine(l, 1.0015, 0xdce0e8, 1, 0.45));
    nearLines = geo.near.map((l) => makeLine(l, 1.002, 0xdce0e8, 1.4, 0.7));
    plOutline = geo.poland.map((ring) => makeLine([...ring, ring[0]], 1.003, 0xffffff, 2.6, 1));
    // (bez wypełnienia — sam biały kontur Polski)
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

  // ---------- stały widok na Polskę + lekkie podążanie za myszką ----------
  const PL = latLon(52, 19.3);
  const baseY = -Math.atan2(PL.x, PL.z);
  const baseX = 52 * DEG;
  const mobile = () => innerWidth < 960;
  const mouse = { x: 0, y: 0 }, look = { x: 0, y: 0 };
  if (!reduced) addEventListener('pointermove', (e) => {
    mouse.x = (e.clientX / innerWidth) * 2 - 1;
    mouse.y = (e.clientY / innerHeight) * 2 - 1;
  }, { passive: true });

  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
    lineMats.forEach((m) => m.resolution.set(w * renderer.getPixelRatio(), h * renderer.getPixelRatio()));
  }
  addEventListener('resize', resize); resize();

  let visible = false;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { rootMargin: '100px' }).observe(sec);
  const tmp = new THREE.Vector3();

  (function loop(now) {
    requestAnimationFrame(loop);
    if (!visible) return;
    const w = canvas.clientWidth, h = canvas.clientHeight;
    const m = mobile();
    // globus w prawym dolnym rogu (telefon: niżej, na środku)
    camera.setViewOffset(w, h, m ? 0 : -0.31 * w, m ? -0.12 * h : 0.02 * h, w, h);
    camera.position.set(0, 0, m ? 2.8 : 2.2);

    // płynne dojście do pozycji myszki + delikatne kołysanie
    look.x += (mouse.x - look.x) * 0.05;
    look.y += (mouse.y - look.y) * 0.05;
    const sway = reduced ? 0 : Math.sin(now * 0.0004) * 0.02;
    spin.rotation.y = baseY + look.x * 0.16 + sway;
    tilt.rotation.x = baseX + look.y * 0.1;

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
