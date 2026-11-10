# Uruchomienie sprzedaży: Shopify + Zendrop

Strona (ta, na GitHub Pages) zostaje taka, jak jest. Shopify robi kasę, płatności,
zamówienia i maile do klientów, a Zendrop wysyła paczki. Jak to działa:

```
klient na stronie → koszyk → „Przejdź do kasy” → kasa Shopify (płatność)
→ zamówienie w Shopify → Zendrop pakuje i wysyła → numer przesyłki trafia do klienta
```

Kroki 1–6 robisz w panelu Shopify i Zendrop. Krok 7 to dwie linijki w kodzie
(możesz je podesłać mnie).

## 1. Sklep Shopify

- Załóż sklep na shopify.com i wybierz płatny plan (na planie próbnym nie da się sprzedawać).
- **Ustawienia → Dane sklepu:** nazwa firmy, adres, NIP, e-mail kontaktowy, waluta **PLN**.
- **Ustawienia → Rynki:** Polska jako główny rynek, język polski.

## 2. Produkty z Zendrop

1. W Shopify: **Aplikacje → Shopify App Store → Zendrop** → zainstaluj i połącz ze sklepem.
2. W Zendrop znajdź swoje kubki (beżowy, czerwony, biały) → **Add to Import List** → **Push to Store**.
3. W Shopify przy każdym produkcie ustaw:
   - **Tytuł, opis i zdjęcia.** Możesz użyć zdjęć z `assets/products/`.
   - **Cena: 75 zł.**
   - **„Porównaj z ceną”: 99 zł** — tylko jeśli to prawdziwa cena sprzed obniżki. Strona sama pokaże wtedy przekreśloną cenę i −24%.
   - **Uchwyt adresu (handle)**, na dole w sekcji „Wyszukiwarka”, dokładnie taki:

     | Produkt na stronie | Handle w Shopify |
     |---|---|
     | Kubek beżowy | `kubek-bezowy` |
     | Kubek czerwony | `kubek-czerwony` |
     | Kubek biały Cozy days | `kubek-bialy-cozy-days` |

   - **Stan magazynowy:** jeśli śledzisz liczbę sztuk, strona pokaże „Zostało tylko X sztuk”. Gdy produkt jest wyprzedany, strona sama zablokuje przycisk.
4. W Zendrop włącz **Auto-fulfillment**, żeby zamówienia same szły do realizacji. Zendrop pobiera opłatę za towar i wysyłkę z twojej karty podpiętej w Zendrop.

## 3. Wysyłka

- **Ustawienia → Wysyłka i dostawa:** strefa **Polska**, stawka **14,99 zł**, darmowa od **149 zł**.
  Te same kwoty są na stronie (`SHOP` w `js/data.js`); jeśli zmienisz je w Shopify, zmień też tam.
- **Ważne — czas dostawy.** Strona obiecuje **ok. 10 dni (do 5 dni przygotowania + do 3 dni dostawy)**.
  Sprawdź w Zendrop realny czas wysyłki do Polski dla swoich kubków (z magazynów w Chinach to często
  więcej niż 10 dni). Jeśli jest dłuższy, napisz mi, to poprawię teksty na stronie, w FAQ i termin
  świąteczny (`christmasCutoff`).

## 4. Płatności

- **Ustawienia → Płatności:** włącz Shopify Payments (jeśli jest dostępne dla twojej firmy)
  albo dostawcę z BLIK-iem i Przelewy24 (np. aplikacja Przelewy24 lub PayU).
- Zrób zamówienie testowe w trybie testowym, zanim włączysz prawdziwe płatności.

## 5. Regulamin i polityki

- **Ustawienia → Zasady:** regulamin, polityka prywatności, zwroty (strona obiecuje **30 dni**), wysyłka.
  Shopify ma szablony — uzupełnij je danymi firmy.
- Linki w stopce strony („Regulamin”, „Polityka prywatności”, „Zwroty i reklamacje”) same
  zaczną prowadzić do tych stron po kroku 7.

## 6. Token do kasy (kanał Headless)

1. **Aplikacje → Shopify App Store → „Headless”** (aplikacja Shopify) → zainstaluj → **Create storefront**.
2. W **Storefront API → Manage** zaznacz uprawnienia:
   - odczyt produktów (`unauthenticated_read_product_listings`),
   - odczyt stanów magazynowych (`unauthenticated_read_product_inventory`),
   - koszyk i kasa (`unauthenticated_read_checkouts`, `unauthenticated_write_checkouts`).
3. Skopiuj **Public access token** i zanotuj **wersję API**, którą pokazuje Shopify.
   Ten token jest publiczny i może być na stronie. **Private token** nikomu nie podawaj
   i nie wklejaj na stronę.
4. W ustawieniach kanału Headless dodaj produkty (kubki) do kanału sprzedaży.

## 7. Wpisanie danych na stronę

W `js/data.js` uzupełnij:

```js
export const SHOPIFY = {
  domain: 'twoj-sklep.myshopify.com',
  storefrontToken: 'TU_PUBLIC_ACCESS_TOKEN',
  apiVersion: 'TU_WERSJA_API',   // np. '2026-07'
  handles: { ... }               // bez zmian, jeśli handle są jak w tabeli wyżej
};
```

Po wypchnięciu zmian strona sama pobierze z Shopify ceny, cenę przed obniżką, dostępność
i ID wariantów, a „Przejdź do kasy” otworzy kasę Shopify.

## 8. Przed startem

- Zrób zamówienie testowe: sprawdź płatność, maila do klienta i to, czy zamówienie pojawiło się w Zendrop.
- **Wyprzedaż:** data końca jest w `SHOP.saleEnds`, a najniższa cena z 30 dni (wymóg prawa) w `lowest30`
  przy produktach w `js/data.js`. Wpisz prawdziwe wartości.
- **Kontakt:** sprawdź, czy `kontakt@winterdip.pl` działa, i podaj linki do Instagrama i TikToka.
- **Opcjonalnie:** własna domena (np. `winterdip.pl`) — podepnij ją do GitHub Pages, a kasę zostaw na Shopify
  (np. `sklep.winterdip.pl`).
