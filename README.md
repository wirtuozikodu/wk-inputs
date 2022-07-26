# WkInputs (Twig)
Wersja 1.0.0

Kolekcja interaktywnych komponentów formularza w formie komponentów Twig i w oparciu o czysty JavaScript.

## Spis treści

- [Informacje ogólne](#informacje-ogolne)
- [Walidacja](#walidacja)
- [Eventy](#eventy)
- [WkTextField](#wktextfield)
	- [Propsy](#wktextfield-propsy)
	- [Sloty](#wktextfield-sloty)
	- [Metody](#wktextfield-metody)
- [WkTextarea](#wktextarea)
	- [Propsy](#wktextarea-propsy)
	- [Sloty](#wktextarea-sloty)
	- [Metody](#wktextarea-metody)
- [WkRadio](#wkradio)
	- [Propsy](#wkradio-propsy)
	- [Sloty](#wkradio-sloty)
	- [Metody](#wkradio-metody)
	- [Metody grupy](#wkradio-metody-grupy)
- [WkCheckbox](#wkcheckbox)
	- [Propsy](#wkcheckbox-propsy)
	- [Sloty](#wkcheckbox-sloty)
	- [Metody](#wkcheckbox-metody)
	- [Metody grupy](#wkcheckbox-metody-grupy)
- [WkSelect](#wkselect)
	- [Propsy](#wkselect-propsy)
	- [Sloty](#wkselect-sloty)
	- [Metody](#wkselect-metody)

<h2 id="informacje-ogolne">Informacje ogólne</h2>

 1. Każdy komponent z kolekcji korzysta z uniwersalnego wrappera WkInput, w który zapewnia uniwersalny wrapper: ![](https://lh4.googleusercontent.com/xPQUvsQMHiT8UtatnQb5dNSKfCO4q62vifH-cwZLJK740_Hi7NhzvkTaeMYFGjjnuCVLmu31rKLp6AT5-EK8Dkx4ReS_AD10xkSeVBF3HNX7U8aZCXZX0-VXObPRkwFOJBToW03wkBePdNn0YIf7gg) 
W jego kompetencjach jest otrzymywanie reguł walidacji oraz walidowanie wartości danego komponentu-dziecka.
 2. Wszystkie inputy oraz obiekty pomocnicze rejestrowane są pod globalnym obiektem wkInputs umieszczonym w obiekcie window.
 3. Do obiektu wkInputs dodawane są także obiekty specjalne:
	 -  `__eventBus` - obiekt klasy *WkEventBus*, który pełni funkcję magistrali komunikacyjnej pomiędzy inputami, które pracują w grupie i muszą reagować na swoje wzajemne zmiany (np. radio button)
	 -  `__inputGroups` - obiekt klasy *WkInputGroups*, w którym rejestrowane są automatycznie wszystkie inputy pracujące w grupach. Pozwala on na łatwe pobieranie wartości inputa/inputów z danej grupy za jednym razem oraz udostępnia metody umożliwiające walidację całej grupy inputów.
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
 9. Informacje o dostępnych propsach, slotach i metodach wymienione są w dokumentacji poszczególnych komponentów.

<h2 id="walidacja">Walidacja</h2>
Każdy komponent posiada w swoim obiekcie zagnieżdżony obiekt WkInput, który zapewnia obsługę procesu walidacji zawartości komponentu. Obiekt zawsze jest dostępny pod kluczem:

`window.wkInputs.{INPUT_ID}.wkInput`

Walidacja bazuje na funkcjach walidujących (walidatorach), które w momencie wykonywania testów jako argument otrzymają aktualną wartość danego inputa. Ich zadaniem jest zwrócić wartość `true`, jeżeli wszystko jest w porządku i zawartość inputa jest poprawna. Każda wartość inna niż `true` będzie traktowana jako informacja o błędzie. Jeżeli zostanie zwrócony `string`, to zostanie on wykorzystany jako wiadomość o błędzie. Dzięki temu można zwracać różne wiadomości z różnych walidatorów. Jeżeli walidator nie zwróci własnej wiadomości o błędzie wyświetlona zostanie wiadomość domyślna (przekazana przez odpowiedni props) lub nie zostanie wyświetlona żadna wiadomość, jedynie input przejdzie w wizualny stan błędu.

Przykładowa funkcja walidująca:
```javascript
function(value) {
	if(!value || value.length == 0) return 'To pole jest wymagane';
	if(value.length > 31) return 'Wprowadź maksymalnie 31 znaków';
	if(!(/^[A-Za-z0-9_-]{1,31}$/).test(value)) return 'Nie spełniono wymagań';
	return true;
}
```

Do każdego inputa można przekazać wiele walidatorów, zostaną one każdorazowo wywołane w kolejności ich zarejestrowania. Jeżeli którykolwiek z walidatorów zwróci błąd, walidacja jest przerywana (kolejne walidatory nie zostaną wywołane).

Regułami walidacji można zarządzać poprzez wykorzystanie metod zagnieżdżonego komponentu *WkInput*, który zajmuje się logiką walidacji:  

 - `setRules(rules)` - umożliwia zdefiniowanie na nowo całej tablicy testów dla danego inputa; jako argument można przekazać funkcję anonimową lub tablicę funkcji
 - `addRule(rule)` - umożliwia dodanie kolejnej reguły do zestawu reguł danego inputa; jako argument należy podać funkcję anonimową
 - `clearRules()` - umożliwia usunięcie wszystkich walidatorów zdefiniowanych dla danego inputa
 
 Przykładowy sposób dodania reguły walidacji do inputa o ID user_name oraz sprawdzenia poprawności jego zawartości:
```javascript
wkInputs.user_name.wkInput.addRule(
	function(v){
		if(!v || v.length == 0) return 'Pole nie może być puste!';
		return true;
	}
);
wkInputs.user_name.validate(); // true/false
```

<h2 id="eventy">Eventy</h2>

Każdy z zamontowanych elementów rozgłasza właściwe sobie eventy wywoływane konkretnymi akcjami użytkownika. Możliwe jest przypisanie do nich funkcji metodą `.on(event, funkcja)`, alternatywnie `.once(event, funkcja)` - wówczas wykona się tylko raz.

Funkcja anonimowa może otrzymać argument (tutaj: `e`). Dostępne w nim są poniższe dane:

 - `e.input` - pierwotny element rozgłaszający (można za jego pomocą np. wywoływać jego metody)
 - `e.native_event` - standardowe szczegóły eventu (jak np. `keyCode`)

Na przykład:

```javascript
window.wkInputs.text_field.on('keydown', function(e){
	console.log(e.native_event.keyCode);
});
```

Listy eventów rozgłaszanych przez poszczególne elementy znajdują się w poświęconych im rozdziałach.

<h2 id="wktextfield">WkTextField</h2>
Komponent prostego pola tekstowego (text, password, number, itd.).

<h3 id="wktextfield-propsy">Dostępne propsy</h3>

 - `showAsterisk` **(boolean)** - decyduje o tym, czy pokazać na końcu elementu label czerwoną gwiazdkę
 - `defaultErrorMsg` **(string)** - domyślna wiadomość błędu, jaka ma zostać wyświetlona, gdy funkcja walidująca nie zwróci innego komunikatu
 - `counterValue` **(Integer)** - wartość licznika limitu znaków. Sam licznik nie zapewnia żadnej walidacji, informuje tylko o liczbie znaków w wartości inputa
 - `id` **(string)** - ID elementu, musi być unikalne
 - `type` **(string)** - typ inputa, jeden z typów elementu `<input>` w HTML
 - `disabled` **(boolean)** - flaga decydująca o tym, czy input na start będzie wyłączony czy nie
 - `name` **(string)** - nazwa do przekazania do atrybutu HTML name inputa
 - `value` **(string)** - zawartość startowa inputa
 - `placeholder` **(string)** - opcjonalny tekst wyświetlany, gdy input jest pusty
 - `prefix` **(string)** - stały tekst wyświetlany tuż przed polem tekstowym
 - `suffix` **(string)** - stały tekst wyświetlany tuż za polem tekstowym
 
 <h3 id="wktextfield-sloty">Dostępne sloty</h3>
 
 - `label` - pozwala na przekazanie kodu HTML, który ma zostać umieszczony jako label pola tekstowego
 - `prepend` - pozwala na przekazanie kodu HTML, który ma zostać wyświetlony przed polem tekstowym (i przed prefiksem)
 - `append` - pozwala na przekazanie kodu HTML, który ma zostać wyświetlony za polem tekstowym (i za suffixem)
 - `hint` - pozwala na przekazanie kodu HTML, który ma zostać wyświetlony jako wskazówka do wypełnienia pola tekstowego; wskazówka jest wyświetlana, gdy input nie jest w stanie błędu

Wszystkie metody obiektu zamontowanego dostępne są pod `window.wkInputs.{ID}`.

<h3 id="wktextfield-metody">Metody zamontowanego obiektu</h3>

 - `getValue()` - pozwala na pobranie aktualnej zawartości pola
 - `setValue(value)` - pozwala na programistyczne ustawienie wartości pola na przekazaną w argumencie funkcji
 - `getFocus()` - pozwala na pobranie informacji, czy pole jest aktualnie aktywne (zwraca Boolean)
 - `setFocus(state: Boolean)` - pozwala na zmianę stanu aktywności na wartość przekazaną w argumencie
 - `getDisabled()` - pozwala na pobranie informacji, czy pole jest wyłączone (zwraca Boolean)
 - `setDisabled(state : Boolean)` - pozwala na wyłączenie lub włączenie pola tekstowego
 - `validate()` - wykonuje zdefiniowane testy i zwraca Boolean, czy zawartość pola jest poprawna czy nie; pole zostanie też automatycznie ustawione w odpowiedni stan błędu
 - `resetValidation()` - pozwala na zresetowanie stanu błędu pola tekstowego
 - `on(event, funkcja)` - pozwala na przechwytywanie eventów rozgłaszanych przez element, tj:
	 - `click` - kliknięcie w element
	 - `focus` - 'skupienie' na elemencie
	 - `blur` - przerwanie 'skupienia'
	 - `keydown` - klawisz wciśnięty
	 - `keyup` - klawisz puszczony
	 - `input` - zmieniona wartość
 
 <h2 id="wktextfield">WkTextarea</h2>
Komponent pola na dłuższy tekst (textarea). Działa analogicznie do WkTextField (z kilkoma dodatkowymi funkcjonalnościami).

<h3 id="wktextarea-propsy">Dostępne propsy</h3>

 - `showAsterisk` **(boolean)** - decyduje o tym, czy pokazać na końcu elementu label czerwoną gwiazdkę
 - `defaultErrorMsg` **(string)** - domyślna wiadomość błędu, jaka ma zostać wyświetlona, gdy funkcja walidująca nie zwróci innego komunikatu
 - `counterValue` **(Integer)** - wartość licznika limitu znaków. Sam licznik nie zapewnia żadnej walidacji, informuje tylko o liczbie znaków w wartości pola tekstowego
 - `id` **(string)** - ID elementu, musi być unikalne
 - `disabled` **(boolean)** - flaga decydująca o tym, czy pole tekstowe na start będzie wyłączone czy nie
 - `name` **(string)** - nazwa do przekazania do atrybutu HTML name inputa
 - `value` **(string)** - zawartość startowa pola tekstowego
 - `placeholder` **(string)** - opcjonalny tekst wyświetlany, gdy pole tekstowe jest puste
 - `prefix` **(string)** - stały tekst wyświetlany tuż przed polem tekstowym
 - `suffix` **(string)** - stały tekst wyświetlany tuż za polem tekstowym
 - `rows` **(Integer)** - liczba wierszy, na którą wysokie ma być pole tekstowe (w trybie `autogrow` jest to maksymalna liczba wierszy, na jaką pole może się rozszerzyć, zanim włączy się scroll)
 - `autogrow` **(boolean)** - flaga decydująca o tym, czy pole pracuje w trybie sztywno ustawionej wysokości (ilości wierszy) czy w trybie dynamicznego rozszerzania w zależności od objętości tekstu

<h3 id="wktextarea-sloty">Dostępne sloty</h3>

 - `label` - pozwala na przekazanie kodu HTML, który ma zostać umieszczony jako label pola tekstowego
 - `prepend` - pozwala na przekazanie kodu HTML, który ma zostać wyświetlony przed polem tekstowym (i przed prefiksem)
 - `append` - pozwala na przekazanie kodu HTML, który ma zostać wyświetlony za polem tekstowym (i za suffixem)
 - `hint` - pozwala na przekazanie kodu HTML, który ma zostać wyświetlony jako wskazówka do wypełnienia pola tekstowego; wskazówka jest wyświetlana, gdy pole tekstowe nie jest w stanie błędu

Wszystkie metody obiektu zamontowanego dostępne są pod `window.wkInputs.{ID}`.

<h3 id="wktextarea-metody">Metody zamontowanego obiektu</h3>

 - `getValue()` - pozwala na pobranie aktualnej zawartości pola
 - `setValue(value)` - pozwala na programistyczne ustawienie wartości pola na przekazaną w argumencie funkcji
 - `getFocus()` - pozwala na pobranie informacji, czy pole jest aktualnie aktywne (zwraca Boolean)
 - `setFocus(state: Boolean)` - pozwala na zmianę stanu aktywności na wartość przekazaną w argumencie
 - `getDisabled()` - pozwala na pobranie informacji, czy pole jest wyłączone (zwraca Boolean)
 - `setDisabled(state : Boolean)` - pozwala na wyłączenie lub włączenie pola tekstowego
 - `getAutogrow()` - pozwala na pobranie informacji, czy pole pracuje w trybie autogrow (zwraca Boolean)
 - `setAutogrow(state: Boolean)` - pozwala na zmianę trybu pracy pola tekstowego
 - `validate()` - wykonuje zdefiniowane testy i zwraca Boolean, czy zawartość pola jest poprawna czy nie; pole zostanie też automatycznie ustawione w odpowiedni stan błędu
 - `resetValidation()` - pozwala na zresetowanie stanu błędu pola tekstowego
 - `on(event, funkcja)` - pozwala na przechwytywanie eventów rozgłaszanych przez element, tj:
	 - `click` - kliknięcie w element
	 - `focus` - 'skupienie' na elemencie
	 - `blur` - przerwanie 'skupienia'
	 - `keydown` - klawisz wciśnięty
	 - `keyup` - klawisz puszczony
	 - `input` - zmieniona wartość

<h2 id="wkradio">WkRadio</h2>

Komponent przycisku typu radio. Wszystkie przyciski w danej grupie powinny posiadać identyczną wartość parametru `name`, dzięki temu będą reagowały ze sobą w odpowiedni sposób. W momencie zmiany stanu dowolnego przycisku z grupy wykonywana jest walidacja na każdym jej elemencie.

<h3 id="wkradio-propsy">Dostępne propsy</h3>

 - `defaultErrorMsg` **(string)** - domyślna wiadomość błędu, jaka ma zostać
   wyświetlona, gdy funkcja walidująca nie zwróci innego komunikatu
 - `id` **(string)** - ID elementu, musi być unikalne
 - `disabled` **(boolean)** - flaga decydująca o tym, czy input na start będzie wyłączony czy nie
 - `name` **(string)** - nazwa do przekazania do atrybutu HTML name inputa oraz jako nazwa grupy
 - `value` **(string|Number)** - wartość startowa grupy inputów (powinna być identyczna dla każdego z jej elementów)
 - `trueValue` **(string|Number)** - wartość aktywna konkretnego inputa (jeżeli `value` będzie równe tej wartości, to komponent jest uznawany za aktywny [checked])

<h3 id="wkradio-sloty">Dostępne sloty</h3>

 - `label` - pozwala na przekazanie kodu HTML, który ma zostać umieszczony jako label elementu `radio`
 - `hint` - pozwala na przekazanie kodu HTML, który ma zostać wyświetlony jako wskazówka dla elementu

<h3 id="wkradio-metody">Metody zamontowanego obiektu</h3>

 - `isSelected()` - pozwala na pobranie informacji (Boolean) czy input jest zaznaczony, czy nie (czyli czy `trueValue` zgadza się z aktualnym `value` grupy inputa)
 - `setValue(value)` - pozwala na programistyczne ustawienie wartości pola (a więc i całej jego grupy) na przekazaną w argumencie funkcji
 - `getDisabled()` - pozwala na pobranie informacji, czy pole jest wyłączone (zwraca Boolean)
 - `setDisabled(state : Boolean)` - pozwala na wyłączenie lub włączenie komponentu
 - `validate()` - wykonuje zdefiniowane testy i zwraca Boolean, czy zawartość pola jest poprawna czy nie; pole zostanie też automatycznie ustawione w odpowiedni stan błędu
 - `resetValidation()` - pozwala na zresetowanie stanu błędu komponentu
 - `on(event, funkcja)` - pozwala na przechwytywanie eventów rozgłaszanych przez element, tj:
 	 - `change` - zmiana stanu

<h3 id="wkradio-metody-grupy">Metody grupy przycisków</h3>

Aby w łatwy sposób móc pobrać aktualną wartość `value` z całej grupy inputów radio bez konieczności sprawdzania stanu każdego z nich należy skorzystać z pomocniczego obiektu `__inputGroups` dostępnego pod obiektem `wkInputs`. 

 - `getRadioGroupValue(group_name: String)` - zwraca aktualną wartość `value` (zaznaczonego buttona radio) z grupy o podanej w argumencie nazwie
 - `validateGroup(group_name: String)` - wykonuje walidację każdego elementu z grupy o nazwie przekazanej poprzez argument i zwraca `true` jeżeli wszystkie elementy są poprawne lub `false`, jeżeli chociaż jeden element z grupy zwrócił błąd

<h2 id="wkcheckbox">WkCheckbox</h2>

Komponent przycisku typu checkbox. Jeżeli pracuje w trybie `multiple`, wymaga podania propsa `name`, na podstawie którego jest automatycznie dołączany do odpowiedniej grupy. Reaguje wówczas np. na kliknięcie w inny checkbox z tej samej grupy.

<h3 id="wkcheckbox-propsy">Dostępne propsy</h3>

 - `defaultErrorMsg` **(string)** - domyślna wiadomość błędu, jaka ma zostać wyświetlona, gdy funkcja walidująca nie zwróci innego komunikatu
 - `id` **(string)** - ID elementu, musi być unikalne
 - `disabled` **(boolean)** - flaga decydująca o tym, czy input na start będzie wyłączony czy nie
 - `name` **(string)** - nazwa do przekazania do atrybutu HTML name inputa oraz jako nazwa grupy
 - `value` **(string|Number)** - wartość startowa inputa (każdy input z grupy powinien dostać na start taką samą wartość)
 - `trueValue` **(string|Number)** - wartość aktywna inputa (jeżeli value będzie równe tej wartości, to komponent jest uznawany za aktywny [checked])
 - `falseValue` **(string|Number)** - wartość nieaktywnego inputa (zwracana, gdy pole jest odznaczone, ma zastosowanie tylko w pracy pojedynczej inputa)
 - `multiple` **(Boolean)** - flaga decydująca o tym, czy input pracuje w trybie grupowym czy nie; nie ma możliwości zmiany trybu pracy po zainicjowaniu komponentu

<h3 id="wkcheckbox-sloty">Dostępne sloty</h3>

 - `label` - pozwala na przekazanie kodu HTML, który ma zostać umieszczony jako label elementu `checkbox`
 - `hint` - pozwala na przekazanie kodu HTML, który ma zostać wyświetlony jako wskazówka dla elementu

<h3 id="wkcheckbox-metody">Metody zamontowanego obiektu</h3>

 - `isSelected()` - pozwala na pobranie informacji (Boolean) czy input jest zaznaczony, czy nie (czyli czy `trueValue` zgadza się z aktualnym `value` grupy inputa)
 - `setValue(value)` - pozwala na programistyczne ustawienie wartości pola (a więc i całej jego grupy) na przekazaną w argumencie funkcji
 - `getDisabled()` - pozwala na pobranie informacji, czy pole jest wyłączone (zwraca Boolean)
 - `setDisabled(state : Boolean)` - pozwala na wyłączenie lub włączenie komponentu
 - `validate()` - wykonuje zdefiniowane testy i zwraca Boolean, czy zawartość pola jest poprawna czy nie; pole zostanie też automatycznie ustawione w odpowiedni stan błędu
 - `resetValidation()` - pozwala na zresetowanie stanu błędu komponentu
 - `on(event, funkcja)` - pozwala na przechwytywanie eventów rozgłaszanych przez element, tj:
 	 - `change` - zmiana stanu (wartości)

<h3 id="wkcheckbox-metody-grupy">Metody grupy przycisków</h3>

Aby w łatwy sposób móc pobrać aktualną wartość `value` z całej grupy inputów checkbox bez konieczności sprawdzania stanu każdego z nich należy skorzystać z pomocniczego obiektu `__inputGroups` dostępnego pod obiektem `wkInputs`. 

 - `getRadioGroupValue(group_name: String)` - zwraca aktualne wartości (**array**) `value` (wszystkich zaznaczonych checkboxów) z grupy o podanej w argumencie nazwie
 - `validateGroup(group_name: String)` - wykonuje walidację każdego elementu z grupy o nazwie przekazanej poprzez argument i zwraca `true` jeżeli wszystkie elementy są poprawne lub `false`, jeżeli chociaż jeden element z grupy zwrócił błąd

<h2 id="wkselect">WkSelect</h2>

Komponent elementu select rozszerzonego o dodatkowe funkcjonalności.

<h3 id="wkselect-propsy">Dostępne propsy</h3>

- `showAsterisk` **(boolean)** - decyduje o tym, czy pokazać na końcu elementu label czerwoną gwiazdkę
- `defaultErrorMsg` **(string)** - domyślna wiadomość błędu, jaka ma zostać wyświetlona, gdy funkcja walidująca nie zwróci innego komunikatu
- `id` **(string)** - ID elementu, musi być unikalne
- `disabled` **(boolean)** - flaga decydująca o tym, czy select na start będzie wyłączony czy nie
- `value` **(string|Number)** - wartość startowa selecta (jeśli nie jest pusta, powinna odpowiadać polu wartości jednego z elementów listy)
- `placeholder` **(string)** - opcjonalny tekst wyświetlany, gdy nie jest wybrany żaden element (a więc tylko wówczas, gdy wartość startowa jest pusta
-  `prefix` **(string)** - stały tekst wyświetlany przed polem select
-  `suffix` **(string)** - stały tekst wyświetlany tuż za polem select
- `itemText` **(string)** - niestandardowa nazwa parametru zawierającego widoczny tekst elementu listy
- `itemValue` **(string)** - niestandardowa nazwa parametru zawierającego wartość elementu listy
- `items` **(array)** - tablica obiektów odpowiadających elementom listy (nazwy pól tekstu, wartości oraz stanu wyłączenia powinny odpowiadać nazwom określonym w trzech powyższych parametrach).

Parametry elementów listy (o domyślnych nazwach):

- `text` **(string|Number)** - tekst wyświetlany jako element listy
- `value` **(string|Number)** - wartość elementu listy

Przykładowa lista elementów w elemencie select:

```twig
{% embed  'components/wk-select.twig' with {
	id: 'select',
	value: 'fr',
	itemText: 'text',
	itemValue: 'value',
	itemDisabled: 'disabled'
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
	{% block  label %}
		Wybierz państwo
	{% endblock %}
{% endembed %}
```

<h3 id="wkselect-sloty">Dostępne sloty</h3>

 - `label` - pozwala na przekazanie kodu HTML, który ma zostać umieszczony jako label elementu `select`
 - `hint` - pozwala na przekazanie kodu HTML, który ma zostać wyświetlony jako wskazówka dla elementu

<h3 id="wkselect-metody">Metody zamontowanego obiektu</h3>

 - `getValue()` - pozwala na pobranie aktualnej zawartości pola
 - `setValue(value)` - pozwala na programistyczne ustawienie wartości pola na przekazaną w argumencie funkcji
 - `getFocus()` - pozwala na pobranie informacji, czy select jest aktualnie aktywny (zwraca Boolean)
 - `setFocus(state: Boolean)` - pozwala na zmianę stanu aktywności na wartość przekazaną w argumencie
 - `getDisabled()` - pozwala na pobranie informacji, czy select jest wyłączony (zwraca Boolean)
 - `setDisabled(state : Boolean)` - pozwala na wyłączenie lub włączenie selecta
 - `openItemsList()` - otwiera rozwijaną listę elementów
 - `closeItemsList()` - zamyka rozwijaną listę elementów
 - `toggleItemsList()` - otwiera/zamyka rozwijaną listę elementów
 - `validate()` - wykonuje zdefiniowane testy i zwraca Boolean, czy zawartość pola jest poprawna czy nie; pole zostanie też automatycznie ustawione w odpowiedni stan błędu
 - `resetValidation()` - pozwala na zresetowanie stanu błędu pola tekstowego
 - `on(event, funkcja)` - pozwala na przechwytywanie eventów rozgłaszanych przez element, tj:
	 - `click` - kliknięcie w element
	 - `focus` - 'skupienie' na elemencie
	 - `blur` - przerwanie 'skupienia'
	 - `change` - zmiana stanu (wartości)