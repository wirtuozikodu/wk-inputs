# WkInputs (Twig)
Wersja 1.0.0

Kolekcja interaktywnych komponentów formularza w formie komponentów Twig i w oparciu o czysty JavaScript.

## Spis treści

- [Informacje ogólne](#informacje-ogolne)
- [Walidacja](#walidacja)
- [WkTextField](#wktextfield)
	- [Propsy](#wktextfield-propsy)
	- [Sloty](#wktextfield-sloty)
	- [Metody](#wktextfield-metody)

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
 8. Z poziomu Twig każdy komponent wstawiamy jako `embed`, do którego można przekazać dane w formie propsów (`with {} only`) oraz w formie slotów (elementy `{% block %}`), na przykład: **![](https://lh4.googleusercontent.com/8LOJXhVgOr0pqbqwHd5gA6kRcKXxYZ-yXqp9_aX4Bw2KvzoUvyocxi4CspZCcVovQWU5YLzENHCy-V9KCBn5rAB9cRf5Pc2myjp0jJpS3P0XCQ5OKArYxyoa6NnlYki79isSrdKRteTO4cT7A-khPw)**
 9. Informacje o dostępnych propsach, slotach i metodach wymienione są w dokumentacji poszczególnych komponentów.

<h2 id="walidacja">Walidacja</h2>
Każdy komponent posiada w swoim obiekcie zagnieżdżony obiekt WkInput, który zapewnia obsługę procesu walidacji zawartości komponentu. Obiekt zawsze jest dostępny pod kluczem:

`window.wkInputs.{INPUT_ID}.wkInput`

Walidacja bazuje na funkcjach walidujących (walidatorach), które w momencie wykonywania testów jako argument otrzymają aktualną wartość danego inputa. Ich zadaniem jest zwrócić wartość `true`, jeżeli wszystko jest w porządku i zawartość inputa jest poprawna. Każda wartość inna niż `true` będzie traktowana jako informacja o błędzie. Jeżeli zostanie zwrócony `string`, to zostanie on wykorzystany jako wiadomość o błędzie. Dzięki temu można zwracać różne wiadomości z różnych walidatorów. Jeżeli walidator nie zwróci własnej wiadomości o błędzie wyświetlona zostanie wiadomość domyślna (przekazana przez odpowiedni props) lub nie zostanie wyświetlona żadna wiadomość, jedynie input przejdzie w wizualny stan błędu.

Przykładowa funkcja walidująca:  **![](https://lh6.googleusercontent.com/0G4MAp1Oq4HcbgHv9gKzUAkz8YDVYSP6tSwSZpSPfdQ_T1Wu6GRgM0pBUnI72FSSbJtNAUXeogcrroU75j57hcrj1gWFZFh6M2kySTFIF3cA_HpgRJTXfDDt4D7mq_TaZtEq71cCuvQvy41m8iJB5Q)**

Do każdego inputa można przekazać wiele walidatorów, zostaną one każdorazowo wywołane w kolejności ich zarejestrowania. Jeżeli którykolwiek z walidatorów zwróci błąd, walidacja jest przerywana (kolejne walidatory nie zostaną wywołane).

Regułami walidacji można zarządzać poprzez wykorzystanie metod zagnieżdżonego komponentu *WkInput*, który zajmuje się logiką walidacji:  

 - `setRules(rules)` - umożliwia zdefiniowanie na nowo całej tablicy testów dla danego inputa; jako argument można przekazać funkcję anonimową lub tablicę funkcji
 - `addRule(rule)` - umożliwia dodanie kolejnej reguły do zestawu reguł danego inputa; jako argument należy podać funkcję anonimową
 - `clearRules()` - umożliwia usunięcie wszystkich walidatorów zdefiniowanych dla danego inputa

<h2 id="wktextfield">WkTextField</h2>
