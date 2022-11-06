# WkInputs (Twig)

Wersja 2.0.0
Kolekcja interaktywnych komponentów formularza w formie komponentów Twig i w oparciu o czysty JavaScript.

<h2  id="spis-tresci">Spis treści</h2>

-   [Informacje ogólne](#informacje-ogolne)
-   [Walidacja](#walidacja)
-   [Eventy](#eventy)
-   [WkTextField](#wktextfield)
    -   [Propsy (Twig)](#wktextfield-propsy-twig)
    -   [Sloty (Twig)](#wktextfield-sloty)
    -   [Propsy](#wktextfield-propsy)
    -   [Metody](#wktextfield-metody)
    -   [Zdarzenia](#wktextfield-eventy)
-   [WkTextarea](#wktextarea)
    -   [Propsy (Twig)](#wktextarea-propsy-twig)
    -   [Sloty (Twig)](#wktextarea-sloty)
    -   [Propsy](#wktextarea-propsy)
    -   [Metody](#wktextarea-metody)
    -   [Zdarzenia](#wktextarea-eventy)
-   [WkRadio](#wkradio)
    -   [Propsy (Twig)](#wkradio-propsy-twig)
    -   [Sloty (Twig)](#wkradio-sloty)
    -   [Propsy](#wkradio-propsy)
    -   [Metody](#wkradio-metody)
    -   [Metody grupy](#wkradio-metody-grupy)
    -   [Zdarzenia](#wkradio-eventy)
-   [WkCheckbox](#wkcheckbox)
    -   [Propsy (Twig)](#wkcheckbox-propsy-twig)
    -   [Sloty (Twig)](#wkcheckbox-sloty)
    -   [Propsy](#wkcheckbox-propsy)
    -   [Metody](#wkcheckbox-metody)
    -   [Metody grupy](#wkcheckbox-metody-grupy)
    -   [Zdarzenia](#wkcheckbox-eventy)
-   [WkSelect](#wkselect)
    -   [Propsy (Twig)](#wkselect-propsy-twig)
    -   [Sloty (Twig)](#wkselect-sloty)
    -   [Propsy](#wkselect-propsy)
    -   [Metody](#wkselect-metody)
    -   [Metody grupy](#wkselect-metody-grupy)
    -   [Zdarzenia](#wkselect-eventy)

<h2  id="informacje-ogolne">Informacje ogólne</h2>

[Powrót do spisu treści](#spis-tresci)

1. Każdy komponent z kolekcji korzysta z uniwersalnego wrappera WkInput, w który zapewnia uniwersalny wrapper: ![](https://lh4.googleusercontent.com/xPQUvsQMHiT8UtatnQb5dNSKfCO4q62vifH-cwZLJK740_Hi7NhzvkTaeMYFGjjnuCVLmu31rKLp6AT5-EK8Dkx4ReS_AD10xkSeVBF3HNX7U8aZCXZX0-VXObPRkwFOJBToW03wkBePdNn0YIf7gg)
   W jego kompetencjach jest otrzymywanie reguł walidacji oraz walidowanie wartości danego komponentu-dziecka.
2. Wszystkie inputy oraz obiekty pomocnicze rejestrowane są pod globalnym obiektem wkInputs umieszczonym w obiekcie window.
3. Do obiektu wkInputs dodawane są także obiekty specjalne:

-   `__eventBus` - obiekt klasy _WkEventBus_, który pełni funkcję magistrali komunikacyjnej pomiędzy inputami, które pracują w grupie i muszą reagować na swoje wzajemne zmiany (np. radio button)
-   `__inputGroups` - obiekt klasy _WkInputGroups_, w którym rejestrowane są automatycznie wszystkie inputy pracujące w grupach. Pozwala on na łatwe pobieranie wartości inputa/inputów z danej grupy za jednym razem oraz udostępnia metody umożliwiające walidację całej grupy inputów.

4. Aby komponenty działały, przed umieszczeniem ich kodu w HTML strony należy **najpierw** zaimportować skrypt `wk-inputs.js`.
5. Inicjalizacja komponentów od strony JavaScript jest w pełni automatyczna i nie wymaga podejmowania żadnych akcji.
6. Każdy komponent **musi** posiadać nadane **unikalne ID**. Pod tą wartością zostanie zarejestrowany w obiekcie `wkInputs`. W przypadku wielokrotnego użycia tego samego ID skonfliktowane komponenty nie będą działały poprawnie.
7. Komponenty pracujące w grupie **muszą** mieć zdefiniowany atrybut `name`, inaczej nie zostaną poprawnie zarejestrowane, a ich praca nie będzie synchronizowana grupowo.
8. Z poziomu Twig każdy komponent wstawiamy jako `embed`, do którego można przekazać dane w formie propsów (`with {} only`) oraz w formie slotów (elementy `{% block %}`), na przykład:

```twig
{% embed 'components/wk-test-field.twig' with {
    showAsterisk: true,
    defaultErrorMessage: 'Wprowadź wartość',
    counterValue: 20,
    id: 'cf_name',
    type: 'text',
    disabled: false,
    name: 'testname',
    value: 'Domyślna zawartość',
    placeholder: 'Wpisz coś...',
    prefix: '+48',
    suffix: 'PLN'
} only %}
    {% block label %}
        Zawartość labela
    {% endblock %}

    {% block prepend %}
        Wartość poprzedzająca pole
    {% endblock %}

    {% block hint %}
        Wskazówka
    {% endblock %}
{% endembed %}
```

10. Informacje o dostępnych propsach, slotach i metodach wymienione są w dokumentacji poszczególnych komponentów.

<h2  id="walidacja">Walidacja</h2>

[Powrót do spisu treści](#spis-tresci)

Walidacja bazuje na funkcjach walidujących (walidatorach), które w momencie wykonywania testów jako argument otrzymają aktualną wartość danego inputa. Ich zadaniem jest zwrócić wartość `true`, jeżeli wszystko jest w porządku i zawartość inputa jest poprawna. Każda wartość inna niż `true` będzie traktowana jako informacja o błędzie. Jeżeli zostanie zwrócony `string`, to zostanie on wykorzystany jako wiadomość o błędzie. Dzięki temu można zwracać różne wiadomości z różnych walidatorów. Jeżeli walidator nie zwróci własnej wiadomości o błędzie wyświetlona zostanie wiadomość domyślna (przekazana przez odpowiedni props) lub nie zostanie wyświetlona żadna wiadomość, jedynie input przejdzie w wizualny stan błędu.

Przykładowa funkcja walidująca:

```javascript
function(value) {
    if(!value  ||  value.length  ==  0) return  'To pole jest wymagane';
    if(value.length  >  31) return  'Wprowadź maksymalnie 31 znaków';
    if(!(/^[A-Za-z0-9_-]{1,31}$/).test(value)) return  'Nie spełniono wymagań';
    return  true;
}
```

Do każdego inputa można przekazać wiele walidatorów, zostaną one każdorazowo wywołane w kolejności ich zarejestrowania. Jeżeli którykolwiek z walidatorów zwróci błąd, walidacja jest przerywana (kolejne walidatory nie zostaną wywołane).

Regułami walidacji można zarządzać poprzez wykorzystanie metod:

-   `setRules(rules)` - umożliwia zdefiniowanie na nowo całej tablicy testów dla danego inputa; jako argument można przekazać funkcję anonimową lub tablicę funkcji
-   `addRule(rule)` - umożliwia dodanie kolejnej reguły do zestawu reguł danego inputa; jako argument należy podać funkcję anonimową
-   `clearRules()` - umożliwia usunięcie wszystkich walidatorów zdefiniowanych dla danego inputa

Przykładowy sposób dodania reguły walidacji do inputa o ID user_name oraz sprawdzenia poprawności jego zawartości:

```javascript
wkInputs.user_name.addRule(function (v) {
    if (!v || v.length == 0) return "Pole nie może być puste!";
    return true;
});
wkInputs.user_name.validate(); // true/false
```

<h2  id="eventy">Eventy</h2>

[Powrót do spisu treści](#spis-tresci)

Każdy z zamontowanych elementów rozgłasza właściwe sobie eventy wywoływane konkretnymi akcjami użytkownika. Możliwe jest ich przechwytywanie przy pomocy metod:

-   `.on(event, funkcja)` - tworzy handler eventów określonego typu
-   `.once(event, funkcja)` - tworzy jednorazowy handler eventu określonego typu (funkcja wykona się tylko za pierwszym razem)
-   `.off(event, funkcja)` - usuwa obserwatora eventów

Funkcja anonimowa może otrzymać argument (tutaj: `e`). Dostępne w nim są poniższe dane:

-   `e.element` - pierwotny komponent rozgłaszający (można za jego pomocą np. wywoływać jego metody)
-   `e.native_event` - domyślny event generowany przez przeglądarkę w kontekście eventu

Na przykład:

```javascript
window.wkInputs.text_field.on("keydown", function (e) {
    console.log(e.native_event.keyCode);
});
```

Listy eventów rozgłaszanych przez poszczególne elementy znajdują się w poświęconych im rozdziałach.

<h2  id="wktextfield">WkTextField</h2>

[Powrót do spisu treści](#spis-tresci)

Komponent prostego pola tekstowego (text, password, number, itd.).

<h3  id="wktextfield-propsy-twig">Dostępne propsy (Twig)</h3>

-   `showAsterisk` **(boolean)** - decyduje o tym, czy pokazać na końcu elementu label czerwoną gwiazdkę
-   `defaultErrorMsg` **(string)** - domyślna wiadomość błędu, jaka ma zostać wyświetlona, gdy funkcja walidująca nie zwróci innego komunikatu
-   `counterValue` **(Integer)** - wartość licznika limitu znaków. Sam licznik nie zapewnia żadnej walidacji, informuje tylko o liczbie znaków w wartości inputa
-   `id` **(string)** - ID elementu, musi być unikalne
-   `type` **(string)** - typ inputa, jeden z typów elementu `<input>` w HTML
-   `disabled` **(boolean)** - flaga decydująca o tym, czy input na start będzie wyłączony czy nie
-   `name` **(string)** - nazwa do przekazania do atrybutu HTML name inputa
-   `value` **(string)** - zawartość startowa inputa
-   `placeholder` **(string)** - opcjonalny tekst wyświetlany, gdy input jest pusty
-   `prefix` **(string)** - stały tekst wyświetlany tuż przed polem tekstowym
-   `suffix` **(string)** - stały tekst wyświetlany tuż za polem tekstowym

<h3  id="wktextfield-sloty">Dostępne sloty (Twig</h3>

-   `label` - pozwala na przekazanie kodu HTML, który ma zostać umieszczony jako label pola tekstowego
-   `prepend` - pozwala na przekazanie kodu HTML, który ma zostać wyświetlony przed polem tekstowym (i przed prefiksem)
-   `append` - pozwala na przekazanie kodu HTML, który ma zostać wyświetlony za polem tekstowym (i za suffixem)
-   `hint` - pozwala na przekazanie kodu HTML, który ma zostać wyświetlony jako wskazówka do wypełnienia pola tekstowego; wskazówka jest wyświetlana, gdy input nie jest w stanie błędu

<h3  id="wktextfield-propsy">Dostępne propsy</h3>

Propsy dostępne z poziomu skryptu umożliwiają odczyt, np.:
`window.wkInputs.id_1.value;`
oraz modyfikację, np.:
`window.wkInputs.id_1.value = 'Jan';`

Propsy komponentu WkTextField to:

-   `value` - wartość pola
-   `focused` - stan aktywności pola
-   `disabled` - stan wyłączenia pola
-   `valid` - stan walidacji pola,

<h3  id="wktextfield-metody">Metody zamontowanego obiektu</h3>
Wszystkie metody obiektu zamontowanego dostępne są pod `window.wkInputs.{ID}`.

-   `validate()` - wykonuje zdefiniowane testy i zwraca Boolean, czy zawartość pola jest poprawna czy nie; pole zostanie też automatycznie ustawione w odpowiedni stan błędu
-   `resetValidation()` - pozwala na zresetowanie stanu błędu pola tekstowego

<h3  id="wktextfield-eventy">Emitowane zdarzenia</h3>

-   `click` - kliknięcie w element
    -   `click:prepend` - kliknięcie w zawartość slotu prepend,
    -   `click:append` - kliknięcie w zawartość slotu append,
-   `focus` - 'skupienie' na elemencie
-   `blur` - przerwanie 'skupienia'
-   `keydown` - klawisz wciśnięty
-   `keyup` - klawisz puszczony
-   `input` - zmieniona wartość

<h2  id="wktextarea">WkTextarea</h2>

[Powrót do spisu treści](#spis-tresci)

Komponent pola na dłuższy tekst (textarea). Działa analogicznie do WkTextField (z kilkoma dodatkowymi funkcjonalnościami).

<h3  id="wktextarea-propsy-twig">Dostępne propsy (Twig)</h3>

-   `showAsterisk` **(boolean)** - decyduje o tym, czy pokazać na końcu elementu label czerwoną gwiazdkę
-   `defaultErrorMsg` **(string)** - domyślna wiadomość błędu, jaka ma zostać wyświetlona, gdy funkcja walidująca nie zwróci innego komunikatu
-   `counterValue` **(Integer)** - wartość licznika limitu znaków. Sam licznik nie zapewnia żadnej walidacji, informuje tylko o liczbie znaków w wartości pola tekstowego
-   `id` **(string)** - ID elementu, musi być unikalne
-   `disabled` **(boolean)** - flaga decydująca o tym, czy pole tekstowe na start będzie wyłączone czy nie
-   `name` **(string)** - nazwa do przekazania do atrybutu HTML name inputa
-   `value` **(string)** - zawartość startowa pola tekstowego
-   `placeholder` **(string)** - opcjonalny tekst wyświetlany, gdy pole tekstowe jest puste
-   `prefix` **(string)** - stały tekst wyświetlany tuż przed polem tekstowym
-   `suffix` **(string)** - stały tekst wyświetlany tuż za polem tekstowym
-   `rows` **(Integer)** - liczba wierszy, na którą wysokie ma być pole tekstowe (w trybie `autogrow` jest to maksymalna liczba wierszy, na jaką pole może się rozszerzyć, zanim włączy się scroll)
-   `autogrow` **(boolean)** - flaga decydująca o tym, czy pole pracuje w trybie sztywno ustawionej wysokości (ilości wierszy) czy w trybie dynamicznego rozszerzania w zależności od objętości tekstu

<h3  id="wktextarea-sloty">Dostępne sloty (Twig)</h3>

-   `label` - pozwala na przekazanie kodu HTML, który ma zostać umieszczony jako label pola tekstowego
-   `prepend` - pozwala na przekazanie kodu HTML, który ma zostać wyświetlony przed polem tekstowym (i przed prefiksem)
-   `append` - pozwala na przekazanie kodu HTML, który ma zostać wyświetlony za polem tekstowym (i za suffixem)
-   `hint` - pozwala na przekazanie kodu HTML, który ma zostać wyświetlony jako wskazówka do wypełnienia pola tekstowego; wskazówka jest wyświetlana, gdy pole tekstowe nie jest w stanie błędu

<h3  id="wktextarea-propsy">Dostępne propsy</h3>

Propsy dostępne z poziomu skryptu umożliwiają odczyt, np.:
`window.wkInputs.id_1.value;`
oraz modyfikację, np.:
`window.wkInputs.id_1.value = 'Jan';`

Propsy komponentu WkTextField to:

-   `value` - wartość pola
-   `focused` - stan aktywności pola
-   `disabled` - stan wyłączenia pola
-   `valid` - stan walidacji pola
-   `rows` - ilość wyświetlanych jednocześnie linii tekstu
-   `autogrow` - stan aktywności funkcji automatycznego zwiększania wysokości pola

<h3  id="wktextarea-metody">Metody zamontowanego obiektu</h3>
Wszystkie metody obiektu zamontowanego dostępne są pod `window.wkInputs.{ID}`.

-   `validate()` - wykonuje zdefiniowane testy i zwraca Boolean, czy zawartość pola jest poprawna czy nie; pole zostanie też automatycznie ustawione w odpowiedni stan błędu
-   `resetValidation()` - pozwala na zresetowanie stanu błędu pola tekstowego
-   `on(event, funkcja)` - pozwala na przechwytywanie eventów rozgłaszanych przez element, tj:
-   <h3  id="wktextarea-eventy">Emitowane zdarzenia</h3>

-   `click` - kliknięcie w element
    -   `click:prepend` - kliknięcie w zawartość slotu prepend,
    -   `click:append` - kliknięcie w zawartość slotu append,
-   `focus` - 'skupienie' na elemencie
-   `blur` - przerwanie 'skupienia'
-   `keydown` - klawisz wciśnięty
-   `keyup` - klawisz puszczony
-   `keypressed` - klawisz wciśnięty
-   `input` - zmieniona wartość

<h2  id="wkradio">WkRadio</h2>

[Powrót do spisu treści](#spis-tresci)

Komponent przycisku typu radio. Wszystkie przyciski w danej grupie powinny posiadać identyczną wartość parametru `name`, dzięki temu będą reagowały ze sobą w odpowiedni sposób. W momencie zmiany stanu dowolnego przycisku z grupy wykonywana jest walidacja na każdym jej elemencie.

<h3  id="wkradio-propsy-twig">Dostępne propsy (Twig)</h3>

-   `defaultErrorMsg` **(string)** - domyślna wiadomość błędu, jaka ma zostać wyświetlona, gdy funkcja walidująca nie zwróci innego komunikatu
-   `id` **(string)** - ID elementu, musi być unikalne
-   `disabled` **(boolean)** - flaga decydująca o tym, czy input na start będzie wyłączony czy nie
-   `name` **(string)** - nazwa do przekazania do atrybutu HTML name inputa oraz jako nazwa grupy
-   `value` **(string|Number)** - wartość startowa grupy inputów (powinna być identyczna dla każdego z jej elementów)
-   `trueValue` **(string|Number)** - wartość aktywna konkretnego inputa (jeżeli `value` będzie równe tej wartości, to komponent jest uznawany za aktywny [checked])

<h3  id="wkradio-sloty">Dostępne sloty (Twig)</h3>

-   `label` - pozwala na przekazanie kodu HTML, który ma zostać umieszczony jako label elementu `radio`
-   `hint` - pozwala na przekazanie kodu HTML, który ma zostać wyświetlony jako wskazówka dla elementu

<h3  id="wkradio-propsy">Dostępne propsy</h3>

Propsy dostępne z poziomu skryptu umożliwiają odczyt, np.:
`window.wkInputs.id_1.value;`
oraz modyfikację, np.:
`window.wkInputs.id_1.value = 'Jan';`

Propsy komponentu WkTextField to:

-   `value` - wartość elementu
-   `disabled` - stan wyłączenia elementu
-   `valid` - stan walidacji elementu
-   `name` - nazwa elementu (unikalna dla grupy)
-   `true_value` - unikalna wartość dla stanu `true`

<h3  id="wkradio-metody">Metody zamontowanego obiektu</h3>

-   `validate()` - wykonuje zdefiniowane testy i zwraca Boolean, czy zawartość pola jest poprawna czy nie; pole zostanie też automatycznie ustawione w odpowiedni stan błędu
-   `resetValidation()` - pozwala na zresetowanie stanu błędu komponentu

<h3  id="wkradio-eventy">Emitowane zdarzenia</h3>

-   `change` - zmiana stanu

<h3  id="wkradio-metody-grupy">Metody grupy przycisków</h3>

Aby w łatwy sposób móc pobrać aktualną wartość `value` z całej grupy inputów radio bez konieczności sprawdzania stanu każdego z nich należy skorzystać z pomocniczego obiektu `__inputGroups` dostępnego pod obiektem `wkInputs`.

-   `getRadioGroupValue(group_name: String)` - zwraca aktualną wartość `value` (zaznaczonego buttona radio) z grupy o podanej w argumencie nazwie
-   `validateGroup(group_name: String)` - wykonuje walidację każdego elementu z grupy o nazwie przekazanej poprzez argument i zwraca `true` jeżeli wszystkie elementy są poprawne lub `false`, jeżeli chociaż jeden element z grupy zwrócił błąd

<h2  id="wkcheckbox">WkCheckbox</h2>

[Powrót do spisu treści](#spis-tresci)

Komponent przycisku typu checkbox. Jeżeli pracuje w trybie `multiple`, wymaga podania propsa `name`, na podstawie którego jest automatycznie dołączany do odpowiedniej grupy. Reaguje wówczas np. na kliknięcie w inny checkbox z tej samej grupy.

<h3  id="wkcheckbox-propsy-twig">Dostępne propsy (Twig)</h3>

-   `defaultErrorMsg` **(string)** - domyślna wiadomość błędu, jaka ma zostać wyświetlona, gdy funkcja walidująca nie zwróci innego komunikatu
-   `id` **(string)** - ID elementu, musi być unikalne
-   `disabled` **(boolean)** - flaga decydująca o tym, czy input na start będzie wyłączony czy nie
-   `name` **(string)** - nazwa do przekazania do atrybutu HTML name inputa oraz jako nazwa grupy
-   `value` **(string|Number)** - wartość startowa inputa (każdy input z grupy powinien dostać na start taką samą wartość)
-   `trueValue` **(string|Number)** - wartość aktywna inputa (jeżeli value będzie równe tej wartości, to komponent jest uznawany za aktywny [checked])
-   `falseValue` **(string|Number)** - wartość nieaktywnego inputa (zwracana, gdy pole jest odznaczone, ma zastosowanie tylko w pracy pojedynczej inputa)
-   `multiple` **(Boolean)** - flaga decydująca o tym, czy input pracuje w trybie grupowym czy nie; nie ma możliwości zmiany trybu pracy po zainicjowaniu komponentu
-   `mode` **(String)** - button/switch - umożliwia zmianę trybu pracy komponentu na przycisk (ikonkę checkboxa) lub przełącznik - domyślnie button
-   `ignoreLabelClick` **(Boolean)** - zapobiega zmianie stanu podczas kliknięcia na element `label` (domyślnie `true` dla `mode: 'switch'`

<h3  id="wkcheckbox-sloty">Dostępne sloty (Twig)</h3>

-   `label` - pozwala na przekazanie kodu HTML, który ma zostać umieszczony jako label elementu `checkbox`
-   `hint` - pozwala na przekazanie kodu HTML, który ma zostać wyświetlony jako wskazówka dla elementu

<h3  id="wkcheckbox-propsy">Dostępne propsy</h3>

Propsy dostępne z poziomu skryptu umożliwiają odczyt, np.:
`window.wkInputs.id_1.value;`
oraz modyfikację, np.:
`window.wkInputs.id_1.value = 'Jan';`

Propsy komponentu WkTextField to:

-   `value` - wartość elementu
-   `disabled` - stan wyłączenia elementu
-   `valid` - stan walidacji elementu
-   `true_value` - wartość dla stanu `true`
-   `false_value` - wartość dla stanu `false`
-   `name` - nazwa elementu (unikalna dla grupy)
-   `ignore_label_click` - stan ignorowania kliknięć elementu `label`
-   `multiple` - flaga decydująca o pracy w trybie grupowym

<h3  id="wkcheckbox-metody">Metody zamontowanego obiektu</h3>

-   `validate()` - wykonuje zdefiniowane testy i zwraca Boolean, czy zawartość pola jest poprawna czy nie; pole zostanie też automatycznie ustawione w odpowiedni stan błędu
-   `resetValidation()` - pozwala na zresetowanie stanu błędu komponentu

<h3  id="wkcheckbox-metody-grupy">Metody grupy przycisków</h3>

Aby w łatwy sposób móc pobrać aktualną wartość `value` z całej grupy inputów checkbox bez konieczności sprawdzania stanu każdego z nich należy skorzystać z pomocniczego obiektu `__inputGroups` dostępnego pod obiektem `wkInputs`.

-   `getCheckboxGroupValue(group_name: String)` - zwraca aktualne wartości (**array**) `value` (wszystkich zaznaczonych checkboxów) z grupy o podanej w argumencie nazwie
-   `validateGroup(group_name: String)` - wykonuje walidację każdego elementu z grupy o nazwie przekazanej poprzez argument i zwraca `true` jeżeli wszystkie elementy są poprawne lub `false`, jeżeli chociaż jeden element z grupy zwrócił błąd

<h3  id="wkcheckbox-eventy">Emitowane zdarzenia</h3>

-   `change` - zmiana wartości

<h2  id="wkselect">WkSelect</h2>

[Powrót do spisu treści](#spis-tresci)

Komponent elementu select rozszerzonego o dodatkowe funkcjonalności.

<h3  id="wkselect-propsy-twig">Dostępne propsy (Twig)</h3>

-   `showAsterisk` **(boolean)** - decyduje o tym, czy pokazać na końcu elementu label czerwoną gwiazdkę
-   `defaultErrorMsg` **(string)** - domyślna wiadomość błędu, jaka ma zostać wyświetlona, gdy funkcja walidująca nie zwróci innego komunikatu
-   `id` **(string)** - ID elementu, musi być unikalne
-   `disabled` **(boolean)** - flaga decydująca o tym, czy select na start będzie wyłączony czy nie
-   `value` **(string|Number)** - wartość startowa selecta (jeśli nie jest pusta, powinna odpowiadać polu wartości jednego z elementów listy)
-   `placeholder` **(string)** - opcjonalny tekst wyświetlany, gdy nie jest wybrany żaden element (a więc tylko wówczas, gdy wartość startowa jest pusta
-   `prefix` **(string)** - stały tekst wyświetlany przed polem select
-   `suffix` **(string)** - stały tekst wyświetlany tuż za polem select
-   `itemText` **(string)** - niestandardowa nazwa parametru zawierającego widoczny tekst elementu listy
-   `itemValue` **(string)** - niestandardowa nazwa parametru zawierającego wartość elementu listy
-   `items` **(array)** - tablica obiektów odpowiadających elementom listy (nazwy pól tekstu oraz wartości powinny odpowiadać nazwom określonym w trzech powyższych parametrach).

Parametry elementów listy (o domyślnych nazwach):

-   `text` **(string|Number)** - tekst wyświetlany jako element listy
-   `value` **(string|Number)** - wartość elementu listy

Przykładowa lista elementów w elemencie select:

```twig
{% embed 'components/wk-select.twig' with {
    id: 'select',
    value: 'fr',
    itemText: 'text',
    itemValue: 'value',
    items: [
        {
            text: 'France',
            value: 'fr'
        },
        {
            text: 'United Kingdom',
            value: 'uk'
        },
        {
            text: 'Germany',
            value: 'ge'
        }
    ]
} only %}
    {% block label %}
        Wybierz państwo
    {% endblock %}
{% endembed %}
```

<h3  id="wkselect-sloty">Dostępne sloty (Twig)</h3>
 
-  `label` - pozwala na przekazanie kodu HTML, który ma zostać umieszczony jako label elementu `select`
-  `hint` - pozwala na przekazanie kodu HTML, który ma zostać wyświetlony jako wskazówka dla elementu
- 
<h3  id="wkselect-propsy">Dostępne propsy</h3>

Propsy dostępne z poziomu skryptu umożliwiają odczyt, np.:
`window.wkInputs.id_1.value;`
oraz modyfikację, np.:
`window.wkInputs.id_1.value = 'Jan';`

Propsy komponentu WkTextField to:

-   `value` - wartość elementu
-   `focused` - stan aktywności elementu
-   `disabled` - stan wyłączenia elementu
-   `valid` - stan walidacji elementu
-   `item_text` - niestandardowa nazwa pola z tekstem wyświetlanym w opcji
-   `item_value` - niestandardowa nazwa pola z wartością opcji
-   `items` - tablica dostępnych opcji

<h3  id="wkselect-metody">Metody zamontowanego obiektu</h3>

-   `validate()` - wykonuje zdefiniowane testy i zwraca Boolean, czy zawartość pola jest poprawna czy nie; pole zostanie też automatycznie ustawione w odpowiedni stan błędu
-   `resetValidation()` - pozwala na zresetowanie stanu błędu pola tekstowego

<h3  id="wkselect-eventy">Emitowane zdarzenia</h3>

-   `click` - kliknięcie w element
-   `focus` - 'skupienie' na elemencie
-   `blur` - przerwanie 'skupienia'
-   `change` - zmiana stanu (wartości)
-   `change` - zmiana wartości
