// Strona produktu — wersja międzynarodowa: eu/product.html?id=mug-1
import { PRODUCTS, SHOP } from './data.js';
import { syncProductsQuick } from './shopify.js';
import { T, t, money, LOCALE } from './i18n.js';
import { track } from './tracking.js';
import { hit } from './stats.js';

await syncProductsQuick();

const IMG = (key, n) => `assets/products/winter-dips-${key}-${n}.webp`;
const SWATCH = { 'mug-1': '#efe3cc', 'mug-2': '#c8102e' };
const STEPS = [IMG('czerwony', 'krok-1'), IMG('czerwony', 'krok-2'), IMG('czerwony', 'krok-3')];

const qid = new URLSearchParams(location.search).get('id');
const id = PRODUCTS[qid] ? qid : 'mug-1';
const p = PRODUCTS[id];
const otherId = id === 'mug-1' ? 'mug-2' : 'mug-1';
const other = PRODUCTS[otherId];
document.title = `${p.name} — Winter Dip`;
hit('view', 'eu-' + id);
track('ViewContent', { content_ids: [id], content_name: p.name, content_type: 'product', value: p.price });

const shots = ['01-katalog', '02-fondue', '03-maczanie', '04-z-gory', '05-detal-uchwytu', '06-zimowy-wieczor'];
const deliveryBy = new Date(Date.now() + SHOP.deliveryMaxDays * 864e5).toLocaleDateString(LOCALE, { weekday: 'short', day: 'numeric', month: 'long' });
const price = money(p.price);

document.getElementById('product-root').innerHTML = `
  <section class="pdp pdp--single" id="${id}">
    <div class="container pdp__grid">
      <div class="pdp__gallery">
        <div class="pdp__main pdp__main--photo"><img class="pdp__main-media" src="${IMG(p.key, '01-katalog')}" alt="${p.name} — ${T.alts[0]}" width="1200" height="1200"></div>
        <div class="pdp__thumbs pdp__thumbs--photo">
          ${shots.map((n, i) => `<button${i ? '' : ' class="is-active"'} data-src="${IMG(p.key, n)}" aria-label="${T.alts[i]}"><img src="${IMG(p.key, n)}" alt=""></button>`).join('')}
        </div>
      </div>
      <div class="pdp__info">
        <span class="eyebrow">${T.p_eyebrow}</span>
        <h1 class="pdp__title">${p.name}</h1>
        <div class="pdp__price"><span class="now" data-price="${id}">${price}</span></div>
        <div class="swatches">
          <span class="swatches__label">${T.colour}: <b>${T.colours[id]}</b></span>
          <div class="swatches__row">
            ${['mug-1', 'mug-2'].map((k) => `<a href="eu/product.html?id=${k}" class="swatch${k === id ? ' is-active' : ''}" style="--c:${SWATCH[k]}" aria-label="${T.colours[k]}"${k === id ? ' aria-current="true"' : ''}></a>`).join('')}
          </div>
        </div>
        <div class="pdp__buy">
          <div class="qty"><button data-q="-" aria-label="${T.qty_less}">−</button><span id="qty-main">1</span><button data-q="+" aria-label="${T.qty_more}">+</button></div>
          <button class="btn btn--primary" data-add="${id}" data-qty-from="#qty-main" data-open-cart>${T.add}<span class="btn-price"> · <span data-price="${id}">${price}</span></span></button>
        </div>
        <div class="free-ship"><span class="free-ship__ic">🚚</span><div><b>${t('fs_title', { date: deliveryBy })}</b><span>${t('fs_text', { price: `<span data-price="${id}">${price}</span>` })}</span></div></div>
        <div class="pay-row" aria-label="${T.pay_aria}"><span>Visa</span><span>Mastercard</span><span>Apple Pay</span><span>Google Pay</span><span>Klarna</span></div>
        <p class="stock-note"><span class="live-dot"></span>${t('stock_note')}</p>
        <p class="lead" style="margin:0">${T.leads[id]}</p>
        <ul class="pdp__bullets">${T.bullets[id].map((b) => `<li>${b}</li>`).join('')}</ul>
        <div class="bundle-tip">
          <div><b>${T.bundle_t}</b><span>${T.bundle_d}</span></div>
          <button class="bundle-tip__btn" data-add="${otherId}" data-open-cart>+ ${other.name}</button>
        </div>
        <div class="trust-row">
          <div><b>${T.tr_ship}</b>${T.tr_ship_v}</div>
          <div><b>${T.tr_ret}</b>${T.tr_ret_v}</div>
          <div><b>${T.tr_track}</b>${T.tr_track_v}</div>
        </div>
        <div class="acc">
          <details><summary>${T.acc_care_t}</summary><p>${T.acc_care}</p></details>
          <details><summary>${T.acc_ship_t}</summary><p>${t('acc_ship')}</p></details>
        </div>
      </div>
    </div>
  </section>

  <section class="section pd-steps">
    <div class="container">
      <div class="section__head"><div><span class="eyebrow">${T.steps_eyebrow}</span><h2 class="display h2" data-split>${T.steps_title}</h2></div></div>
      <div class="pd-steps__grid">
        <article class="pd-step" data-reveal><img src="${STEPS[0]}" alt="${T.s1_alt}" loading="lazy"><span>01</span><h3>${T.s1_t}</h3><p>${T.s1_d}</p></article>
        <article class="pd-step" data-reveal=".1"><img src="${STEPS[1]}" alt="${T.s2_alt}" loading="lazy"><span>02</span><h3>${T.s2_t}</h3><p>${T.s2_d}</p></article>
        <article class="pd-step" data-reveal=".2"><img src="${STEPS[2]}" alt="${T.s3_alt}" loading="lazy"><span>03</span><h3>${T.s3_t}</h3><p>${T.s3_d}</p></article>
      </div>
    </div>
  </section>

  <section class="section pd-occ">
    <div class="container">
      <div class="section__head"><div><span class="eyebrow">${T.occ_eyebrow}</span><h2 class="display h2" data-split>${T.occ_title}</h2></div></div>
      <div class="pd-occ__grid">
        ${T.occ.map(([ti, d], i) => `<article class="pd-occ__card" data-reveal="${(i * 0.08).toFixed(2)}"><span>${String(i + 1).padStart(2, '0')}</span><h3>${ti}</h3><p>${d}</p></article>`).join('')}
      </div>
      <div class="pd-dips" data-reveal>
        <h3>${T.dips_t}</h3>
        <ul class="pd-dips__list">${T.dips.map((d) => `<li>${d}</li>`).join('')}</ul>
      </div>
    </div>
  </section>

  <section class="section pd-box">
    <div class="container pd-box__grid">
      <div>
        <span class="eyebrow">${T.box_eyebrow}</span>
        <h2 class="display h2" data-split style="margin-top:20px">${T.box_title}</h2>
      </div>
      <ul class="pd-box__list" data-reveal>
        <li><b>${T.box_mug}</b><span>${t('box_mug_v', { colour: T.colours[id] })}</span></li>
        <li><b>${T.box_fork}</b><span>${T.box_fork_v}</span></li>
        <li><b>${T.box_size}</b><span>${T.box_size_v}</span></li>
        <li><b>${T.box_tl}</b><span>${T.box_tl_v}</span></li>
      </ul>
    </div>
  </section>

  <section class="section pd-other">
    <div class="container pd-other__grid">
      <a class="pd-other__img" href="eu/product.html?id=${otherId}"><img src="${IMG(other.key, '01-katalog')}" alt="${other.name}" loading="lazy"></a>
      <div>
        <span class="eyebrow">${T.other_eyebrow}</span>
        <h2 class="display h2" style="margin:20px 0 18px">${other.name}</h2>
        <p class="lead">${T.leads[otherId]}</p>
        <div class="pp-both__btns"><a class="btn btn--ghost" href="eu/product.html?id=${otherId}">${T.view}</a><button class="btn btn--primary" data-add="${otherId}" data-open-cart>${T.add} · <span data-price="${otherId}">${money(other.price)}</span></button></div>
      </div>
    </div>
  </section>
`;

const sticky = document.querySelector('.sticky-buy');
if (sticky) sticky.innerHTML = `<img src="${p.img}" alt=""><div class="sticky-buy__info"><b>${p.name}</b><span data-price="${id}">${price}</span> · ${T.sticky_ship}</div><button class="btn btn--primary" data-add="${id}" data-open-cart>${T.add}</button>`;

await import('./main.js');
