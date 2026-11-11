// =========================================================
// Strona pojedynczego produktu: produkt.html?id=mug-1
// Treść każdego kubka jest w INFO poniżej. Strona renderuje się
// sama, a potem ładuje main.js (koszyk, galerie, animacje).
// =========================================================
import { PRODUCTS, REVIEWS, SHOP } from './data.js';
import { syncProductsQuick } from './shopify.js';

await syncProductsQuick();

const IMG = (key, n) => `assets/products/winter-dips-${key}-${n}.webp`;

const INFO = {
  'mug-1': {
    key: 'bezowy', color: 'Beżowy', swatch: '#efe3cc',
    // zdjęcia do „Jak to działa” (na razie te same co przy czerwonym; TODO: beżowe wersje kroków)
    steps: [IMG('czerwony', 'krok-1'), IMG('czerwony', 'krok-2'), IMG('czerwony', 'krok-3')],
    lead: 'Kremowa ceramika z czekoladowym wnętrzem. Podgrzewacz w podstawie trzyma czekoladę płynną przez cały wieczór, a widelczyk ma swoje miejsce przy uchu kubka.',
    bullets: ['Ceramika w kremowym beżu z brązowym wnętrzem', 'Otwór na podgrzewacz — czekolada płynna przez cały wieczór', 'Widelczyk do fondue w komplecie', 'Eleganckie pudełko — gotowe pod choinkę'],
  },
  'mug-2': {
    key: 'czerwony', color: 'Czerwony', swatch: '#c8102e',
    steps: [IMG('czerwony', 'krok-1'), IMG('czerwony', 'krok-2'), IMG('czerwony', 'krok-3')],
    lead: 'Głęboka, świąteczna czerwień i jasne wnętrze. Świeczka pod spodem, płynna czekolada na górze i widelczyk zawsze pod ręką.',
    bullets: ['Ceramika w świątecznej czerwieni z jasnym wnętrzem', 'Otwór na podgrzewacz — czekolada płynna przez cały wieczór', 'Widelczyk do fondue w komplecie', 'Eleganckie pudełko — gotowe pod choinkę'],
  },
};

const OCCASIONS = [
  ['Randka w domu', 'Dwa kubki, przygaszone światło i truskawki w czekoladzie. Wieczór, który pamięta się dłużej niż kolacja na mieście.'],
  ['Wieczór z filmem', 'Koc, ulubiony serial i ciepła czekolada pod ręką. Bez gotowania i bez zmywania garnków.'],
  ['Prezent pod choinkę', 'Kubek przychodzi w eleganckim pudełku. Wystarczy dołożyć tabliczkę czekolady i gotowe.'],
  ['Spotkanie ze znajomymi', 'Każdy ma swój kubek i swoją porcję. Mini fondue dla jednej osoby, bez wspólnego garnka.'],
];
const DIPS = ['Truskawki', 'Banany', 'Pierniki', 'Ciastka', 'Pianki', 'Precelki', 'Mandarynki', 'Biszkopty', 'Ananas', 'Gofry'];

const id = INFO[new URLSearchParams(location.search).get('id')] ? new URLSearchParams(location.search).get('id') : 'mug-1';
const p = PRODUCTS[id], info = INFO[id];
const otherId = id === 'mug-1' ? 'mug-2' : 'mug-1';
const other = PRODUCTS[otherId], otherInfo = INFO[otherId];
document.title = `${p.name} — Winterdip`;

const shots = [['01-katalog', 'Kubek z przodu'], ['02-fondue', 'Kubek z czekoladą i świeczką'], ['03-maczanie', 'Maczanie truskawki w czekoladzie']];
const stars = (n) => '★'.repeat(n) + '☆'.repeat(5 - n);

document.getElementById('product-root').innerHTML = `
  <nav class="crumbs container" aria-label="Okruszki"><a href="index.html">Start</a><span>/</span><a href="produkty.html">Produkty</a><span>/</span><b>${p.name}</b></nav>

  <section class="pdp pdp--single" id="${id}">
    <div class="container pdp__grid">
      <div class="pdp__gallery">
        <div class="pdp__main pdp__main--photo"><img class="pdp__main-media" src="${IMG(info.key, '01-katalog')}" alt="${p.name} — kubek z przodu" width="1200" height="1200"></div>
        <div class="pdp__thumbs pdp__thumbs--photo">
          ${shots.map(([n, alt], i) => `<button${i ? '' : ' class="is-active"'} data-src="${IMG(info.key, n)}" aria-label="${alt}"><img src="${IMG(info.key, n)}" alt=""></button>`).join('')}
        </div>
      </div>
      <div class="pdp__info">
        <span class="eyebrow">Kubek do fondue Chocolat…</span>
        <h1 class="pdp__title">${p.name}</h1>
        <div class="pdp__price">
          <span class="now" data-price="${id}">75 zł</span>
          <span class="old" data-old-price="${id}" data-sale-only>99 zł</span>
          <span class="save" data-sale-only data-discount="${id}">−24%</span>
        </div>
        ${p.oldPrice > p.price ? `<p class="pdp__omnibus" data-sale-only>Najniższa cena z 30 dni przed obniżką: ${p.lowest30 || p.oldPrice} zł · cena z VAT</p>` : ''}
        <div class="sale-box" data-sale-only>
          <div class="sale-box__head"><span class="sale-box__tag">Wyprzedaż</span><span>Promocja kończy się za</span></div>
          <div class="sale-box__timer" data-sale-countdown data-format="boxes"></div>
        </div>
        ${!p.soldOut && p.stock > 0 && p.stock <= 10 ? `<div class="stock-alert" style="--left:${Math.max(8, p.stock * 10)}%">
          <p><b>Ostatnie sztuki!</b> Zostało tylko <b>${p.stock}</b> ${p.stock === 1 ? 'sztuka' : p.stock < 5 ? 'sztuki' : 'sztuk'}.</p>
          <div class="stock-alert__bar"><span></span></div>
        </div>` : ''}
        <p class="lead" style="margin:0">${info.lead}</p>
        <div class="swatches">
          <span class="swatches__label">Kolor: <b>${info.color}</b></span>
          <div class="swatches__row">
            ${['mug-1', 'mug-2'].map((k) => `<a href="produkt.html?id=${k}" class="swatch${k === id ? ' is-active' : ''}" style="--c:${INFO[k].swatch}" aria-label="${INFO[k].color}"${k === id ? ' aria-current="true"' : ''}></a>`).join('')}
          </div>
        </div>
        <ul class="pdp__bullets">${info.bullets.map((b) => `<li>${b}</li>`).join('')}</ul>
        <div class="pdp__buy">
          <div class="qty"><button data-q="-" aria-label="Mniej">−</button><span id="qty-main">1</span><button data-q="+" aria-label="Więcej">+</button></div>
          <button class="btn btn--primary" data-add="${id}" data-qty-from="#qty-main" data-open-cart>Dodaj do koszyka · <span data-price="${id}">75 zł</span></button>
        </div>
        <p class="stock-note"><span class="live-dot"></span>Dostawa ok. 10–14 dni · zamów do 8 grudnia, zdążymy przed Wigilią</p>
        <div class="bundle-tip">
          <div><b>Kup 2 kubki — dostawa gratis</b><span>2 × ${p.price} zł = ${p.price * 2} zł, czyli powyżej progu ${SHOP.freeShippingFrom} zł.</span></div>
          <button class="bundle-tip__btn" data-add="${otherId}" data-open-cart>+ ${other.name}</button>
        </div>
        <div class="trust-row">
          <div><b>Dostawa</b>Darmowa od 149 zł</div>
          <div><b>Zwrot</b>30 dni bez pytań</div>
          <div><b>Prezent</b>Pudełko + bilecik</div>
        </div>
        <div class="acc">
          <details><summary>Wymiary i pielęgnacja</summary><p>Kubek mieści porcję czekoladowego fondue dla jednej osoby. Ceramikę możesz myć w zmywarce, ale polecamy mycie ręczne, żeby szkliwo i napis zostały piękne na lata. Widelczyk myj ręcznie.</p></details>
          <details><summary>Dostawa i zwroty</summary><p>Kubek wysyłamy z magazynu naszego partnera — paczka jest u Ciebie zwykle w 10–14 dni, a numer do śledzenia dostajesz mailem. Darmowa dostawa od 149 zł. 30 dni na zwrot — na prezenty świąteczne do 31 stycznia.</p></details>
        </div>
      </div>
    </div>
  </section>

  <section class="section pd-steps">
    <div class="container">
      <div class="section__head"><div><span class="eyebrow">Jak to działa</span><h2 class="display h2" data-split>Trzy kroki<br>do fondue</h2></div></div>
      <div class="pd-steps__grid">
        <article class="pd-step" data-reveal><img src="${info.steps[0]}" alt="Kostki czekolady wkładane do kubka" loading="lazy"><span>01</span><h3>Wrzuć kostki czekolady</h3><p>Włóż do kubka kilka kostek ulubionej czekolady. Nie musisz niczego wcześniej roztapiać.</p></article>
        <article class="pd-step" data-reveal=".1"><img src="${info.steps[1]}" alt="Podgrzewacz wsuwany do otworu w kubku" loading="lazy"><span>02</span><h3>Zapal podgrzewacz</h3><p>Wsuń tealight do otworu w podstawie i zapal. Czekolada sama się roztopi i zostanie płynna przez cały wieczór.</p></article>
        <article class="pd-step" data-reveal=".2"><img src="${info.steps[2]}" alt="Truskawka maczana w roztopionej czekoladzie" loading="lazy"><span>03</span><h3>Maczaj i delektuj się</h3><p>Nabij owoc na widelczyk i zanurz w czekoladzie. Widelczyk odkładasz na uchu kubka.</p></article>
      </div>
    </div>
  </section>

  <section class="section pd-occ">
    <div class="container">
      <div class="section__head"><div><span class="eyebrow">Zastosowania</span><h2 class="display h2" data-split>Na każdy<br>zimowy wieczór</h2></div></div>
      <div class="pd-occ__grid">
        ${OCCASIONS.map(([t, d], i) => `<article class="pd-occ__card" data-reveal="${(i * 0.08).toFixed(2)}"><span>${String(i + 1).padStart(2, '0')}</span><h3>${t}</h3><p>${d}</p></article>`).join('')}
      </div>
      <div class="pd-dips" data-reveal>
        <h3>Co maczać?</h3>
        <ul class="pd-dips__list">${DIPS.map((d) => `<li>${d}</li>`).join('')}</ul>
      </div>
    </div>
  </section>

  <section class="section pd-box">
    <div class="container pd-box__grid">
      <div>
        <span class="eyebrow">W pudełku</span>
        <h2 class="display h2" data-split style="margin-top:20px">Wszystko,<br>czego trzeba</h2>
      </div>
      <ul class="pd-box__list" data-reveal>
        <li><b>Kubek Chocolat…</b><span>ceramika, kolor ${info.color.toLowerCase()}</span></li>
        <li><b>Widelczyk do fondue</b><span>stal nierdzewna z uchwytem</span></li>
        <li><b>Podgrzewacz</b><span>zwykły tealight, na start</span></li>
        <li><b>Pudełko prezentowe</b><span>gotowe pod choinkę</span></li>
      </ul>
    </div>
  </section>

  <section class="section pd-reviews">
    <div class="container">
      <div class="section__head"><div><span class="eyebrow">Opinie</span><h2 class="display h2" data-split>Co mówią<br>klienci</h2></div></div>
      <div class="pd-reviews__grid">
        ${REVIEWS.slice(0, 3).map((r) => `<article class="r-card" data-reveal><span class="stars">${stars(r.stars)}</span><p>„${r.text}”</p><footer><span class="avatar">${r.name[0]}</span><div><b>${r.name}</b> · ${r.city}</div></footer></article>`).join('')}
      </div>
    </div>
  </section>

  <section class="section pd-other">
    <div class="container pd-other__grid">
      <a class="pd-other__img" href="produkt.html?id=${otherId}"><img src="${IMG(otherInfo.key, '01-katalog')}" alt="${other.name}" loading="lazy"></a>
      <div>
        <span class="eyebrow">Druga wersja</span>
        <h2 class="display h2" style="margin:20px 0 18px">${other.name}</h2>
        <p class="lead">${otherInfo.lead}</p>
        <div class="pp-both__btns"><a class="btn btn--ghost" href="produkt.html?id=${otherId}">Zobacz produkt</a><button class="btn btn--primary" data-add="${otherId}" data-open-cart>Do koszyka · ${other.price} zł</button></div>
      </div>
    </div>
  </section>
`;

const sticky = document.querySelector('.sticky-buy');
if (sticky) sticky.innerHTML = `<img src="${p.img}" alt=""><div class="sticky-buy__info"><b>${p.name}</b><span data-price="${id}">75 zł</span> · darmowa dostawa od 149 zł</div><button class="btn btn--primary" data-add="${id}" data-open-cart>Do koszyka</button>`;

await import('./main.js');
