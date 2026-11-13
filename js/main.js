import { initCart, fmt } from './cart.js';
import { REVIEWS, FAQ, SHOP, PRODUCTS } from './data.js';
import { syncProducts, shopifyOn, policyUrl } from './shopify.js';
import { initTracking } from './tracking.js';
import { hit } from './stats.js';

initTracking();
hit('pv');

const gsap = window.gsap;
const ScrollTrigger = window.ScrollTrigger;
gsap.registerPlugin(ScrollTrigger);
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
if (reduced) document.documentElement.classList.add('reduced');

// ---------- smooth scroll ----------
let lenis;
if (!reduced && window.Lenis) {
  lenis = new window.Lenis({ lerp: 0.12, wheelMultiplier: 0.75, touchMultiplier: 1, smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href^="#"]');
  if (!a || a.getAttribute('href').length < 2) return;
  const el = document.querySelector(a.getAttribute('href'));
  if (!el) return;
  e.preventDefault();
  document.querySelector('.nav')?.classList.remove('is-open');
  lenis ? lenis.scrollTo(el, { offset: -70, duration: 1.6 }) : el.scrollIntoView({ behavior: 'smooth' });
});

// ---------- header ----------
const header = document.querySelector('.header');
let lastY = 0;
const onScroll = () => {
  const y = scrollY;
  header.classList.toggle('is-scrolled', y > 40);
  header.classList.toggle('is-hidden', y > lastY && y > 400 && !document.documentElement.classList.contains('cart-open'));
  lastY = y;
};
addEventListener('scroll', onScroll, { passive: true }); onScroll();
document.querySelector('.burger')?.addEventListener('click', () => document.querySelector('.nav').classList.toggle('is-open'));

// ---------- split text ----------
function splitLines(el) {
  // split on <br> or explicit lines; wrap each into mask
  const parts = el.innerHTML.split(/<br\s*\/?>/i);
  el.innerHTML = parts.map((p) => `<span class="split-line"><span>${p.trim()}</span></span>`).join('');
  return el.querySelectorAll('.split-line > span');
}
document.querySelectorAll('[data-split]').forEach((el) => {
  const lines = splitLines(el);
  if (reduced || el.closest('.hero')) return;
  gsap.from(lines, { yPercent: 110, rotate: 2, duration: 1.3, stagger: 0.09, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 85%' } });
});
gsap.utils.toArray('[data-reveal]').forEach((el) => {
  if (reduced) return;
  gsap.to(el, { opacity: 1, y: 0, duration: 1.2, ease: 'expo.out', delay: parseFloat(el.dataset.reveal) || 0, scrollTrigger: { trigger: el, start: 'top 88%' } });
});

// ---------- cart ----------
initCart();

// ---------- landing-only ----------
if (document.querySelector('.hero')) {
  import('./hero.js?v=19').then((m) => m.initHero(reduced));
}
if (document.querySelector('.globe-sec')) {
  import('./globe.js').then((m) => m.initGlobe(reduced)).catch((e) => console.warn('Globe disabled', e));
}

// product cards tilt
document.querySelectorAll('[data-tilt]').forEach((card) => {
  if (reduced || matchMedia('(hover: none)').matches) return;
  const media = card.querySelector('.p-card__media > *:last-child');
  card.addEventListener('pointermove', (e) => {
    const r = card.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
    gsap.to(media, { x: x * 30, y: y * 20, rotateY: x * 14, rotateX: -y * 10, duration: 0.8, ease: 'power3.out', transformPerspective: 900 });
  });
  card.addEventListener('pointerleave', () => gsap.to(media, { x: 0, y: 0, rotateY: 0, rotateX: 0, duration: 1.2, ease: 'elastic.out(1, .5)' }));
});

// reviews
const rows = document.querySelector('.reviews__rows');
if (rows) {
  const card = (r) => `<article class="r-card"><span class="stars" aria-label="${r.stars} na 5">${'★'.repeat(r.stars)}${'☆'.repeat(5 - r.stars)}</span><p>„${r.text}”</p><footer><span class="avatar">${r.name[0]}</span><div><b>${r.name}</b> · ${r.city}${r.verified ? '<span class="verified">✓ Zweryfikowany zakup</span>' : ''}</div></footer></article>`;
  const half = Math.ceil(REVIEWS.length / 2);
  const a = REVIEWS.slice(0, half), b = REVIEWS.slice(half);
  rows.innerHTML = [a, b].map((set, i) => `<div class="reviews__row${i ? ' reviews__row--right' : ''}">${[...set, ...set].map(card).join('')}</div>`).join('');
}

// FAQ
const faqList = document.querySelector('.faq__list');
if (faqList) {
  faqList.innerHTML = FAQ.map(([q, a]) => `<details class="faq-item"><summary>${q}<span class="plus" aria-hidden="true"></span></summary><div class="faq-item__body"><p>${a}</p></div></details>`).join('');
  faqList.querySelectorAll('details').forEach((d) => {
    const body = d.querySelector('.faq-item__body');
    d.querySelector('summary').addEventListener('click', (e) => {
      e.preventDefault();
      if (d.open) {
        gsap.to(body, { height: 0, duration: 0.5, ease: 'expo.out', onComplete: () => { d.open = false; body.style.height = ''; } });
      } else {
        d.open = true;
        gsap.fromTo(body, { height: 0 }, { height: 'auto', duration: 0.7, ease: 'expo.out' });
      }
    });
  });
  // FAQ structured data for SEO
  const ld = document.createElement('script');
  ld.type = 'application/ld+json';
  ld.textContent = JSON.stringify({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: FAQ.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) });
  document.head.appendChild(ld);
}

// contact form -> mailto (TODO: podmień na Formspree / backend)
document.querySelector('.form')?.addEventListener('submit', (e) => {
  e.preventDefault();
  const f = e.target, note = f.querySelector('.form__note');
  const body = `Imię: ${f.name.value}\nE-mail: ${f.email.value}\n\n${f.message.value}`;
  location.href = `mailto:${f.dataset.to}?subject=${encodeURIComponent('Wiadomość ze strony Winterdip')}&body=${encodeURIComponent(body)}`;
  note.textContent = 'Otwieramy Twoją pocztę — dziękujemy za wiadomość!';
});
document.querySelector('.newsletter')?.addEventListener('submit', (e) => {
  e.preventDefault();
  e.target.innerHTML = '<p style="margin:0;color:var(--gold)">Dzięki! Odezwiemy się z zimowymi nowościami.</p>';
});

// ---------- wyprzedaż: odliczanie do SHOP.saleEnds (jedna data dla wszystkich) ----------
{
  const end = new Date(SHOP.saleEnds).getTime();
  const pad = (n) => String(n).padStart(2, '0');
  const timers = document.querySelectorAll('[data-sale-countdown]');
  const tick = () => {
    const ms = end - Date.now();
    if (!SHOP.saleEnds || ms <= 0) {
      // po wyprzedaży: chowamy pasek, licznik, przekreślone ceny i plakietki
      document.querySelectorAll('[data-sale-only]').forEach((el) => el.remove());
      document.documentElement.classList.remove('has-announce');
      return false;
    }
    const dd = Math.floor(ms / 864e5), hh = Math.floor((ms % 864e5) / 36e5), mm = Math.floor((ms % 36e5) / 6e4), ss = Math.floor((ms % 6e4) / 1e3);
    timers.forEach((el) => {
      el.innerHTML = el.dataset.format === 'boxes'
        ? [[dd, 'dni'], [hh, 'godz'], [mm, 'min'], [ss, 'sek']].map(([v, l]) => `<span><b>${pad(v)}</b><small>${l}</small></span>`).join('')
        : `${dd} d ${pad(hh)}:${pad(mm)}:${pad(ss)}`;
    });
    return true;
  };
  if (tick()) setInterval(tick, 1000);
}

// ---------- christmas deadline ----------
document.querySelectorAll('[data-deadline]').forEach((el) => {
  const end = new Date(SHOP.christmasCutoff).getTime();
  const tick = () => {
    const ms = end - Date.now();
    if (ms <= 0) { el.closest('.deadline, .announce')?.remove(); return; }
    const d = Math.floor(ms / 864e5), h = Math.floor((ms % 864e5) / 36e5), m = Math.floor((ms % 36e5) / 6e4);
    el.textContent = `${d} dni ${String(h).padStart(2, '0')} godz ${String(m).padStart(2, '0')} min`;
  };
  tick(); setInterval(tick, 30000);
});

// ---------- product page ----------
document.querySelectorAll('.pdp').forEach((pdp) => {
  const main = pdp.querySelector('.pdp__main-media');
  pdp.querySelectorAll('.pdp__thumbs button').forEach((b) => b.addEventListener('click', () => {
    pdp.querySelectorAll('.pdp__thumbs button').forEach((x) => x.classList.remove('is-active'));
    b.classList.add('is-active');
    if (b.dataset.src) {   // galeria zdjęć: płynna podmiana zdjęcia
      gsap.to(main, { opacity: 0, duration: 0.2, onComplete: () => { main.src = b.dataset.src; main.alt = b.getAttribute('aria-label'); gsap.to(main, { opacity: 1, duration: 0.35 }); } });
      return;
    }
    const v = b.dataset.view;
    const views = { front: { scale: 1, x: 0, y: 0, rotate: 0 }, candle: { scale: 2.1, x: '18%', y: '-38%', rotate: 0 }, top: { scale: 1.9, x: '12%', y: '40%', rotate: 0 }, fork: { scale: 1.8, x: '-30%', y: '30%', rotate: -6 } };
    gsap.to(main, { ...views[v], duration: 1, ease: 'expo.inOut' });
  }));
  const qtyEl = pdp.querySelector('.pdp__buy .qty span');
  pdp.querySelector('[data-q="-"]')?.addEventListener('click', () => { qtyEl.textContent = Math.max(1, +qtyEl.textContent - 1); });
  pdp.querySelector('[data-q="+"]')?.addEventListener('click', () => { qtyEl.textContent = Math.min(20, +qtyEl.textContent + 1); });
});
// ---------- ceny, rabaty, dostępność (najpierw z data.js, potem z Shopify) ----------
function applyProducts() {
  document.querySelectorAll('[data-price]').forEach((el) => { el.textContent = fmt(PRODUCTS[el.dataset.price].price); });
  document.querySelectorAll('[data-old-price]').forEach((el) => {
    const p = PRODUCTS[el.dataset.oldPrice];
    el.hidden = !(p.oldPrice > p.price);
    if (!el.hidden) el.textContent = fmt(p.oldPrice);
  });
  document.querySelectorAll('[data-discount]').forEach((el) => {
    const p = PRODUCTS[el.dataset.discount];
    el.hidden = !(p && p.oldPrice > p.price);
    if (!el.hidden) el.textContent = '−' + Math.round((1 - p.price / p.oldPrice) * 100) + '%';
  });
  document.querySelectorAll('[data-name]').forEach((el) => { (el.querySelector('a') || el).textContent = PRODUCTS[el.dataset.name].name; });
  // wyprzedane w Shopify -> przyciski „Do koszyka” nieaktywne
  document.querySelectorAll('[data-add]').forEach((b) => {
    const p = PRODUCTS[b.dataset.add];
    if (p?.soldOut) { b.disabled = true; b.textContent = 'Wyprzedane'; b.closest('.p-card')?.classList.add('is-sold'); }
  });
}
applyProducts();
syncProducts().then((ok) => { if (ok) applyProducts(); });

// regulamin i polityki: strony generowane przez Shopify
if (shopifyOn()) document.querySelectorAll('[data-policy]').forEach((a) => { a.href = policyUrl(a.dataset.policy); a.target = '_blank'; a.rel = 'noopener'; });

const sticky = document.querySelector('.sticky-buy');
if (sticky) {
  const firstBuy = document.querySelector('.pdp__buy');
  const footer = document.querySelector('.footer');
  let pastBuy = false, atFooter = false;
  const upd = () => sticky.classList.toggle('show', pastBuy && !atFooter);
  // telefon: pasek z ceną i przyciskiem widoczny od razu, gdy główny przycisk jest poza ekranem (nad nim lub pod nim)
  const mobile = matchMedia('(max-width: 760px)');
  new IntersectionObserver(([e]) => { pastBuy = !e.isIntersecting && (mobile.matches || e.boundingClientRect.top < 0); upd(); }).observe(firstBuy);
  new IntersectionObserver(([e]) => { atFooter = e.isIntersecting; upd(); }).observe(footer);
}

addEventListener('load', () => ScrollTrigger.refresh());
