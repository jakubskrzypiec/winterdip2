// =========================================================
// Wersja międzynarodowa (Niemcy + Austria): język strony.
//   en — domyślny (angielski)
//   de — niemiecki (Niemcy)
//   at — niemiecki (Austria): te same teksty co de, rynek Shopify = AT
// Wybór: ?lang=en|de|at w adresie (zapamiętywany) → zapamiętany wybór → język przeglądarki → en.
// =========================================================
const KEY = 'winterdip-lang';
const VALID = ['en', 'de', 'at'];

function detect() {
  const q = new URLSearchParams(location.search).get('lang');
  if (VALID.includes(q)) { try { localStorage.setItem(KEY, q); } catch {} return q; }
  try { const s = localStorage.getItem(KEY); if (VALID.includes(s)) return s; } catch {}
  return 'en';
}

export const SITE_LANG = detect();                         // en | de | at
export const LANG = SITE_LANG === 'en' ? 'en' : 'de';      // język tekstów
export const COUNTRY = SITE_LANG === 'at' ? 'AT'
  : SITE_LANG === 'de' ? 'DE'
  : (() => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone === 'Europe/Vienna' ? 'AT' : 'DE'; } catch { return 'DE'; } })();
export const LOCALE = { en: 'en-GB', de: 'de-DE', at: 'de-AT' }[SITE_LANG];

export function setLang(l) {
  try { localStorage.setItem(KEY, l); } catch {}
  const u = new URL(location.href); u.searchParams.set('lang', l); location.href = u.toString();
}

// Cena: EN „€16.99”, DE „16,99 €”
export const money = (n) => LANG === 'en' ? '€' + n.toFixed(2) : n.toFixed(2).replace('.', ',') + ' €';

const DELIVERY = { en: '7–12 days', de: '7–12 Tagen' };

const STR = {
  en: {
    title: 'Winter Dip — chocolate fondue mug',
    meta_desc: 'Ceramic chocolate fondue mug with tea light opening and fork. Free shipping to Germany and Austria, delivered in 7–12 days.',
    announce: '🚚 <strong>Free shipping</strong> to Germany & Austria<span class="announce__long"> · order by 5 December for Christmas delivery</span>',
    nav_home: 'Home', nav_shop: 'Shop', buy_now: 'Buy now', cart_aria: 'Open cart', menu: 'Menu', home_aria: 'Winter Dip — home',
    hero_l1: 'Winter fondue', hero_l2: 'in a single mug',
    hero_buy: 'Buy now', hero_see: 'See the mugs', hero_ship: '<span>🚚</span> <b>Free shipping</b> · {price} is the final price', scroll: 'Scroll',
    col_eyebrow: 'Collection', col_title: 'Choose your<br><em>winter ritual</em>',
    col_lead: 'One mug for a quiet evening with a good book, or two for a cosy date night at home. A gift that makes the evening — perfect under the tree.',
    card_desc: 'Ceramic fondue mug with tea light opening',
    free_ship: '🚚 Free shipping', view: 'View product', add: 'Add to cart',
    delivery_note: '<b>🚚 Free shipping on every order</b> · delivery in {days} · order by 5 December for Christmas',
    gal_eyebrow: 'Gallery', gal_title: 'Up close',
    contact_title: 'Let’s talk<br><em>over hot chocolate</em>',
    f_name: 'Name', f_email: 'Email', f_msg: 'Message', f_send: 'Send message', f_note: 'Opening your email app — thank you for your message!', f_subject: 'Message from the Winter Dip website',
    nl_text: 'Winter fondue recipes and early access to new collections.', nl_ph: 'Your email', nl_btn: 'Subscribe', nl_done: 'Thank you! We’ll be in touch with winter news.',
    ft_shop: 'Shop', ft_help: 'Help', ft_contact: 'Contact', ft_all: 'All products',
    ft_faq: 'FAQ', ft_ship: 'Shipping & returns', ft_terms: 'Terms & conditions', ft_privacy: 'Privacy policy', ft_withdraw: 'Right of withdrawal', ft_imprint: 'Imprint', ft_cookies: 'Cookie settings',
    copyright: '© 2026 Winter Dip. All rights reserved.',
    shop_eyebrow: 'Winter Dip shop', shop_title: 'A gift that<br><em>warms the heart</em>', shop_deadline: '⏳ Order for Christmas delivery within: <b data-deadline>…</b>',
    dl_d: 'd', dl_h: 'h', dl_m: 'min',
    // koszyk
    cart: 'Cart', cart_title: 'Your cart', close: 'Close', total: 'Total', checkout: 'Checkout',
    trust_pay: '🔒 Secure payment', trust_ret: '↩ 30-day returns', trust_track: '📦 Tracking number',
    ship_bar: '🚚 <b>Free shipping</b> — no extra costs at checkout', empty: 'Your cart is empty.', see_mugs: 'See the mugs',
    less: 'Less', more: 'More', remove: 'Remove', added: 'Added: {name}',
    drawer_ship: 'Shipping: <b>free</b> · delivery in {days} · final price',
    err_sold: 'One item has just sold out. Please remove it from your cart.', err_load: 'The checkout isn’t ready yet. Please try again in a moment.', err_open: 'The checkout couldn’t be opened. Please try again in a moment.',
    sold_out: 'Sold out',
    // produkt
    p_eyebrow: 'Chocolat… fondue mug', colour: 'Colour', qty_less: 'Less', qty_more: 'More',
    fs_title: 'Free shipping · arrives by {date}', fs_text: 'You pay {price} and nothing more — no extra costs at checkout.',
    pay_aria: 'Payment methods',
    stock_note: 'Delivery in {days} · order by 5 December for Christmas',
    bundle_t: 'Get a second one as a gift', bundle_d: 'The other colour for someone you love — shipping is free too.',
    tr_ship: 'Shipping', tr_ship_v: 'Always free', tr_ret: 'Returns', tr_ret_v: '30 days, no questions asked', tr_track: 'Tracking', tr_track_v: 'Tracking number by email',
    acc_care_t: 'Size & care', acc_care: 'The mug holds a single portion of chocolate fondue. The ceramic is dishwasher-safe, but we recommend washing by hand so the glaze and lettering stay beautiful for years. Please wash the fork by hand.',
    acc_ship_t: 'Shipping & returns', acc_ship: 'We ship from our partner’s warehouse — your parcel arrives in {days}, and you’ll receive a tracking number by email. Shipping is always free. You have a 14-day statutory right of withdrawal, which we voluntarily extend to 30 days.',
    steps_eyebrow: 'How it works', steps_title: 'Three steps<br>to fondue',
    s1_t: 'Add chocolate pieces', s1_d: 'Put a few pieces of your favourite chocolate into the mug. No need to melt anything beforehand.',
    s2_t: 'Light the tea light', s2_d: 'Slide a tea light into the opening in the base and light it. The chocolate melts on its own and stays smooth all evening.',
    s3_t: 'Dip and enjoy', s3_d: 'Spear a piece of fruit on the fork and dip it into the chocolate. The fork rests on the handle between bites.',
    s1_alt: 'Chocolate pieces going into the mug', s2_alt: 'Tea light sliding into the mug', s3_alt: 'Strawberry dipped in melted chocolate',
    occ_eyebrow: 'Occasions', occ_title: 'For every<br>winter evening',
    occ: [['Date night at home', 'Two mugs, dimmed lights and chocolate-dipped strawberries. An evening you’ll remember longer than dinner out.'], ['Movie night', 'A blanket, your favourite series and warm chocolate within reach. No cooking, no pots to wash.'], ['A Christmas gift', 'The mug with a bar of their favourite chocolate makes a ready-to-give Christmas present.'], ['Evening with friends', 'Everyone gets their own mug and their own portion. Mini fondue for one — no shared pot.']],
    dips_t: 'What to dip?', dips: ['Strawberries', 'Bananas', 'Gingerbread', 'Biscuits', 'Marshmallows', 'Pretzels', 'Clementines', 'Sponge fingers', 'Pineapple', 'Waffles'],
    box_eyebrow: 'In the box', box_title: 'Everything<br>you need',
    box_mug: 'Chocolat… mug', box_mug_v: 'ceramic, colour: {colour}', box_fork: 'Fondue fork', box_fork_v: 'stainless steel', box_size: 'Size', box_size_v: 'approx. 13 × 10 × 12 cm, one portion', box_tl: 'Tea light', box_tl_v: 'any standard tea light fits (not included)',
    other_eyebrow: 'Also available', sticky_ship: '🚚 free shipping',
    colours: { 'mug-1': 'Beige', 'mug-2': 'Red' },
    names: { 'mug-1': 'Fondue Mug — Beige', 'mug-2': 'Fondue Mug — Red' },
    leads: {
      'mug-1': 'Creamy ceramic with a chocolate-brown interior. The tea light in the base keeps the chocolate melted all evening, and the fork has its own place on the handle.',
      'mug-2': 'Deep festive red with a light interior. A tea light underneath, melted chocolate on top and the fork always within reach.',
    },
    bullets: {
      'mug-1': ['Creamy beige ceramic with a brown interior', 'Tea light opening — chocolate stays melted all evening', 'Fondue fork included', 'A lovely Christmas gift idea'],
      'mug-2': ['Festive red ceramic with a light interior', 'Tea light opening — chocolate stays melted all evening', 'Fondue fork included', 'A lovely Christmas gift idea'],
    },
    alts: ['Mug from the front', 'Mug with chocolate and tea light', 'Dipping a strawberry into chocolate', 'Mug from above with fork and chocolate', 'Fork resting in the handle', 'Mug on a winter evening with snacks'],
    faq: [
      ['How does the fondue mug work?', 'Place a standard tea light in the opening in the base. The small flame keeps the chocolate smooth and warm all evening. When you’re not using the fork, simply rest it on the handle.'],
      ['When will my order arrive?', 'Delivery usually takes 7–12 days. You’ll receive a tracking number by email. Orders placed by 5 December arrive in time for Christmas.'],
      ['Is shipping free?', 'Yes — shipping to Germany and Austria is always free, even for a single mug. The price on the website is the final price.'],
      ['How can I pay?', 'By credit card (Visa, Mastercard), Apple Pay, Google Pay or Klarna. Payment is handled by the secure Shopify checkout.'],
      ['Is the mug dishwasher-safe?', 'The ceramic can go in the dishwasher, but we recommend washing by hand so the glaze and lettering stay beautiful. Please wash the fork by hand.'],
      ['Which chocolate works best?', 'Dark or milk chocolate in pieces works best, ideally with a splash of cream. Use cheese instead and you have a mini cheese fondue.'],
      ['Can I return the mug?', 'Yes. You have a 14-day statutory right of withdrawal from receipt of the goods — we voluntarily extend it to 30 days. Just send us an email.'],
      ['Is the mug a good gift?', 'Absolutely — it’s one of the most popular gifts for St Nicholas’ Day and Christmas. At checkout you can enter the recipient’s address directly.'],
    ],
    consent: '<b>Cookies</b>We use cookies to make the shop work and — with your consent — to measure how well our ads perform (Meta). You can change this at any time under “Cookie settings” in the footer.',
    consent_no: 'Necessary only', consent_yes: 'Accept', consent_aria: 'Cookie consent',
  },

  de: {
    title: 'Winter Dip — Fondue-Tasse für Schokolade',
    meta_desc: 'Keramik-Fondue-Tasse für Schokolade mit Teelicht-Öffnung und Gabel. Kostenloser Versand nach Deutschland und Österreich, Lieferung in 7–12 Tagen.',
    announce: '🚚 <strong>Kostenloser Versand</strong> nach Deutschland & Österreich<span class="announce__long"> · bis 5. Dezember bestellen, pünktlich zu Weihnachten</span>',
    nav_home: 'Start', nav_shop: 'Shop', buy_now: 'Jetzt kaufen', cart_aria: 'Warenkorb öffnen', menu: 'Menü', home_aria: 'Winter Dip — Startseite',
    hero_l1: 'Winterfondue', hero_l2: 'in einer Tasse',
    hero_buy: 'Jetzt kaufen', hero_see: 'Tassen ansehen', hero_ship: '<span>🚚</span> <b>Kostenloser Versand</b> · {price} ist der Endpreis', scroll: 'Scrollen',
    col_eyebrow: 'Kollektion', col_title: 'Wähle dein<br><em>Winterritual</em>',
    col_lead: 'Eine Tasse für den ruhigen Abend mit einem guten Buch – oder zwei für ein gemütliches Date zu Hause. Ein Geschenk, das den Abend besonders macht – perfekt unter dem Weihnachtsbaum.',
    card_desc: 'Keramik-Fondue-Tasse mit Teelicht-Öffnung',
    free_ship: '🚚 Kostenloser Versand', view: 'Zum Produkt', add: 'In den Warenkorb',
    delivery_note: '<b>🚚 Kostenloser Versand für jede Bestellung</b> · Lieferung in {days} · bis 5. Dezember bestellen, pünktlich zu Weihnachten',
    gal_eyebrow: 'Galerie', gal_title: 'Ganz nah',
    contact_title: 'Schreib uns<br><em>bei heißer Schokolade</em>',
    f_name: 'Name', f_email: 'E-Mail', f_msg: 'Nachricht', f_send: 'Nachricht senden', f_note: 'Dein E-Mail-Programm öffnet sich – danke für deine Nachricht!', f_subject: 'Nachricht von der Winter-Dip-Website',
    nl_text: 'Winterliche Fondue-Rezepte und früher Zugang zu neuen Kollektionen.', nl_ph: 'Deine E-Mail', nl_btn: 'Anmelden', nl_done: 'Danke! Wir melden uns mit winterlichen Neuigkeiten.',
    ft_shop: 'Shop', ft_help: 'Hilfe', ft_contact: 'Kontakt', ft_all: 'Alle Produkte',
    ft_faq: 'FAQ', ft_ship: 'Versand & Rückgabe', ft_terms: 'AGB', ft_privacy: 'Datenschutz', ft_withdraw: 'Widerrufsrecht', ft_imprint: 'Impressum', ft_cookies: 'Cookie-Einstellungen',
    copyright: '© 2026 Winter Dip. Alle Rechte vorbehalten.',
    shop_eyebrow: 'Winter Dip Shop', shop_title: 'Ein Geschenk,<br><em>das von Herzen wärmt</em>', shop_deadline: '⏳ Bestellen mit Lieferung vor Weihnachten noch: <b data-deadline>…</b>',
    dl_d: 'T.', dl_h: 'Std.', dl_m: 'Min.',
    cart: 'Warenkorb', cart_title: 'Dein Warenkorb', close: 'Schließen', total: 'Gesamt', checkout: 'Zur Kasse',
    trust_pay: '🔒 Sichere Zahlung', trust_ret: '↩ 30 Tage Rückgabe', trust_track: '📦 Sendungsverfolgung',
    ship_bar: '🚚 <b>Kostenloser Versand</b> – keine Zusatzkosten an der Kasse', empty: 'Dein Warenkorb ist leer.', see_mugs: 'Tassen ansehen',
    less: 'Weniger', more: 'Mehr', remove: 'Entfernen', added: 'Hinzugefügt: {name}',
    drawer_ship: 'Versand: <b>kostenlos</b> · Lieferung in {days} · Endpreis',
    err_sold: 'Ein Artikel ist gerade ausverkauft. Bitte entferne ihn aus dem Warenkorb.', err_load: 'Die Kasse ist noch nicht bereit. Bitte versuch es gleich noch einmal.', err_open: 'Die Kasse konnte nicht geöffnet werden. Bitte versuch es gleich noch einmal.',
    sold_out: 'Ausverkauft',
    p_eyebrow: 'Fondue-Tasse Chocolat…', colour: 'Farbe', qty_less: 'Weniger', qty_more: 'Mehr',
    fs_title: 'Kostenloser Versand · Lieferung bis {date}', fs_text: 'Du zahlst {price} und nichts weiter – keine Zusatzkosten an der Kasse.',
    pay_aria: 'Zahlungsarten',
    stock_note: 'Lieferung in {days} · bis 5. Dezember bestellen, pünktlich zu Weihnachten',
    bundle_t: 'Eine zweite als Geschenk', bundle_d: 'Die andere Farbe für einen lieben Menschen – ebenfalls versandkostenfrei.',
    tr_ship: 'Versand', tr_ship_v: 'Immer kostenlos', tr_ret: 'Rückgabe', tr_ret_v: '30 Tage ohne Wenn und Aber', tr_track: 'Sendungsverfolgung', tr_track_v: 'Sendungsnummer per E-Mail',
    acc_care_t: 'Maße & Pflege', acc_care: 'Die Tasse fasst eine Portion Schokoladenfondue für eine Person. Die Keramik ist spülmaschinenfest, wir empfehlen aber Handwäsche, damit Glasur und Schriftzug lange schön bleiben. Die Gabel bitte von Hand spülen.',
    acc_ship_t: 'Versand & Rückgabe', acc_ship: 'Wir versenden aus dem Lager unseres Partners – dein Paket ist in {days} bei dir, die Sendungsnummer bekommst du per E-Mail. Der Versand ist immer kostenlos. Du hast ein gesetzliches Widerrufsrecht von 14 Tagen, das wir freiwillig auf 30 Tage verlängern.',
    steps_eyebrow: 'So funktioniert’s', steps_title: 'In drei Schritten<br>zum Fondue',
    s1_t: 'Schokolade hineingeben', s1_d: 'Gib ein paar Stücke deiner Lieblingsschokolade in die Tasse. Vorher schmelzen musst du nichts.',
    s2_t: 'Teelicht anzünden', s2_d: 'Schieb ein Teelicht in die Öffnung im Fuß und zünde es an. Die Schokolade schmilzt von selbst und bleibt den ganzen Abend flüssig.',
    s3_t: 'Eintauchen und genießen', s3_d: 'Spieß ein Stück Obst auf die Gabel und tauch es in die Schokolade. Zwischendurch ruht die Gabel am Henkel.',
    s1_alt: 'Schokoladenstücke kommen in die Tasse', s2_alt: 'Teelicht wird in die Tasse geschoben', s3_alt: 'Erdbeere in geschmolzene Schokolade getaucht',
    occ_eyebrow: 'Anlässe', occ_title: 'Für jeden<br>Winterabend',
    occ: [['Date zu Hause', 'Zwei Tassen, gedimmtes Licht und Erdbeeren in Schokolade. Ein Abend, an den man sich länger erinnert als an ein Essen im Restaurant.'], ['Filmabend', 'Eine Decke, deine Lieblingsserie und warme Schokolade griffbereit. Ohne Kochen, ohne Töpfe zu spülen.'], ['Weihnachtsgeschenk', 'Die Tasse mit einer Tafel Lieblingsschokolade ist ein fertiges Weihnachtsgeschenk.'], ['Abend mit Freunden', 'Jeder hat seine eigene Tasse und seine eigene Portion. Mini-Fondue für eine Person – ganz ohne gemeinsamen Topf.']],
    dips_t: 'Was eintauchen?', dips: ['Erdbeeren', 'Bananen', 'Lebkuchen', 'Kekse', 'Marshmallows', 'Brezeln', 'Mandarinen', 'Löffelbiskuits', 'Ananas', 'Waffeln'],
    box_eyebrow: 'Lieferumfang', box_title: 'Alles,<br>was du brauchst',
    box_mug: 'Tasse Chocolat…', box_mug_v: 'Keramik, Farbe: {colour}', box_fork: 'Fondue-Gabel', box_fork_v: 'Edelstahl', box_size: 'Maße', box_size_v: 'ca. 13 × 10 × 12 cm, eine Portion', box_tl: 'Teelicht', box_tl_v: 'jedes normale Teelicht passt (nicht enthalten)',
    other_eyebrow: 'Auch erhältlich', sticky_ship: '🚚 kostenloser Versand',
    colours: { 'mug-1': 'Beige', 'mug-2': 'Rot' },
    names: { 'mug-1': 'Fondue-Tasse Beige', 'mug-2': 'Fondue-Tasse Rot' },
    leads: {
      'mug-1': 'Cremefarbene Keramik mit schokoladenbraunem Innenteil. Das Teelicht im Fuß hält die Schokolade den ganzen Abend flüssig, und die Gabel hat ihren festen Platz am Henkel.',
      'mug-2': 'Festliches, kräftiges Rot mit hellem Innenteil. Unten das Teelicht, oben die geschmolzene Schokolade – und die Gabel immer griffbereit.',
    },
    bullets: {
      'mug-1': ['Keramik in Cremebeige mit braunem Innenteil', 'Teelicht-Öffnung – die Schokolade bleibt den ganzen Abend flüssig', 'Fondue-Gabel inklusive', 'Eine schöne Geschenkidee für Weihnachten'],
      'mug-2': ['Keramik in festlichem Rot mit hellem Innenteil', 'Teelicht-Öffnung – die Schokolade bleibt den ganzen Abend flüssig', 'Fondue-Gabel inklusive', 'Eine schöne Geschenkidee für Weihnachten'],
    },
    alts: ['Tasse von vorne', 'Tasse mit Schokolade und Teelicht', 'Erdbeere wird in Schokolade getaucht', 'Tasse von oben mit Gabel und Schokolade', 'Gabel steckt am Henkel', 'Tasse an einem Winterabend mit Snacks'],
    faq: [
      ['Wie funktioniert die Fondue-Tasse?', 'In die Öffnung im Fuß der Tasse stellst du ein ganz normales Teelicht. Die kleine Flamme hält die Schokolade den ganzen Abend flüssig und warm. Die Gabel legst du einfach am Henkel ab, wenn du sie nicht brauchst.'],
      ['Wann kommt meine Bestellung an?', 'Die Lieferung dauert in der Regel 7–12 Tage. Die Sendungsnummer bekommst du per E-Mail. Bestellungen bis zum 5. Dezember kommen rechtzeitig vor Weihnachten an.'],
      ['Kostet der Versand etwas?', 'Nein – der Versand nach Deutschland und Österreich ist immer kostenlos, auch bei nur einer Tasse. Der Preis auf der Website ist der Endpreis.'],
      ['Wie kann ich bezahlen?', 'Mit Kreditkarte (Visa, Mastercard), Apple Pay, Google Pay oder Klarna. Die Zahlung läuft über die sichere Kasse von Shopify.'],
      ['Ist die Tasse spülmaschinenfest?', 'Die Keramik verträgt die Spülmaschine, wir empfehlen aber Handwäsche, damit Glasur und Schriftzug lange schön bleiben. Die Gabel bitte von Hand spülen.'],
      ['Welche Schokolade eignet sich?', 'Am besten Zartbitter- oder Vollmilchschokolade in Stücken, gern mit einem Schuss Sahne. Mit Käse wird daraus ein kleines Käsefondue.'],
      ['Kann ich die Tasse zurückgeben?', 'Ja. Du hast ein gesetzliches Widerrufsrecht von 14 Tagen ab Erhalt der Ware – wir verlängern es freiwillig auf 30 Tage. Schreib uns einfach eine E-Mail.'],
      ['Eignet sich die Tasse als Geschenk?', 'Auf jeden Fall – sie gehört zu den beliebtesten Geschenken zu Nikolaus und Weihnachten. An der Kasse kannst du direkt die Adresse der beschenkten Person angeben.'],
    ],
    consent: '<b>Cookies</b>Wir verwenden Cookies, damit der Shop funktioniert, und – mit deiner Einwilligung – um die Wirksamkeit unserer Werbung zu messen (Meta). Du kannst das jederzeit im Footer unter „Cookie-Einstellungen“ ändern.',
    consent_no: 'Nur notwendige', consent_yes: 'Akzeptieren', consent_aria: 'Cookie-Einwilligung',
  },
};

export const T = STR[LANG];
export const DAYS = DELIVERY[LANG];
// prosty szablon: t('hero_ship', { price: '…' })
export const t = (key, vars = {}) => String(T[key] ?? key).replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? (k === 'days' ? DAYS : ''));
