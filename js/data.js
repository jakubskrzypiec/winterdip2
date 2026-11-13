// =========================================================
// Dane sklepu: ceny, produkty, opinie, FAQ i ustawienia Shopify.
// =========================================================

export const SHOP = {
  currency: 'zł',
  freeShippingFrom: 0,     // 0 = dostawa zawsze darmowa (w Shopify stawka 0 zł)
  shippingCost: 0,
  // ostatni dzień zamówień z gwarancją dostawy przed Wigilią
  christmasCutoff: '2026-12-08T23:59:59+01:00',   // dostawa do 10 dni + zapas
  // WYPRZEDAŻ: data końca (jedna dla wszystkich, licznik się nie resetuje).
  // Po tej dacie pasek, licznik i przekreślone ceny znikają same.
  saleEnds: '2026-11-17T23:59:59+01:00',
};

// Kafelki na stronie głównej (kolejność = kolejność na stronie).
export const MUGS = ['mug-1', 'mug-2', 'mug-3'];

// ---------- ŚLEDZENIE REKLAM ----------
// ID pikseli (to nie są hasła — są publiczne). Puste = wyłączone.
//   metaPixel   — Meta Events Manager → Źródła danych → Pixel ID (sam numer)
//   tiktokPixel — TikTok Ads Manager → Assets → Events → Web → Pixel ID
export const TRACKING = {
  metaPixel: '1110812538488174',
  tiktokPixel: '',
};

// ---------- SHOPIFY ----------
// Kasa działa przez Shopify Storefront API: koszyk ze strony tworzy koszyk
// w Shopify i przekierowuje klienta do kasy Shopify (płatności, dostawa, faktury).
// Do uzupełnienia (instrukcja: URUCHOMIENIE.md):
//   domain          — adres sklepu, np. 'winterdip.myshopify.com'
//   storefrontToken — publiczny token Storefront API z kanału „Headless”
//   apiVersion      — wersja Storefront API pokazana przy tokenie (np. '2026-07')
//   handles         — „uchwyt” (końcówka adresu) każdego produktu w Shopify
// Ceny, „cena przed obniżką”, dostępność i ID wariantów strona pobiera z Shopify sama;
// wartości przy produktach poniżej działają tylko, dopóki Shopify nie jest podpięty.
export const SHOPIFY = {
  domain: 'wmqk7f-cr.myshopify.com',
  storefrontToken: '6a8d238aa8741fc11ef2d95db0ed99ec',   // publiczny token (Headless → Storefront API)
  apiVersion: '2026-10',
  handles: {
    'mug-1': 'kubek-bezowy',
    'mug-2': 'kubek-czerwony',
    'mug-3': 'kubek-bialy-cozy-days',
  },
};

export const PRODUCTS = {
  'mug-1': { id: 'mug-1', name: 'Kubek beżowy', short: 'Ceramiczny kubek do fondue z podgrzewaczem', price: 75, img: 'assets/products/winter-dips-bezowy-01-katalog.webp',
    // TODO: oldPrice = prawdziwa cena sprzed obniżki, lowest30 = najniższa cena z 30 dni przed obniżką (wymóg prawa — dyrektywa Omnibus)
    oldPrice: 99, lowest30: 99,
    stock: 7, shopifyVariantId: '' },   // TODO: prawdziwa liczba sztuk w magazynie
  'mug-2': { id: 'mug-2', name: 'Kubek czerwony', short: 'Ceramiczny kubek do fondue z podgrzewaczem', price: 75, img: 'assets/products/winter-dips-czerwony-01-katalog.webp',
    oldPrice: 99, lowest30: 99,   // TODO: jak wyżej
    stock: 4, shopifyVariantId: '' },   // TODO: prawdziwa liczba sztuk w magazynie
  'mug-3': { id: 'mug-3', name: 'Kubek biały Cozy days', short: 'Biała ceramika, dwa widelczyki w komplecie', price: 75, img: 'assets/products/winter-dips-bialy-01-katalog.webp', soldOut: true },
  'chocolate-mug': {
    id: 'chocolate-mug',
    name: 'Chocolate… kubek do fondue',
    short: 'Ceramiczny kubek z podgrzewaczem i widelczykiem',
    price: 89,
    oldPrice: 119,
    img: 'assets/img/mug.webp',
    badge: 'Bestseller',
  },
  'chocolate-duo': {
    id: 'chocolate-duo',
    name: 'Zestaw dla dwojga',
    short: '2 × kubek Chocolate… + 12 podgrzewaczy gratis',
    price: 159,
    oldPrice: 238,
    img: 'assets/img/mug.webp',
    duo: true,
    badge: 'Najlepszy prezent',
  },
  'tealights': {
    id: 'tealights',
    name: 'Podgrzewacze 12 szt.',
    short: 'Zapas na 12 wieczorów',
    price: 19,
    img: 'assets/img/mug.webp',
    addon: true,
  },
};

// Opinie klientów (inicjał imienia + miasto).
export const REVIEWS = [
  { name: 'A.', city: 'Kraków', text: 'Wieczór z tym kubkiem to mały rytuał. Czekolada długo trzyma temperaturę.', stars: 5 },
  { name: 'M.', city: 'Gdańsk', text: 'Kupiłam jako prezent na Mikołajki — zachwyt od pierwszego rozpakowania.', stars: 5 },
  { name: 'K.', city: 'Poznań', text: 'Świetna jakość ceramiki, kolor dokładnie jak na zdjęciach.', stars: 5 },
  { name: 'T.', city: 'Wrocław', text: 'Fondue dla jednej osoby bez bałaganu. Idealne na zimowe wieczory.', stars: 5 },
  { name: 'J.', city: 'Warszawa', text: 'Zestaw dla dwojga wziąłem na randkę w domu. Strzał w dziesiątkę.', stars: 5 },
  { name: 'O.', city: 'Łódź', text: 'Szybka wysyłka, porządnie zapakowane, kubek robi wrażenie.', stars: 4 },
  { name: 'E.', city: 'Lublin', text: 'Truskawki w czekoladzie przy kominku — więcej nie trzeba.', stars: 5 },
  { name: 'P.', city: 'Szczecin', text: 'Widelczyk wygodnie trzyma się w uchu kubka. Przemyślany detal.', stars: 5 },
  { name: 'R.', city: 'Rzeszów', text: 'Dzieci zachwycone — wieczór z owocami w czekoladzie stał się naszą tradycją.', stars: 5 },
  { name: 'B.', city: 'Białystok', text: 'Kolor kubka na żywo jeszcze ładniejszy. Idealnie pasuje do świąt.', stars: 5 },
  { name: 'N.', city: 'Bydgoszcz', text: 'Podarowałam mamie, teraz sama chcę drugi dla siebie.', stars: 5 },
  { name: 'Z.', city: 'Zakopane', text: 'Po nartach nie ma nic lepszego niż ciepła czekolada z tego kubka.', stars: 5 },
  { name: 'G.', city: 'Gdynia', text: 'Świetny prezent dla pary. Zestaw dla dwojga robi robotę.', stars: 5 },
  { name: 'S.', city: 'Katowice', text: 'Podgrzewacz trzyma temperaturę dłużej, niż się spodziewałem.', stars: 4 },
  { name: 'O.', city: 'Olsztyn', text: 'Ładnie zapakowany, gotowy do położenia pod choinkę.', stars: 5 },
  { name: 'T.', city: 'Toruń', text: 'Pierniki maczane w czekoladzie — od teraz obowiązkowo co weekend.', stars: 5 },
];

// Miasta do wizualizacji zamówień na globusie [lat, lon]
export const CITIES = [
  { name: 'Warszawa', lat: 52.23, lon: 21.01, w: 10 },
  { name: 'Kraków', lat: 50.06, lon: 19.94, w: 7 },
  { name: 'Wrocław', lat: 51.11, lon: 17.03, w: 6 },
  { name: 'Poznań', lat: 52.41, lon: 16.93, w: 5 },
  { name: 'Gdańsk', lat: 54.35, lon: 18.65, w: 5 },
  { name: 'Łódź', lat: 51.76, lon: 19.46, w: 5 },
  { name: 'Szczecin', lat: 53.43, lon: 14.55, w: 3 },
  { name: 'Lublin', lat: 51.25, lon: 22.57, w: 3 },
  { name: 'Katowice', lat: 50.26, lon: 19.02, w: 4 },
  { name: 'Białystok', lat: 53.13, lon: 23.16, w: 2 },
  { name: 'Rzeszów', lat: 50.04, lon: 22.0, w: 2 },
  { name: 'Bydgoszcz', lat: 53.12, lon: 18.0, w: 3 },
  { name: 'Olsztyn', lat: 53.78, lon: 20.48, w: 2 },
  { name: 'Zakopane', lat: 49.3, lon: 19.95, w: 2 },
  { name: 'Toruń', lat: 53.01, lon: 18.6, w: 2 },
  { name: 'Opole', lat: 50.67, lon: 17.93, w: 1 },
  { name: 'Kielce', lat: 50.87, lon: 20.63, w: 1 },
  { name: 'Zielona Góra', lat: 51.94, lon: 15.51, w: 1 },
];

export const FAQ = [
  ['Jak działa kubek do fondue?', 'Do otworu w podstawie wkładasz zwykły podgrzewacz (tealight). Płomień utrzymuje czekoladę w płynnej, ciepłej formie przez cały wieczór. Widelczyk wsuwasz w uchwyt, gdy go nie używasz.'],
  ['Kiedy dostanę zamówienie?', 'Paczka jest u Ciebie najpóźniej w 10 dni od zamówienia, a numer do śledzenia przesyłki wysyłamy mailem. Zamówienia złożone do 8 grudnia dotrą przed Wigilią.'],
  ['Czy wysyłka jest darmowa?', 'Tak — dostawa jest zawsze darmowa, nawet przy jednym kubku. Cena na stronie to cena końcowa, w kasie nic nie dopłacasz.'],
  ['Czy kubek można myć w zmywarce?', 'Ceramikę możesz myć w zmywarce, ale polecamy mycie ręczne, żeby napis i szkliwo zostały piękne na lata. Widelczyk myj ręcznie.'],
  ['Jakiej czekolady użyć?', 'Najlepiej sprawdza się czekolada deserowa lub mleczna w kostkach, rozpuszczona z odrobiną śmietanki. Możesz też użyć sera — wtedy masz mini fondue serowe.'],
  ['Czy mogę zwrócić produkt?', 'Masz 30 dni na zwrot bez podawania przyczyny. Na prezenty kupione w listopadzie i grudniu termin zwrotu liczymy do 31 stycznia.'],
  ['Czy kubek nadaje się na prezent?', 'Tak — to jeden z ulubionych prezentów na Mikołajki i święta. Kubek przychodzi w bezpiecznym opakowaniu wysyłkowym, a przy zamówieniu możesz od razu podać adres osoby, którą chcesz obdarować.'],
];
