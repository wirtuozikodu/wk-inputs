"use strict";

window.wkInputs = window.wkInputs || {};

window.wkInputs.__loadScript = function (src, opts) {
    if (!opts) opts = {};

    const s = document.createElement("script");
    s.src = src;

    if (opts.async === true) {
        s.setAttribute("async", "async");
    }
    if (opts.defer === true) {
        s.setAttribute("defer", "defer");
    }
    if (opts.nomodule === true) {
        s.setAttribute("nomodule", "nomodule");
    }
    if (opts.type !== undefined) {
        s.setAttribute("type", opts.type);
    }

    document.head.appendChild(s);
};
window.wkInputs.__loadScript("https://unpkg.com/@popperjs/core@2");

// Klasa WkInputsEventBus pozwala na utworzenie warstwy emitowania i subskrybowania własnych zdarzeń pomiędzy elementami
class WkInputsEventBus {
    constructor() {
        this._events = {};
    }

    registerEvent(event_name, handler, t) {
        if (this._events[event_name] == undefined) this._events[event_name] = [];
        this._events[event_name].push({
            t: t,
            f: handler
        });
    }

    on(event_name, handler) {
        this.registerEvent(event_name, handler, "on");
    }
    once(event_name, handler) {
        this.registerEvent(event_name, handler, "once");
    }
    off(event_name, handler) {
        if (this._events[event_name] == undefined) return;
        var ix = -1;
        var hts = handler.toString();
        for (var i = 0; i < this._events[event_name].length; i++) {
            if (hts == this._events[event_name][i].f.toString()) {
                ix = i;
                break;
            }
        }
        if (ix !== -1) this._events[event_name].splice(ix, 1);
    }

    emit(event_name, payload) {
        if (this._events[event_name] == undefined) return;
        var todel = [];
        for (var i = 0; i < this._events[event_name].length; i++) {
            this._events[event_name][i].f(payload);
            if (this._events[event_name][i].t == "once") {
                todel.push(i);
            }
        }
        for (var i = todel.length - 1; i >= 0; i--) {
            this._events[event_name].splice(todel[i], 1);
        }
    }
}
// domyślnie inicjalizowany jest globalny EventBus
window.wkInputs.__eventBus = new WkInputsEventBus();

// Klasa WkInputGroups dostarcza warstwę metod pomocniczych dla inputów łączonych w grupy
class WkInputGroups extends WkInputsEventBus {
    constructor() {
        super();
        this.groups = {};
    }

    register(name, wkInput) {
        if (this.groups[name] == undefined) this.groups[name] = [];
        this.groups[name].push(wkInput);
    }
    unregister(name, input_id) {
        if (this.groups[name] == undefined) return;
        const ix = this.groups[name].findIndex(c => c.id == input_id);
        if (ix !== -1) {
            this.groups[name].splice(ix, 1);
        }
    }

    getRadioGroupValue(group_name) {
        if (this.groups[group_name] == undefined) return null;
        for (var i = 0; i < this.groups[group_name].length; i++) {
            if (this.groups[group_name][i].selected) {
                return this.groups[group_name][i].value;
            }
        }
        return null;
    }

    getCheckboxGroupValue(group_name) {
        if (this.groups[group_name] == undefined) return null;
        var v = [];
        for (var i = 0; i < this.groups[group_name].length; i++) {
            if (
                this.groups[group_name][i].selected &&
                this.groups[group_name][i].multiple === true
            ) {
                v.push(this.groups[group_name][i].value);
            }
        }
        return v;
    }

    validateGroup(group_name) {
        if (this.groups[group_name] == undefined) return null;
        var any_error = false;
        for (var i = 0; i < this.groups[group_name].length; i++) {
            var v = this.groups[group_name][i].validate();
            if (v !== true) any_error = true;
        }
        return any_error;
    }
}
// domyślnie inicjalizowany jest pojedynczy handler globalny dla grup
window.wkInputs.__inputGroups = new WkInputGroups();

// Klasa WkInput to ogólny wrapper dla każdego rodzaju pola formularza - zapewnia ogólne funkcjonalności, które później powinny być rozszerzane przez poszczególne elementy według ich potrzeb
class WkInput extends WkInputsEventBus {
    constructor(opts) {
        super(); // inicjalizacja konstruktora WkInputsEventBus

        // base setup
        this._id = opts.id;
        this._wk_input = document.querySelector('.wk-input[data-inputid="' + this._id + '"]');
        this._inited = false;

        this._rules = [];
        this._value = opts.value || "";
        this._valid = null;

        this._counter_value = 0;
        this._hint = "";
        this._default_error_message = "";
        this._error_message = "";

        // elementy zależne
        this._counter_el = document.querySelector(
            '.wk-input__countervalue[data-input="' + this._id + '"]'
        );
        this._hint_el = document.querySelector(
            '.wk-input__message.wk-input__hint[data-input="' + this._id + '"]'
        );
        if (this._hint_el) {
            this._hint = this._hint_el.innerText;
        }
        this._errormsg_el = document.querySelector(
            '.wk-input__message.wk-input__errormsg[data-input="' + this._id + '"]'
        );
        if (this._errormsg_el) {
            this._default_error_message = this._errormsg_el.innerText;
        }

        // mounting
        this.hideErrorMessage();
    }

    // getters
    get wk_input() {
        return this._wk_input;
    }
    get id() {
        return this._id;
    }
    get value() {
        return this._value;
    }
    get valid() {
        return this._valid;
    }
    get counter() {
        return this._counter_value;
    }
    get error_message() {
        return this._error_message;
    }
    get default_error_message() {
        return this._default_error_message;
    }
    get hint() {
        return this._hint;
    }
    get inited() {
        return this._inited;
    }

    // setters
    set counter(v) {
        this._counter_value = v;
        if (this._counter_el) {
            this._counter_el.innerText = v;
        }
    }
    set value(v) {
        this._value = v;
        this.counter = v.length;
        this.validate();
    }
    set valid(v) {
        this._valid = v;
    }
    set error_message(str) {
        this._error_message = str;
        if (this._errormsg_el) {
            this._errormsg_el.innerText = str;
        }
    }
    set default_error_message(str) {
        this._default_error_message = str;
    }
    set hint(str) {
        this._hint = str;
        if (this._hint_el) {
            this._hint_el.innerText = this._hint;
        }
    }

    // zarządzanie regułami walidacji
    setRules(rules) {
        if (!Array.isArray(rules)) rules = [rules];
        if (rules.findIndex(r => typeof r != "function") !== -1) {
            throw new Error("Each validation rule must be a function");
        }
        this._rules = rules;
    }
    addRule(rule) {
        if (typeof rule != "function") throw new Error("Validation rule must be a function");
        this._rules.push(rule);
    }
    clearRules() {
        this._rules = [];
    }

    // walidacja inputa
    validate() {
        let valid = true;
        let msg = "";

        for (var i = 0; i < this._rules.length; i++) {
            if (typeof this._rules[i] != "function") continue;
            var r = this._rules[i](this.value);
            if (r !== true) {
                valid = false;
                if (typeof r === "string") msg = r;
                break;
            }
        }

        if (valid) {
            this.hideErrorMessage();
            this.showHint();
        } else {
            this.hideHint();
            if (msg != "") this.error_message = msg;
            else this.error_message = this.default_error_message;
            this.showErrorMessage();
        }

        this.valid = valid;
        return valid;
    }
    resetValidation() {
        this.hideErrorMessage();
        this.showHint();
        this.valid = null;
    }

    // toggle widoczności wskazówki
    showHint() {
        if (this.hint.length == 0 || !this._hint_el) return;
        this._hint_el.style.display = "block";
    }
    hideHint() {
        if (!this._hint_el) return;
        this._hint_el.style.display = "none";
    }

    // toggle widoczności komunikatu błędu pod inputem
    showErrorMessage() {
        if (!this._errormsg_el) return;
        this._errormsg_el.style.display = "block";
    }
    hideErrorMessage() {
        if (!this._errormsg_el) return;
        this._errormsg_el.style.display = "none";
    }
}

// Klasa zwykłego pola tekstowego
class WkTextField extends WkInput {
    constructor(opts) {
        super({ id: opts.el.id });

        // base setup
        this._el = opts.el;

        // zbieranie wszystkich elementów HTML, na których będą wykonywane operacje
        this._main_wrapper_el = document.querySelector(
            '.wk-text-field[data-inputid="' + this._id + '"]'
        );
        this._tfield_el = document.querySelector(
            '.wk-text-field__tfield[data-inputid="' + this._id + '"]'
        );
        this._placeholder_el = document.querySelector(
            '.wk-text-field__placeholder[data-inputid="' + this._id + '"]'
        );
        this._prepend_el = document.querySelector(
            '.wk-text-field__prepend[data-inputid="' + this._id + '"]'
        );
        this._append_el = document.querySelector(
            '.wk-text-field__append[data-inputid="' + this._id + '"]'
        );

        // inner state
        this._focused = false;
        this._disabled = !!(this._el.getAttribute("disabled") !== null);

        // eventy wewnętrzne
        this._main_wrapper_el.addEventListener("click", ev => {
            this.el.focus();
            this.emit("click", {
                element: this,
                native_event: ev
            });
        });
        this.el.addEventListener("focus", ev => {
            this.focused = true;
            this.emit("focus", {
                element: this,
                native_event: ev
            });
        });
        this.el.addEventListener("blur", ev => {
            this.focused = false;
            this.emit("blur", {
                element: this,
                native_event: ev
            });
        });
        this.el.addEventListener("input", ev => {
            this.value = ev.target.value;
            this.emit("input", {
                element: this,
                native_event: ev
            });
        });
        this.el.addEventListener("keydown", ev => {
            this.emit("keydown", {
                element: this,
                native_event: ev
            });
        });
        this.el.addEventListener("keyup", ev => {
            this.emit("keyup", {
                element: this,
                native_event: ev
            });
        });
        this.el.addEventListener("keypressed", ev => {
            this.emit("keypressed", {
                element: this,
                native_event: ev
            });
        });
        if (this._prepend_el) {
            this._prepend_el.addEventListener("click", ev => {
                ev.stopPropagation();
                ev.preventDefault();

                this.emit("click:prepend", {
                    element: this,
                    native_event: ev
                });
            });
        }
        if (this._append_el) {
            this._append_el.addEventListener("click", ev => {
                ev.stopPropagation();
                ev.preventDefault();

                this.emit("click:append", {
                    element: this,
                    native_event: ev
                });
            });
        }

        // mounting
        this._value = this._el.value;
        if (this._value.length > 0) {
            this.hidePlaceholder();
        }
        this._inited = true;
    }

    // gettery
    get el() {
        return this._el;
    }
    get main_wrapper_el() {
        return this._main_wrapper_el;
    }
    get tfield_el() {
        return this._tfield_el;
    }
    get placeholder_el() {
        return this._placeholder_el;
    }
    get prepend_el() {
        return this._prepend_el;
    }
    get append_el() {
        return this._append_el;
    }
    get value() {
        return this._value;
    }
    get focused() {
        return this._focused;
    }
    get disabled() {
        return this._disabled;
    }
    get valid() {
        return this._valid;
    }

    // settery
    set value(v) {
        this._value = v;
        this.counter = v.length;
        this.validate();
        this.el.value = v;

        if (v.length === 0) {
            this.showPlaceholder();
        } else {
            this.hidePlaceholder();
        }
    }
    set focused(state) {
        if (state !== true) state = false;
        if (state === this.focused) return;
        this._focused = state;
        if (this._focused) {
            this._main_wrapper_el.classList.add("wk-text-field--focused");
            this.hidePlaceholder();
            this.el.focus();
        } else {
            this._main_wrapper_el.classList.remove("wk-text-field--focused");
            if (this.value.length === 0) {
                this.showPlaceholder();
            }
        }
    }
    set disabled(state) {
        if (state !== true) state = false;
        if (state === this.disabled) return;
        this._disabled = state;
        if (state) {
            this.focused = false;
            this._main_wrapper_el.classList.add("wk-text-field--disabled");
            this.el.setAttribute("disabled", true);
        } else {
            this._main_wrapper_el.classList.remove("wk-text-field--disabled");
            this.el.removeAttribute("disabled");
        }
    }
    set valid(state) {
        if (state !== true && state !== null) state = false;
        if (state === this.valid) return;
        this._valid = state;
        if (state === false) {
            this._main_wrapper_el.classList.add("wk-text-field--invalid");
        } else {
            this._main_wrapper_el.classList.remove("wk-text-field--invalid");
            this.hideErrorMessage();
            this.showHint();
        }
    }

    // toggle widoczności placeholdera
    showPlaceholder() {
        this._placeholder_el.style.display = "block";
    }
    hidePlaceholder() {
        this._placeholder_el.style.display = "none";
    }
}

// Klasa pola tekstowego (textarea)
class WkTextarea extends WkInput {
    constructor(opts) {
        super({ id: opts.el.id });

        // base setup
        this._el = opts.el;

        // zbieranie wszystkich elementów HTML, na których będą wykonywane operacje
        this._main_wrapper_el = document.querySelector(
            '.wk-textarea[data-inputid="' + this._id + '"]'
        );
        this._tfield_el = document.querySelector(
            '.wk-textarea__tfield[data-inputid="' + this._id + '"]'
        );
        this._placeholder_el = document.querySelector(
            '.wk-textarea__placeholder[data-inputid="' + this._id + '"]'
        );
        this._prepend_el = document.querySelector(
            '.wk-textarea__prepend[data-inputid="' + this._id + '"]'
        );
        this._append_el = document.querySelector(
            '.wk-textarea__append[data-inputid="' + this._id + '"]'
        );

        // inner state
        this._focused = false;
        this._disabled = !!(this._el.getAttribute("disabled") !== null);

        this._rows = this._el.getAttribute("rows") ? parseInt(this._el.getAttribute("rows")) : null;
        this._autogrow = this._el.getAttribute("data-autogrow") === "true" ? true : false;
        this._row_height = parseInt(window.getComputedStyle(this._el).lineHeight);

        // eventy wewnętrzne
        this._main_wrapper_el.addEventListener("click", ev => {
            this.el.focus();
            this.emit("click", {
                element: this,
                native_event: ev
            });
        });
        this.el.addEventListener("focus", ev => {
            this.focused = true;
            this.emit("focus", {
                element: this,
                native_event: ev
            });
        });
        this.el.addEventListener("blur", ev => {
            this.focused = false;
            this.emit("blur", {
                element: this,
                native_event: ev
            });
        });
        this.el.addEventListener("input", ev => {
            this.value = ev.target.value;
            this.resizeTextarea();
            this.emit("input", {
                element: this,
                native_event: ev
            });
        });
        this.el.addEventListener("keydown", ev => {
            this.emit("keydown", {
                element: this,
                native_event: ev
            });
        });
        this.el.addEventListener("keyup", ev => {
            this.emit("keyup", {
                element: this,
                native_event: ev
            });
        });
        this.el.addEventListener("keypressed", ev => {
            this.emit("keypressed", {
                element: this,
                native_event: ev
            });
        });
        if (this._prepend_el) {
            this._prepend_el.addEventListener("click", ev => {
                ev.stopPropagation();
                ev.preventDefault();

                this.emit("click:prepend", {
                    element: this,
                    native_event: ev
                });
            });
        }
        if (this._append_el) {
            this._append_el.addEventListener("click", ev => {
                ev.stopPropagation();
                ev.preventDefault();

                this.emit("click:append", {
                    element: this,
                    native_event: ev
                });
            });
        }

        // mounting
        this._value = this._el.value;
        this.handleAutogrow();
        if (this._value.length > 0) {
            this.hidePlaceholder();
        }
        this._inited = true;
    }

    // gettery
    get el() {
        return this._el;
    }
    get main_wrapper_el() {
        return this._main_wrapper_el;
    }
    get tfield_el() {
        return this._tfield_el;
    }
    get placeholder_el() {
        return this._placeholder_el;
    }
    get prepend_el() {
        return this._prepend_el;
    }
    get append_el() {
        return this._append_el;
    }
    get value() {
        return this._value;
    }
    get focused() {
        return this._focused;
    }
    get disabled() {
        return this._disabled;
    }
    get valid() {
        return this._valid;
    }
    get rows() {
        return this._rows;
    }
    get autogrow() {
        return this._autogrow;
    }

    // settery
    set value(v) {
        this._value = v;
        this.counter = v.length;
        this.validate();
        this.el.value = v;

        if (v.length === 0) {
            this.showPlaceholder();
        } else {
            this.hidePlaceholder();
        }
    }
    set focused(state) {
        if (state !== true) state = false;
        if (state === this.focused) return;
        this._focused = state;
        if (this._focused) {
            this._main_wrapper_el.classList.add("wk-textarea--focused");
            this.hidePlaceholder();
            this.el.focus();
        } else {
            this._main_wrapper_el.classList.remove("wk-textarea--focused");
            if (this.value.length === 0) {
                this.showPlaceholder();
            }
        }
    }
    set disabled(state) {
        if (state !== true) state = false;
        if (state === this.disabled) return;
        this._disabled = state;
        if (state) {
            this.focused = false;
            this._main_wrapper_el.classList.add("wk-textarea--disabled");
            this.el.setAttribute("disabled", true);
        } else {
            this._main_wrapper_el.classList.remove("wk-textarea--disabled");
            this.el.removeAttribute("disabled");
        }
    }
    set valid(state) {
        if (state !== true && state !== null) state = false;
        if (state === this.valid) return;
        this._valid = state;
        if (state === false) {
            this._main_wrapper_el.classList.add("wk-textarea--invalid");
        } else {
            this._main_wrapper_el.classList.remove("wk-textarea--invalid");
            this.hideErrorMessage();
            this.showHint();
        }
    }
    set rows(n) {
        n = parseInt(n);
        if (isNaN(n)) throw new Error("Rows number must be a valid integer");
        this._rows = n;
        this.handleAutogrow();
        this.resizeTextarea();
    }
    set autogrow(state) {
        if (state !== true) state = false;
        if (state === this._autogrow) return;
        this._autogrow = state;
        this.handleAutogrow();
    }

    // toggle widoczności placeholdera
    showPlaceholder() {
        this._placeholder_el.style.display = "block";
    }
    hidePlaceholder() {
        this._placeholder_el.style.display = "none";
    }

    // obsługa autogrow
    handleAutogrow() {
        // jeżeli autogrow jest wyłączony to zdejmujemy z textarea wszystkie nałożone style
        if (this.autogrow === false) {
            this.el.style.removeProperty("height");
            this.el.style.removeProperty("overflow-y");
            if (this.rows != null) this.el.setAttribute("rows", this.rows);
        } else {
            this.el.style.overflowY = "hidden";
            this.el.setAttribute("rows", "1");
            this.resizeTextarea();
        }
    }
    resizeTextarea() {
        if (!this.autogrow) return;

        var cp = this.el.cloneNode(true);
        cp.style.width = this.el.offsetWidth + "px";
        cp.style.height = "auto";
        cp.style.position = "fixed";
        cp.style.zIndex = "-1";
        cp.style.opacity = "0";
        cp.style.pointerEvents = "none";
        document.body.appendChild(cp);

        var realHeight = cp.scrollHeight;
        if (this.rows && realHeight > this.rows * this._row_height) {
            this.el.style.height = this.rows * this._row_height + "px";
            this.el.style.overflowY = "auto";
        } else {
            this.el.style.height = realHeight + "px";
            this.el.style.overflowY = "hidden";
        }

        document.body.removeChild(cp);
        cp = null;
    }
}

// Klasa pola jednokrotnego wyboru
class WkRadio extends WkInput {
    constructor(opts) {
        super({ id: opts.el.id });

        // base setup
        this._el = opts.el;

        // zbieranie wszystkich elementów HTML, na których będą wykonywane operacje
        this._main_wrapper_el = document.querySelector(
            '.wk-radio[data-inputid="' + this._id + '"]'
        );
        this._label_el = document.querySelector(
            '.wk-radio__label[data-inputid="' + this._id + '"]'
        );

        // zmienne wewnętrzne stanu
        this._disabled = !!(this._el.getAttribute("disabled") !== null);
        this._true_value = opts.true_value || true;
        this._name = opts.name || "unknown";
        this._dont_emit_events_on_next_value_change = false;

        // eventy wewnętrzne
        this._label_el.addEventListener("click", () => {
            this.toggle();
        });
        this._el.addEventListener("click", e => {
            this.toggle();
        });

        // mounting
        wkInputs.__inputGroups.register(this._name, this);
        wkInputs.__eventBus.on("wk-radio:change", data => {
            if (data.input_id === this.id) return;
            if (data.name !== this._name) return;
            this._dont_emit_events_on_next_value_change = true;
            this.value = data.value;
        });

        // initial value set bez eventów
        this._dont_emit_events_on_next_value_change = true;
        this.value = opts.value || "";
        this._inited = true;
    }

    // gettery
    get el() {
        return this._el;
    }
    get main_wrapper_el() {
        return this._main_wrapper_el;
    }
    get label_el() {
        return this._label_el;
    }
    get value() {
        return this._value;
    }
    get disabled() {
        return this._disabled;
    }
    get valid() {
        return this._valid;
    }
    get true_value() {
        return this._true_value;
    }
    get name() {
        return this._name;
    }
    get selected() {
        return this.value === this.true_value;
    }

    // settery
    set value(v) {
        this._value = v;

        if (this.selected) {
            this.el.classList.add("wk-radio-button--checked");
        } else {
            this.el.classList.remove("wk-radio-button--checked");
        }
        this.validate();

        if (this._dont_emit_events_on_next_value_change !== true) {
            wkInputs.__eventBus.emit("wk-radio:change", {
                input_id: this.id,
                name: this.name,
                value: this.value
            });

            wkInputs.__inputGroups.emit(this._name + ":change", {
                value: this.value,
                element: this
            });

            this.emit("change", {
                element: this,
                state: this.value
            });
        } else {
            this._dont_emit_events_on_next_value_change = false;
        }
    }
    set disabled(state) {
        if (state !== true) state = false;
        if (state === this.disabled) return;
        this._disabled = state;
        if (state) {
            this._main_wrapper_el.classList.add("wk-radio--disabled");
            this.el.classList.add("wk-radio-button--disabled");
            this.el.setAttribute("disabled", true);
        } else {
            this._main_wrapper_el.classList.remove("wk-radio--disabled");
            this.el.classList.remove("wk-radio-button--disabled");
            this.el.removeAttribute("disabled");
        }
    }
    set valid(state) {
        if (state !== true) state = false;
        if (state === this.valid) return;
        this._valid = state;
        if (state) {
            this.el.classList.remove("wk-radio-button--invalid");
            this.hideErrorMessage();
            this.showHint();
        } else {
            this.el.classList.add("wk-radio-button--invalid");
        }
    }
    set name(str) {
        wkInputs.__inputGroups.unregister(this._name, this.id);
        this._name = str;

        // jeżeli dołącza do grupy, w której jakaś opcja jest aktywna, a sam jest aktywny, to deaktywujemy go
        const cv = window.wkInputs.__inputGroups.getRadioGroupValue(str);
        if (cv != null && this.selected) {
            this.value = undefined;
        }
        wkInputs.__inputGroups.register(this._name, this);
    }
    set true_value(state) {
        if (this.selected) {
            this.value = undefined;
        }
        this._true_value = state;
    }

    // zarządzanie stanem zaznaczenia
    toggle() {
        if (!this.selected && !this.disabled) {
            this.value = this.true_value;
        }
    }
}

// Klasa pola jedno- lub wielokrotnego wyboru (checkbox/switch)
class WkCheckbox extends WkInput {
    constructor(opts) {
        super({ id: opts.el.id });

        // base setup
        this._el = opts.el;

        // zbieranie wszystkich elementów HTML, na których będą wykonywane operacje
        this._main_wrapper_el = document.querySelector(
            '.wk-checkbox[data-inputid="' + this._id + '"]'
        );
        this._label_el = document.querySelector(
            '.wk-checkbox__label[data-inputid="' + this._id + '"]'
        );

        // zmienne wewnętrzne stanu
        this._disabled = !!(this._el.getAttribute("disabled") !== null);
        this._true_value = opts.true_value != undefined ? opts.true_value : true;
        this._false_value = opts.false_value != undefined ? opts.false_value : false;
        if (this._true_value === "true") this._true_value = true;
        if (this._false_value === "false") this._false_value = false;

        this._multiple = opts.multiple === true ? true : false;
        this._name = opts.name || "unknown";
        this._mode = opts.mode || "checkbox";
        this._ignore_label_click = opts.ignore_label_click === true ? true : false;

        // jeżeli mamy switcha to domyślnie wyłączamy label
        if (this._mode === "switch" && opts.ignore_label_click !== false) {
            this._ignore_label_click = true;
        }

        // eventy wewnętrzne
        this._label_el.addEventListener("click", ev => {
            this.emit("click:label", {
                element: this,
                native_event: ev
            });
            if (!this.ignore_label_click) {
                this.toggle();
            }
        });
        this._el.addEventListener("click", ev => {
            this.emit("click:button", {
                element: this,
                native_event: ev
            });
            this.toggle();
        });

        // mounting
        wkInputs.__inputGroups.register(this._name, this);
        wkInputs.__eventBus.on("wk-checkbox:change", data => {
            if (
                data.input_id !== this.id &&
                data.name === this._name &&
                !this.multiple &&
                data.is_selected
            )
                this.value = this.false_value;
        });
        this.value = opts.value || "";
        if (this._ignore_label_click === true) {
            this._label_el.classList.add("wk-checkbox__label--inactive");
        }
        this._inited = true;
    }

    // gettery
    get el() {
        return this._el;
    }
    get main_wrapper_el() {
        return this._main_wrapper_el;
    }
    get label_el() {
        return this._label_el;
    }
    get value() {
        return this._value;
    }
    get disabled() {
        return this._disabled;
    }
    get valid() {
        return this._valid;
    }
    get true_value() {
        return this._true_value;
    }
    get false_value() {
        return this._false_value;
    }
    get name() {
        return this._name;
    }
    get mode() {
        return this._mode;
    }
    get multiple() {
        return this._multiple;
    }
    get ignore_label_click() {
        return this._ignore_label_click;
    }
    get selected() {
        return this.value === this.true_value;
    }

    // settery
    set value(v) {
        this._value = v;

        // toggle wizualnego stanu
        if (this.selected) {
            if (this.mode === "switch") {
                this.el.classList.add("wk-checkbox-switch--checked");
            } else {
                this.el.classList.add("wk-checkbox-button--checked");
            }
        } else {
            if (this.mode === "switch") {
                this.el.classList.remove("wk-checkbox-switch--checked");
            } else {
                this.el.classList.remove("wk-checkbox-button--checked");
            }
        }

        if (this.multiple) {
            wkInputs.__inputGroups.validateGroup(this.name);
        } else {
            this.validate();
        }

        wkInputs.__inputGroups.emit(this.name + ":change", {
            value: this.multiple
                ? wkInputs.__inputGroups.getCheckboxGroupValue(this.name)
                : this.value,
            element: this
        });
        this.emit("change", {
            element: this,
            state: v
        });
    }
    set disabled(state) {
        if (state !== true) state = false;
        if (state === this.disabled) return;
        this._disabled = state;
        if (state) {
            this._main_wrapper_el.classList.add("wk-checkbox--disabled");
            if (this.mode === "switch") {
                this.el.classList.add("wk-checkbox-switch--disabled");
            } else {
                this.el.classList.add("wk-checkbox-button--disabled");
            }
            this.el.setAttribute("disabled", true);
        } else {
            this._main_wrapper_el.classList.remove("wk-checkbox--disabled");
            if (this.mode === "switch") {
                this.el.classList.remove("wk-checkbox-switch--disabled");
            } else {
                this.el.classList.remove("wk-checkbox-button--disabled");
            }
            this.el.removeAttribute("disabled");
        }
    }
    set valid(state) {
        if (state !== true) state = false;
        if (state === this.valid) return;
        this._valid = state;
        if (state) {
            if (this.mode === "switch") {
                this.el.classList.remove("wk-checkbox-switch--invalid");
            } else {
                this.el.classList.remove("wk-checkbox-button--invalid");
            }
            this.hideErrorMessage();
            this.showHint();
        } else {
            if (this.mode === "switch") {
                this.el.classList.add("wk-checkbox-switch--invalid");
            } else {
                this.el.classList.add("wk-checkbox-button--invalid");
            }
        }
    }
    set ignore_label_click(state) {
        if (state !== true) state = false;
        if (state === this.ignore_label_click) return;
        if (state === true) {
            this._label_el.classList.add("wk-checkbox__label--inactive");
        } else {
            this._label_el.classList.remove("wk-checkbox__label--inactive");
        }
        this._ignore_label_click = state;
    }
    set name(str) {
        wkInputs.__inputGroups.unregister(this._name, this.id);
        this._name = str;

        // jeżeli ten button nie jest w trybie multiple + w nowej grupie jest już zaznaczony jakikolwiek nie-multiple, to odnzaczamy tego
        if (!this.multiple && this.selected && this.anyOtherButtonInGroupIsChecked(true)) {
            this.value = this.false_value;
        }

        wkInputs.__inputGroups.register(this._name, this);
    }
    set true_value(state) {
        if (this.selected) {
            if (this.multiple) {
                this.value = this.state;
            } else {
                this.value = this.false_value;
            }
        }
        this._true_value = state;
    }
    set false_value(state) {
        this._false_value = state;
        if (!this.selected) {
            this.value = this.false_value;
        }
    }
    set multiple(state) {
        if (state !== true) state = false;
        if (state === this.multiple) return;
        this._multiple = state;

        if (!state && this.anyOtherButtonInGroupIsChecked()) {
            this.value = this.false_value;
        }
    }

    // zarządzanie stanem zaznaczenia
    toggle() {
        if (this.disabled) return;
        if (!this.selected) {
            this.value = this.true_value;
        } else {
            this.value = this.false_value;
        }

        wkInputs.__eventBus.emit("wk-checkbox:change", {
            input_id: this.id,
            name: this.name,
            value: this.value,
            is_selected: this.selected
        });
    }

    // helpery
    anyOtherButtonInGroupIsChecked(ignore_multiple) {
        const group = window.wkInputs.__inputGroups.groups[this.name];
        if (!group) return false;
        for (let i = 0; i < group.length; i++) {
            if (group[i].selected && (!ignore_multiple || !group[i].multiple)) {
                return true;
            }
        }
        return false;
    }
}

// Klasa pola jednokrotnego wyboru (select)
class WkSelect extends WkInput {
    constructor(opts) {
        super({ id: opts.el.id });

        // base setup
        this._el = opts.el;

        // zbieranie wszystkich elementów HTML, na których będą wykonywane operacje
        this._main_wrapper_el = document.querySelector(
            '.wk-select[data-inputid="' + this._id + '"]'
        );
        this._sfield_el = document.querySelector(
            '.wk-select__sfield[data-inputid="' + this._id + '"]'
        );
        this._selection_el = document.querySelector(".wk-select__selection#" + this._id);
        this._icon_el = document.querySelector('.wk-select__icon[data-inputid="' + this._id + '"]');
        this._placeholder_el = document.querySelector(
            '.wk-select__placeholder[data-inputid="' + this._id + '"]'
        );

        // inner state
        this._focused = false;
        this._disabled = !!(this.el.getAttribute("data-disabled") == true);

        this._items = [];
        this._item_text = this.el.getAttribute("data-item-text") || "text";
        this._item_value = this.el.getAttribute("data-item-value") || "value";
        this._current_focused_item = null;
        this._optslist = null;
        this._popper = null;
        this._items_list_opened = false;

        // eventy wewnętrzne
        document.body.addEventListener("click", e => {
            this.onClickOutside(e);
        });
        this._main_wrapper_el.addEventListener("click", ev => {
            ev.stopPropagation();
            if (this._disabled) return;

            this.emit("click", {
                element: this,
                native_event: ev
            });

            this.toggleItemsList();
        });
        this._main_wrapper_el.addEventListener("focus", ev => {
            this.focused = true;
        });
        this._main_wrapper_el.addEventListener("keydown", ev => {
            if (ev.key === " " && this.focused === true && !this.items_list_opened) {
                this.openItemsList();
            } else if (ev.key === "Tab" && this.focused) {
                this.focused = false;
            } else if (ev.key === "Escape" && this.focused === true && this.items_list_opened) {
                this.closeItemsList();
            } else if (
                (ev.key === "Enter" || ev.key === " ") &&
                this.items_list_opened &&
                this._current_focused_item
            ) {
                this.selectItem(this._current_focused_item.getAttribute("data-value"));
            } else if (ev.key === "ArrowDown") {
                ev.preventDefault();
                this.focusNextListItem();
            } else if (ev.key === "ArrowUp") {
                ev.preventDefault();
                this.focusPrevListItem();
            }
        });

        // mounting
        if (opts.items != undefined) this.items = opts.items;
        else this.items = [];
        this.value = this.el.getAttribute("data-value") || "";
        this._inited = true;
    }

    // gettery
    get el() {
        return this._el;
    }
    get main_wrapper_el() {
        return this._main_wrapper_el;
    }
    get sfield_el() {
        return this._sfield_el;
    }
    get selection_el() {
        return this._selection_el;
    }
    get icon_el() {
        return this._icon_el;
    }
    get placeholder_el() {
        return this._placeholder_el;
    }
    get value() {
        return this._value;
    }
    get focused() {
        return this._focused;
    }
    get disabled() {
        return this._disabled;
    }
    get valid() {
        return this._valid;
    }
    get items() {
        return this._items;
    }
    get item_text() {
        return this._item_text;
    }
    get item_value() {
        return this._item_value;
    }
    get optslist() {
        return this._optslist;
    }
    get items_list_opened() {
        return this._items_list_opened;
    }

    // settery
    set value(v) {
        this._value = v;

        const sitem = this._items.find(item => item[this._item_value] == v);
        if (v !== "" && sitem) {
            this.hidePlaceholder();
            this._selection_el.innerText = sitem[this._item_text];
        } else {
            this.showPlaceholder();
            this._selection_el.innerText = "";
        }

        this.validate();

        this.emit("change", {
            element: this,
            value: this._value
        });
    }
    set focused(state) {
        if (state !== true) state = false;
        if (state === this.focused || (state === true && this.disabled)) return;
        this._focused = state;
        if (state) {
            this._main_wrapper_el.classList.add("wk-select--focused");
            this.emit("focus", {
                element: this
            });
        } else {
            this._main_wrapper_el.classList.remove("wk-select--focused");
            if (this.items_list_opened) {
                this.closeItemsList();
            }

            this.emit("blur", {
                element: this
            });
        }
    }
    set disabled(state) {
        if (state !== true) state = false;
        if (state === this.disabled) return;
        this._disabled = state;
        if (state) {
            this._main_wrapper_el.classList.add("wk-select--disabled");
            this.el.setAttribute("disabled", true);
        } else {
            this._main_wrapper_el.classList.remove("wk-select--disabled");
            this.el.removeAttribute("disabled");
        }
    }
    set valid(state) {
        if (state !== true) state = false;
        if (state === this.valid) return;
        this._valid = state;
        if (state) {
            this._main_wrapper_el.classList.remove("wk-select--invalid");
            this.hideErrorMessage();
            this.showHint();
        } else {
            this._main_wrapper_el.classList.add("wk-select--invalid");
        }
    }
    set item_text(v) {
        this._item_text = v;
        this.value = undefined;
    }
    set item_value(v) {
        this._item_value = v;
        this.value = undefined;
    }
    set items(arr) {
        this._items = JSON.parse(JSON.stringify(arr));
        this.renderItems();
    }

    // toggle widoczności placeholdera
    showPlaceholder() {
        this._placeholder_el.style.display = "block";
    }
    hidePlaceholder() {
        this._placeholder_el.style.display = "none";
    }

    // zarządzanie listą opcji
    renderItems() {
        const optel = document.createElement("div");
        optel.classList.add("wk-select__itemslist");
        optel.setAttribute("data-input", this.id);
        optel.addEventListener("click", e => e.stopPropagation());

        for (let i = 0; i < this.items.length; i++) {
            const item = this.items[i];
            const el = document.createElement("button");
            el.classList.add("wk-select__item");

            if (item[this.item_value] === this.value) {
                el.classList.add("wk-select__item--selected");
                el.classList.add("wk-select__item--focused");
                this._current_focused_item = el;
            }

            el.innerHTML = item[this.item_text];
            el.setAttribute("tabindex", "-1");
            el.setAttribute("data-input", this.id);
            el.setAttribute("data-value", item[this.item_value]);
            el.addEventListener("click", function () {
                wkInputs[this.getAttribute("data-input")].selectItem(
                    this.getAttribute("data-value")
                );
            });

            optel.appendChild(el);
        }

        this._optslist = optel;
    }
    openItemsList() {
        if (this.optslist === null || this.items_list_opened === true) return;
        document.body.appendChild(this.optslist);
        this.optslist.style.width = this.main_wrapper_el.offsetWidth + "px";
        this.optslist.style.zIndex = this.getMaxZIndex() + 5;
        this._popper = Popper.createPopper(this.main_wrapper_el, this.optslist, {
            placement: "bottom",
            strategy: "absolute",
            modifiers: [
                {
                    name: "offset",
                    options: {
                        offset: [0, 8]
                    }
                },
                {
                    name: "flip",
                    options: {
                        fallbackPlacements: ["top"]
                    }
                }
            ]
        });
        this._items_list_opened = true;
        this.icon_el.classList.add("wk-select__icon--active");
        this.adjustOptsListScrollToActiveItem();
    }
    closeItemsList() {
        if (this.items_list_opened !== true) return;
        this._popper.destroy();
        this._popper = null;
        document.body.removeChild(this.optslist);
        this._items_list_opened = false;
        this.icon_el.classList.remove("wk-select__icon--active");
    }
    toggleItemsList() {
        if (this.items_list_opened) this.closeItemsList();
        else this.openItemsList();
    }
    onClickOutside(e) {
        if (this.items_list_opened) this.closeItemsList();
    }

    focusNextListItem() {
        if (this._current_focused_item) {
            this._current_focused_item.classList.remove("wk-select__item--focused");
        }

        if (!this._current_focused_item || !this._current_focused_item.nextElementSibling) {
            this._current_focused_item = this._optslist.firstElementChild;
        } else {
            this._current_focused_item = this._current_focused_item.nextElementSibling;
        }

        this._current_focused_item.classList.add("wk-select__item--focused");
        this.adjustOptsListScrollToActiveItem();
    }
    focusPrevListItem() {
        if (this._current_focused_item) {
            this._current_focused_item.classList.remove("wk-select__item--focused");
        }

        if (!this._current_focused_item || !this._current_focused_item.previousElementSibling) {
            this._current_focused_item = this._optslist.lastElementChild;
        } else {
            this._current_focused_item = this._current_focused_item.previousElementSibling;
        }

        this._current_focused_item.classList.add("wk-select__item--focused");
        this.adjustOptsListScrollToActiveItem();
    }

    selectItem(value) {
        const item = this.items.find(i => i[this.item_value] == value);
        if (item) {
            this.value = value;
            this.closeItemsList();
            this.renderItems();
            this.main_wrapper_el.focus();
        }
    }

    adjustOptsListScrollToActiveItem() {
        if (!this._current_focused_item) return;

        function optionIsVisible(el, c) {
            const cTop = c.scrollTop;
            const cBottom = cTop + c.clientHeight;

            const eTop = el.offsetTop;
            const eBottom = eTop + el.clientHeight;

            return eTop >= cTop && eBottom <= cBottom;
        }

        if (!optionIsVisible(this._current_focused_item, this._optslist)) {
            setTimeout(() => {
                this._current_focused_item.scrollIntoView({ behavior: "smooth" });
            }, 10);
        }
    }

    getMaxZIndex(element) {
        let children_array = element
            ? element.querySelectorAll("*")
            : document.querySelectorAll("body *");

        return Math.max(
            ...Array.from(children_array, el =>
                parseFloat(window.getComputedStyle(el).zIndex)
            ).filter(zIndex => !Number.isNaN(zIndex)),
            0
        );
    }
}
