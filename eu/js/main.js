// Wersja międzynarodowa (EN/DE): wspólny skrypt stron. Teksty z i18n.js.
import { initCart } from './cart.js';
import { FAQ, SHOP, PRODUCTS, SELLER } from './data.js';
import { syncProducts } from './shopify.js';
import { initTracking } from './tracking.js';
import { hit } from './stats.js';
import { T, t, LANG, SITE_LANG, setLang, money } from './i18n.js';

// ---------- język: teksty z data-i18n, przełącznik ----------
document.documentElement.lang = LANG;
document.querySelectorAll('[data-i18n]').forEach((el) => { el.innerHTML = t(el.dataset.i18n); });
document.querySelectorAll('[data-i18n-attr]').forEach((el) => {
  el.dataset.i18nAttr.split(',').forEach((pair) => { const [attr, key] = pair.split(':'); el.setAttribute(attr.trim(), t(key.trim())); });
});
document.querySelectorAll('[data-lang-only]').forEach((el) => { if (el.dataset.langOnly !== LANG) el.remove(); });
// dane sprzedawcy (Impressum, AGB, Widerruf)
document.querySelectorAll('[data-seller]').forEach((el) => { el.textContent = SELLER[el.dataset.seller] || ''; });
document.querySelectorAll('[data-seller-mail]').forEach((a) => { a.textContent = SELLER.email; a.href = 'mailto:' + SELLER.email; });
if (location.hash && document.querySelector('.legal')) setTimeout(() => document.querySelector(location.hash)?.scrollIntoView(), 50);
document.querySelectorAll('[data-lang]').forEach((b) => {
  b.classList.toggle('is-active', b.dataset.lang === SITE_LANG);
  b.setAttribute('aria-pressed', b.dataset.lang === SITE_LANG);
  b.addEventListener('click', () => { if (b.dataset.lang !== SITE_LANG) setLang(b.dataset.lang); });
});
if (document.body.dataset.titleKey) document.title = t(document.body.dataset.titleKey);
document.querySelector('meta[name=description]')?.setAttribute('content', T.meta_desc);

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
  gsap.ticker.add((tm) => lenis.raf(tm * 1000));
  gsap.ticker.lagSmoothing(0);
}
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href*="#"]');
  if (!a) return;
  const href = a.getAttribute('href'), hash = href.slice(href.indexOf('#'));
  const samePage = href.startsWith('#') || new URL(a.href).pathname === location.pathname;
  if (!samePage || hash.length < 2) return;
  const el = document.querySelector(hash);
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

// ---------- animacje tekstu ----------
document.querySelectorAll('[data-split]').forEach((el) => {
  const parts = el.innerHTML.split(/<br\s*\/?>/i);
  el.innerHTML = parts.map((p) => `<span class="split-line"><span>${p.trim()}</span></span>`).join('');
  if (reduced || el.closest('.hero')) return;
  gsap.from(el.querySelectorAll('.split-line > span'), { yPercent: 110, rotate: 2, duration: 1.3, stagger: 0.09, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 85%' } });
});
gsap.utils.toArray('[data-reveal]').forEach((el) => {
  if (reduced) return;
  gsap.to(el, { opacity: 1, y: 0, duration: 1.2, ease: 'expo.out', delay: parseFloat(el.dataset.reveal) || 0, scrollTrigger: { trigger: el, start: 'top 88%' } });
});

initCart();

if (document.querySelector('.hero')) import('/js/hero.js?v=19').then((m) => m.initHero(reduced));

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

// ---------- FAQ ----------
const faqList = document.querySelector('.faq__list');
if (faqList) {
  faqList.innerHTML = FAQ.map(([q, a]) => `<details class="faq-item"><summary>${q}<span class="plus" aria-hidden="true"></span></summary><div class="faq-item__body"><p>${a}</p></div></details>`).join('');
  faqList.querySelectorAll('details').forEach((d) => {
    const body = d.querySelector('.faq-item__body');
    d.querySelector('summary').addEventListener('click', (e) => {
      e.preventDefault();
      if (d.open) gsap.to(body, { height: 0, duration: 0.5, ease: 'expo.out', onComplete: () => { d.open = false; body.style.height = ''; } });
      else { d.open = true; gsap.fromTo(body, { height: 0 }, { height: 'auto', duration: 0.7, ease: 'expo.out' }); }
    });
  });
  const ld = document.createElement('script');
  ld.type = 'application/ld+json';
  ld.textContent = JSON.stringify({ '@context': 'https://schema.org', '@type': 'FAQPage', inLanguage: LANG, mainEntity: FAQ.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) });
  document.head.appendChild(ld);
}

// ---------- formularze ----------
document.querySelector('.form')?.addEventListener('submit', (e) => {
  e.preventDefault();
  const f = e.target, note = f.querySelector('.form__note');
  const body = `${T.f_name}: ${f.name.value}\n${T.f_email}: ${f.email.value}\n\n${f.message.value}`;
  location.href = `mailto:${f.dataset.to}?subject=${encodeURIComponent(T.f_subject)}&body=${encodeURIComponent(body)}`;
  note.textContent = T.f_note;
});
document.querySelector('.newsletter')?.addEventListener('submit', (e) => {
  e.preventDefault();
  e.target.innerHTML = `<p style="margin:0;color:var(--gold)">${T.nl_done}</p>`;
});

// ---------- odliczanie do ostatniego dnia zamówień przed świętami ----------
document.querySelectorAll('[data-deadline]').forEach((el) => {
  const end = new Date(SHOP.christmasCutoff).getTime();
  const tick = () => {
    const ms = end - Date.now();
    if (ms <= 0) { el.closest('.deadline')?.remove(); return; }
    const d = Math.floor(ms / 864e5), h = Math.floor((ms % 864e5) / 36e5), m = Math.floor((ms % 36e5) / 6e4);
    el.textContent = `${d} ${T.dl_d} ${String(h).padStart(2, '0')} ${T.dl_h} ${String(m).padStart(2, '0')} ${T.dl_m}`;
  };
  tick(); setInterval(tick, 30000);
});

// ---------- strona produktu ----------
document.querySelectorAll('.pdp').forEach((pdp) => {
  const main = pdp.querySelector('.pdp__main-media');
  pdp.querySelectorAll('.pdp__thumbs button').forEach((b) => b.addEventListener('click', () => {
    pdp.querySelectorAll('.pdp__thumbs button').forEach((x) => x.classList.remove('is-active'));
    b.classList.add('is-active');
    gsap.to(main, { opacity: 0, duration: 0.2, onComplete: () => { main.src = b.dataset.src; main.alt = b.getAttribute('aria-label'); gsap.to(main, { opacity: 1, duration: 0.35 }); } });
  }));
  const qtyEl = pdp.querySelector('.pdp__buy .qty span');
  pdp.querySelector('[data-q="-"]')?.addEventListener('click', () => { qtyEl.textContent = Math.max(1, +qtyEl.textContent - 1); });
  pdp.querySelector('[data-q="+"]')?.addEventListener('click', () => { qtyEl.textContent = Math.min(20, +qtyEl.textContent + 1); });
});

// ---------- ceny (najpierw z data.js, potem z Shopify) ----------
function applyProducts() {
  document.querySelectorAll('[data-price]').forEach((el) => { el.textContent = money(PRODUCTS[el.dataset.price].price); });
  document.querySelectorAll('[data-price-tpl]').forEach((el) => { el.innerHTML = t(el.dataset.priceTpl, { price: money(PRODUCTS['mug-1'].price) }); });
  document.querySelectorAll('[data-name]').forEach((el) => { (el.querySelector('a') || el).textContent = PRODUCTS[el.dataset.name].name; });
  document.querySelectorAll('[data-add]').forEach((b) => {
    if (PRODUCTS[b.dataset.add]?.soldOut) { b.disabled = true; b.textContent = T.sold_out; }
  });
}
applyProducts();
syncProducts().then((ok) => { if (ok) applyProducts(); });

const sticky = document.querySelector('.sticky-buy');
if (sticky) {
  const firstBuy = document.querySelector('.pdp__buy');
  const footer = document.querySelector('.footer');
  let pastBuy = false, atFooter = false;
  const upd = () => sticky.classList.toggle('show', pastBuy && !atFooter);
  const mobile = matchMedia('(max-width: 760px)');
  new IntersectionObserver(([e]) => { pastBuy = !e.isIntersecting && (mobile.matches || e.boundingClientRect.top < 0); upd(); }).observe(firstBuy);
  new IntersectionObserver(([e]) => { atFooter = e.isIntersecting; upd(); }).observe(footer);
}

addEventListener('load', () => ScrollTrigger.refresh());
