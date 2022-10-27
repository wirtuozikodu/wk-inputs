"use strict";

window.wkInputs = window.wkInputs || {};

function loadScript(src) {
    const s = document.createElement("script");
    s.src = src;
    document.head.appendChild(s);
}
loadScript("https://unpkg.com/@popperjs/core@2");

// deklaracja i inicjalizacja event bus dla niektórych typów inputów
function WkInputsEventBus() {
    this._events = {};

    this.on = (event_name, handler) => {
        this.registerEvent(event_name, handler, "on");
    };
    this.once = (event_name, handler) => {
        this.registerEvent(event_name, handler, "once");
    };

    this.registerEvent = (event_name, handler, t) => {
        if (this._events[event_name] == undefined) this._events[event_name] = [];
        this._events[event_name].push({
            t: t,
            f: handler
        });
    };

    this.off = (event_name, handler) => {
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
    };

    this.emit = (event_name, payload) => {
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
    };
}
window.wkInputs.__eventBus = new WkInputsEventBus();

// deklaracja i inicjalizacja funkcji pomagającej wyciągać value z grupy inputów
function WkInputGroups() {
    this.groups = {};
    this.eventBus = new WkInputsEventBus();

    this.register = (name, wkInput) => {
        if (this.groups[name] == undefined) this.groups[name] = [];
        this.groups[name].push(wkInput);
    };

    this.getRadioGroupValue = group_name => {
        if (this.groups[group_name] == undefined) return null;
        var v = null;
        for (var i = 0; i < this.groups[group_name].length; i++) {
            if (this.groups[group_name][i].isSelected()) {
                v = this.groups[group_name][i]._value;
                break;
            }
        }
        return v;
    };

    this.getCheckboxGroupValue = group_name => {
        if (this.groups[group_name] == undefined) return null;
        var v = [];
        for (var i = 0; i < this.groups[group_name].length; i++) {
            if (
                this.groups[group_name][i].isSelected() &&
                this.groups[group_name][i]._multiple === true
            ) {
                v.push(this.groups[group_name][i].getValue());
            }
        }
        return v;
    };

    this.validateGroup = group_name => {
        if (this.groups[group_name] == undefined) return null;
        var any_error = false;
        for (var i = 0; i < this.groups[group_name].length; i++) {
            var v = this.groups[group_name][i].validate();
            if (v !== true) any_error = true;
        }
        return any_error;
    };
}
window.wkInputs.__inputGroups = new WkInputGroups();

// obsługa ogólnego wrappera wk-input
function WkInput(opts) {
    // base setup
    this.el = opts.el;
    this.el_id = opts.el_id;
    this.rules = [];
    this.input_value = "";
    this.default_error_msg = "";

    // elementy zależne
    this.counter_value = document.querySelector(
        '.wk-input__countervalue[data-input="' + this.el_id + '"]'
    );
    this.hint = document.querySelector(
        '.wk-input__message.wk-input__hint[data-input="' + this.el_id + '"]'
    );
    this.errormsg = document.querySelector(
        '.wk-input__message.wk-input__errormsg[data-input="' + this.el_id + '"]'
    );
    if (this.errormsg) {
        this.default_error_msg = this.errormsg.innerText;
    }

    // udostępniane metody
    this.updateCounter = v => {
        if (!this.counter_value) return false;
        this.counter_value.innerText = v;
        return true;
    };
    this.setInputValue = v => {
        this.input_value = v;
    };

    this.setRules = rules => {
        if (!Array.isArray(rules)) rules = [rules];
        this.rules = rules;
    };
    this.addRule = rule => {
        this.rules.push(rule);
    };
    this.clearRules = () => {
        this.rules = [];
    };

    this.showHint = () => {
        this.hint.style.display = "block";
    };
    this.hideHint = () => {
        this.hint.style.display = "none";
    };

    this.showErrorMessage = () => {
        this.errormsg.style.display = "block";
    };
    this.hideErrorMessage = () => {
        this.errormsg.style.display = "none";
    };
    this.setErrorMessage = msg => {
        this.errormsg.innerText = msg;
    };

    this.validate = () => {
        var valid = true;
        var msg = "";
        for (var i = 0; i < this.rules.length; i++) {
            if (typeof this.rules[i] != "function") continue;
            var r = this.rules[i](this.input_value);
            if (r !== true) {
                valid = false;
                if (typeof r === "string") msg = r;
                break;
            }
        }

        if (valid) {
            this.hideErrorMessage();
            if (this.hint) this.showHint();
        } else {
            if (this.hint) this.hideHint();
            if (msg != "") this.setErrorMessage(msg);
            else this.setErrorMessage(this.default_error_msg);
            this.showErrorMessage();
        }

        return valid;
    };
    this.resetValidation = () => {
        this.hideErrorMessage();
        if (this.hint) this.showHint();
    };

    // mounting
    this.hideErrorMessage();
}

// obsługa pola tekstowego
function WkTextField(opts) {
    // base setup
    this.el = opts.el;
    this.id = this.el.id;

    // montowanie uniwersalnych funkcji od wk-input
    this.wkInput = new WkInput({
        el: document.querySelector('.wk-input[data-inputid="' + this.id + '"]'),
        el_id: this.id
    });

    // montowanie lokalnego event busa
    this.eventBus = new WkInputsEventBus();

    // zbieranie wszystkich elementów HTML, na których będą wykonywane operacje
    this.main_wrapper = document.querySelector('.wk-text-field[data-inputid="' + this.id + '"]');
    this.tfield = document.querySelector('.wk-text-field__tfield[data-inputid="' + this.id + '"]');
    this.placeholder = document.querySelector(
        '.wk-text-field__placeholder[data-inputid="' + this.id + '"]'
    );

    // zmienne wewnętrzne stanu
    this._focused = false;
    this._valid = true;
    this._disabled = !!(this.el.getAttribute("disabled") !== null);

    // udostępniane metody
    this.getValue = () => {
        return this.el.value;
    };
    this.setValue = v => {
        this.el.value = v;
        this.wkInput.updateCounter(v.length);
        this.wkInput.setInputValue(v);
        this.validate();

        if (v == "") {
            this.showPlaceholder();
        } else {
            this.hidePlaceholder();
        }
    };

    this.showPlaceholder = () => {
        this.placeholder.style.display = "block";
    };
    this.hidePlaceholder = () => {
        this.placeholder.style.display = "none";
    };

    this.getFocus = () => {
        return this._focused;
    };
    this.setFocus = state => {
        if (state !== true) state = false;
        if (state === this._focused) return;
        this._focused = state;
        if (this._focused) {
            this.main_wrapper.classList.add("wk-text-field--focused");
            this.hidePlaceholder();
            this.el.focus();
        } else {
            this.main_wrapper.classList.remove("wk-text-field--focused");
            if (this.el.value == "") {
                this.showPlaceholder();
            }
        }
    };

    this.getDisabled = () => {
        return this._disabled;
    };
    this.setDisabled = state => {
        if (state !== true) state = false;
        if (state === this._disabled) return;
        this._disabled = state;
        if (this._disabled) {
            this.main_wrapper.classList.add("wk-text-field--disabled");
            this.el.setAttribute("disabled", true);
        } else {
            this.main_wrapper.classList.remove("wk-text-field--disabled");
            this.el.removeAttribute("disabled");
        }
    };

    this.getValid = () => {
        return this._valid;
    };
    this.setValid = state => {
        if (state !== true) state = false;
        if (state === this._valid) return;
        this._valid = state;
        if (this._valid) {
            this.main_wrapper.classList.remove("wk-text-field--invalid");
        } else {
            this.main_wrapper.classList.add("wk-text-field--invalid");
        }
    };

    this.validate = () => {
        var r = this.wkInput.validate();
        this.setValid(r);
        return r;
    };
    this.resetValidation = () => {
        this.wkInput.resetValidation();
        this.setValid(true);
    };

    // ekspozycja event busa
    this.on = (event_name, handler) => {
        return this.eventBus.on(event_name, handler);
    };
    this.once = (event_name, handler) => {
        return this.eventBus.once(event_name, handler);
    };
    this.off = (event_name, handler) => {
        return this.eventBus.off(event_name, handler);
    };

    // eventy wewnętrzne
    this.main_wrapper.addEventListener("click", ev => {
        this.el.focus();
        this.eventBus.emit("click", {
            input: this,
            native_event: ev
        });
    });
    this.el.addEventListener("focus", ev => {
        this.setFocus(true);
        this.eventBus.emit("focus", {
            input: this,
            native_event: ev
        });
    });
    this.el.addEventListener("blur", ev => {
        this.setFocus(false);
        this.eventBus.emit("blur", {
            input: this,
            native_event: ev
        });
    });
    this.el.addEventListener("input", ev => {
        this.setValue(ev.target.value);
        this.eventBus.emit("input", {
            input: this,
            native_event: ev
        });
    });
    this.el.addEventListener("keydown", ev => {
        this.eventBus.emit("keydown", {
            input: this,
            native_event: ev
        });
    });
    this.el.addEventListener("keyup", ev => {
        this.eventBus.emit("keyup", {
            input: this,
            native_event: ev
        });
    });
    this.el.addEventListener("keypressed", ev => {
        this.eventBus.emit("keypressed", {
            input: this,
            native_event: ev
        });
    });

    // mounting
    this.setValue(this.el.value);
}

// obsługa textarea
function WkTextarea(opts) {
    // base setup
    this.el = opts.el;
    this.id = this.el.id;

    // montowanie uniwersalnych funkcji od wk-input
    this.wkInput = new WkInput({
        el: document.querySelector('.wk-input[data-inputid="' + this.id + '"]'),
        el_id: this.id
    });

    // montowanie lokalnego event busa
    this.eventBus = new WkInputsEventBus();

    // zbieranie wszystkich elementów HTML, na których będą wykonywane operacje
    this.main_wrapper = document.querySelector('.wk-textarea[data-inputid="' + this.id + '"]');
    this.tfield = document.querySelector('.wk-textarea__tfield[data-inputid="' + this.id + '"]');
    this.placeholder = document.querySelector(
        '.wk-textarea__placeholder[data-inputid="' + this.id + '"]'
    );

    // zmienne wewnętrzne stanu
    this._focused = false;
    this._valid = true;
    this._disabled = !!(this.el.getAttribute("disabled") !== null);
    this._rows = this.el.getAttribute("rows") ? parseInt(this.el.getAttribute("rows")) : null;
    this._autogrow = this.el.getAttribute("data-autogrow") === "true" ? true : false;
    this._row_height = parseInt(window.getComputedStyle(this.el).lineHeight);

    // udostępniane metody
    this.getValue = () => {
        return this.el.value;
    };
    this.setValue = v => {
        this.el.value = v;
        this.wkInput.updateCounter(v.length);
        this.wkInput.setInputValue(v);
        this.validate();

        if (v == "") {
            this.showPlaceholder();
        } else {
            this.hidePlaceholder();
        }
    };

    this.showPlaceholder = () => {
        this.placeholder.style.display = "block";
    };
    this.hidePlaceholder = () => {
        this.placeholder.style.display = "none";
    };

    this.getFocus = () => {
        return this._focused;
    };
    this.setFocus = state => {
        if (state !== true) state = false;
        if (state === this._focused) return;
        this._focused = state;
        if (this._focused) {
            this.main_wrapper.classList.add("wk-textarea--focused");
            this.hidePlaceholder();
            this.el.focus();
        } else {
            this.main_wrapper.classList.remove("wk-textarea--focused");
            if (this.el.value == "") {
                this.showPlaceholder();
            }
        }
    };

    this.getDisabled = () => {
        return this._disabled;
    };
    this.setDisabled = state => {
        if (state !== true) state = false;
        if (state === this._disabled) return;
        this._disabled = state;
        if (this._disabled) {
            this.main_wrapper.classList.add("wk-textarea--disabled");
            this.el.setAttribute("disabled", true);
        } else {
            this.main_wrapper.classList.remove("wk-textarea--disabled");
            this.el.removeAttribute("disabled");
        }
    };

    this.getValid = () => {
        return this._valid;
    };
    this.setValid = state => {
        if (state !== true) state = false;
        if (state === this._valid) return;
        this._valid = state;
        if (this._valid) {
            this.main_wrapper.classList.remove("wk-textarea--invalid");
        } else {
            this.main_wrapper.classList.add("wk-textarea--invalid");
        }
    };

    this.validate = () => {
        var r = this.wkInput.validate();
        this.setValid(r);
        return r;
    };
    this.resetValidation = () => {
        this.wkInput.resetValidation();
        this.setValid(true);
    };

    this.getAutogrow = () => {
        return this._autogrow;
    };
    this.setAutogrow = state => {
        if (state !== true) state = false;
        if (state === this._autogrow) return;
        this._autogrow = state;
        this.handleAutogrow();
    };
    this.handleAutogrow = () => {
        // jeżeli autogrow jest wyłączony to zdejmujemy z textarea wszystkie nałożone style
        if (this._autogrow === false) {
            this.el.style.removeProperty("height");
            this.el.style.removeProperty("overflow-y");
            if (this._rows != null) this.el.setAttribute("rows", this._rows);
        } else {
            this.el.style.overflowY = "hidden";
            this.el.setAttribute("rows", "1");
            this.resizeTextarea();
        }
    };
    this.resizeTextarea = () => {
        if (!this._autogrow) return;

        var cp = this.el.cloneNode(true);
        cp.style.width = this.el.offsetWidth + "px";
        cp.style.height = "auto";
        cp.style.position = "fixed";
        cp.style.zIndex = "-1";
        cp.style.opacity = "0";
        cp.style.pointerEvents = "none";
        document.body.appendChild(cp);

        var realHeight = cp.scrollHeight;
        if (this._rows && realHeight > this._rows * this._row_height) {
            this.el.style.height = this._rows * this._row_height + "px";
            this.el.style.overflowY = "auto";
        } else {
            this.el.style.height = realHeight + "px";
            this.el.style.overflowY = "hidden";
        }

        document.body.removeChild(cp);
        cp = null;
    };

    // ekspozycja event busa
    this.on = (event_name, handler) => {
        return this.eventBus.on(event_name, handler);
    };
    this.once = (event_name, handler) => {
        return this.eventBus.once(event_name, handler);
    };
    this.off = (event_name, handler) => {
        return this.eventBus.off(event_name, handler);
    };

    // eventy wewnętrzne
    this.main_wrapper.addEventListener("click", ev => {
        this.el.focus();
        this.eventBus.emit("click", {
            input: this,
            native_event: ev
        });
    });
    this.el.addEventListener("focus", ev => {
        this.setFocus(true);
        this.eventBus.emit("focus", {
            input: this,
            native_event: ev
        });
    });
    this.el.addEventListener("blur", ev => {
        this.setFocus(false);
        this.eventBus.emit("blur", {
            input: this,
            native_event: ev
        });
    });
    this.el.addEventListener("input", ev => {
        this.setValue(ev.target.value);
        this.resizeTextarea();
        this.eventBus.emit("input", {
            input: this,
            native_event: ev
        });
    });
    this.el.addEventListener("keydown", ev => {
        this.eventBus.emit("keydown", {
            input: this,
            native_event: ev
        });
    });
    this.el.addEventListener("keyup", ev => {
        this.eventBus.emit("keyup", {
            input: this,
            native_event: ev
        });
    });
    this.el.addEventListener("keypressed", ev => {
        this.eventBus.emit("keypressed", {
            input: this,
            native_event: ev
        });
    });

    // mounting
    this.setValue(this.el.value);
    this.handleAutogrow();
}

//obsługa radio
function WkRadio(opts) {
    // base setup
    this.el = opts.el;
    this.id = this.el.id;

    // montowanie uniwersalnych funkcji od wk-input
    this.wkInput = new WkInput({
        el: document.querySelector('.wk-input[data-inputid="' + this.id + '"]'),
        el_id: this.id
    });

    // zbieranie wszystkich elementów HTML, na których będą wykonywane operacje
    this.main_wrapper = document.querySelector('.wk-radio[data-inputid="' + this.id + '"]');
    this.label = document.querySelector('.wk-radio__label[data-inputid="' + this.id + '"]');

    // zmienne wewnętrzne stanu
    this._valid = true;
    this._disabled = !!(this.el.getAttribute("disabled") !== null);
    this._true_value = opts.true_value || true;
    this._value = opts.value || "";
    this._name = opts.name || "unknown";

    // udostępniane metody
    this.isSelected = () => {
        return this._value === this._true_value;
    };
    this.toggle = () => {
        if (!this.isSelected() && !this._disabled) {
            this.setValue(this._true_value);
            wkInputs.__eventBus.emit("wk-radio:change", {
                inputid: this.id,
                name: this._name,
                value: this._true_value
            });
            wkInputs.__inputGroups.eventBus.emit(this._name + ":change", {
                value: this._true_value,
                input: this
            });
        }
    };
    this.setValue = v => {
        this._value = v;
        if (this.isSelected()) {
            this.el.classList.add("wk-radio-button--checked");
        } else {
            this.el.classList.remove("wk-radio-button--checked");
        }
        this.wkInput.setInputValue(v);
        this.validate();
    };

    this.getDisabled = () => {
        return this._disabled;
    };
    this.setDisabled = state => {
        if (state !== true) state = false;
        if (state === this._disabled) return;
        this._disabled = state;
        if (this._disabled) {
            this.main_wrapper.classList.add("wk-radio--disabled");
            this.el.classList.add("wk-radio-button--disabled");
            this.el.setAttribute("disabled", true);
        } else {
            this.main_wrapper.classList.remove("wk-radio--disabled");
            this.el.classList.remove("wk-radio-button--disabled");
            this.el.removeAttribute("disabled");
        }
    };

    this.getValid = () => {
        return this._valid;
    };
    this.setValid = state => {
        if (state !== true) state = false;
        if (state === this._valid) return;
        this._valid = state;
        if (this._valid) {
            this.el.classList.remove("wk-radio-button--invalid");
        } else {
            this.el.classList.add("wk-radio-button--invalid");
        }
    };

    this.validate = () => {
        var r = this.wkInput.validate();
        this.setValid(r);
        return r;
    };
    this.resetValidation = () => {
        this.wkInput.resetValidation();
        this.setValid(true);
    };

    // ekspozycja event busa
    this.on = (event_name, handler) => {
        return wkInputs.__inputGroups.eventBus.on(this._name + ":" + event_name, handler);
    };
    this.once = (event_name, handler) => {
        return wkInputs.__inputGroups.eventBus.once(this._name + ":" + event_name, handler);
    };
    this.off = (event_name, handler) => {
        return wkInputs.__inputGroups.eventBus.off(this._name + ":" + event_name, handler);
    };

    // eventy wewnętrzne
    this.label.addEventListener("click", () => {
        this.toggle();
    });
    this.el.addEventListener("click", e => {
        this.toggle();
    });

    // mounting
    wkInputs.__inputGroups.register(this._name, this);
    wkInputs.__eventBus.on("wk-radio:change", data => {
        if (data.inputid !== this.id && data.name === this._name) this.setValue(data.value);
    });
    this.setValue(this._value);
}

//obsługa checkbox
function WkCheckbox(opts) {
    // base setup
    this.el = opts.el;
    this.id = this.el.id;

    // montowanie uniwersalnych funkcji od wk-input
    this.wkInput = new WkInput({
        el: document.querySelector('.wk-input[data-inputid="' + this.id + '"]'),
        el_id: this.id
    });

    // zbieranie wszystkich elementów HTML, na których będą wykonywane operacje
    this.main_wrapper = document.querySelector('.wk-checkbox[data-inputid="' + this.id + '"]');
    this.label = document.querySelector('.wk-checkbox__label[data-inputid="' + this.id + '"]');

    // zmienne wewnętrzne stanu
    this._valid = true;
    this._disabled = !!(this.el.getAttribute("disabled") !== null);
    this._true_value = opts.true_value != undefined ? opts.true_value : true;
    this._false_value = opts.false_value != undefined ? opts.false_value : false;
    this._multiple = opts.multiple === true ? true : false;
    this._value = opts.value || "";
    this._name = opts.name || "unknown";

    // udostępniane metody
    this.isSelected = () => {
        return this._value === this._true_value;
    };
    this.toggle = () => {
        if (this._disabled) return;
        if (!this.isSelected()) {
            this.setValue(this._true_value);
        } else {
            this.setValue(this._false_value);
        }
    };
    this.getValue = () => {
        return this._value;
    };
    this.setValue = v => {
        this._value = v;
        if (this.isSelected()) {
            this.el.classList.add("wk-checkbox-button--checked");
        } else {
            this.el.classList.remove("wk-checkbox-button--checked");
        }

        this.wkInput.setInputValue(v);
        wkInputs.__inputGroups.eventBus.emit(this._name + ":change", {
            value: this._multiple
                ? wkInputs.__inputGroups.getCheckboxGroupValue(this._name)
                : this._value,
            input: this
        });

        if (this._multiple) {
            wkInputs.__inputGroups.validateGroup(this._name);
        } else {
            this.validate();
        }
    };

    this.getDisabled = () => {
        return this._disabled;
    };
    this.setDisabled = state => {
        if (state !== true) state = false;
        if (state === this._disabled) return;
        this._disabled = state;
        if (this._disabled) {
            this.main_wrapper.classList.add("wk-checkbox--disabled");
            this.el.classList.add("wk-checkbox-button--disabled");
            this.el.setAttribute("disabled", true);
        } else {
            this.main_wrapper.classList.remove("wk-checkbox--disabled");
            this.el.classList.remove("wk-checkbox-button--disabled");
            this.el.removeAttribute("disabled");
        }
    };

    this.getValid = () => {
        return this._valid;
    };
    this.setValid = state => {
        if (state !== true) state = false;
        if (state === this._valid) return;
        this._valid = state;
        if (this._valid) {
            this.el.classList.remove("wk-checkbox-button--invalid");
        } else {
            this.el.classList.add("wk-checkbox-button--invalid");
        }
    };

    this.validate = () => {
        var r = this.wkInput.validate();
        this.setValid(r);
        return r;
    };
    this.resetValidation = () => {
        this.wkInput.resetValidation();
        this.setValid(true);
    };

    // ekspozycja event busa
    this.on = (event_name, handler) => {
        return wkInputs.__inputGroups.eventBus.on(this._name + ":" + event_name, handler);
    };
    this.once = (event_name, handler) => {
        return wkInputs.__inputGroups.eventBus.once(this._name + ":" + event_name, handler);
    };
    this.off = (event_name, handler) => {
        return wkInputs.__inputGroups.eventBus.off(this._name + ":" + event_name, handler);
    };

    // eventy wewnętrzne
    this.label.addEventListener("click", () => {
        this.toggle();
    });
    this.el.addEventListener("click", e => {
        this.toggle();
    });

    // mounting
    wkInputs.__inputGroups.register(this._name, this);
    this.setValue(this._value);
}

// obsługa pola wyboru
function WkSelect(opts) {
    // base setup
    this.el = opts.el;
    this.id = this.el.id;

    // montowanie uniwersalnych funkcji od wk-input
    this.wkInput = new WkInput({
        el: document.querySelector('.wk-input[data-inputid="' + this.id + '"]'),
        el_id: this.id
    });

    // montowanie lokalnego event busa
    this.eventBus = new WkInputsEventBus();

    // zbieranie wszystkich elementów HTML, na których będą wykonywane operacje
    this.main_wrapper = document.querySelector('.wk-select[data-inputid="' + this.id + '"]');
    this.sfield = document.querySelector('.wk-select__sfield[data-inputid="' + this.id + '"]');
    this.selection = document.querySelector(".wk-select__selection#" + this.id);
    this.icon = document.querySelector('.wk-select__icon[data-inputid="' + this.id + '"]');
    this.placeholder = document.querySelector(
        '.wk-select__placeholder[data-inputid="' + this.id + '"]'
    );

    // zmienne wewnętrzne stanu
    this._focused = false;
    this._valid = true;
    this._value = this.el.getAttribute("data-value");
    this._disabled = !!(this.el.getAttribute("data-disabled") == true);
    this._items = [];
    this._item_text = this.el.getAttribute("data-item-text") || "text";
    this._item_value = this.el.getAttribute("data-item-value") || "value";
    this._optslist = null;
    this._popper = null;
    this._items_list_opened = false;

    // udostępniane metody
    this.getValue = () => {
        return this._value;
    };
    this.setValue = v => {
        this._value = v;
        this.wkInput.updateCounter(v.length);
        this.wkInput.setInputValue(v);

        const sitem = this._items.find(item => item[this._item_value] == v);
        if (v !== "" && sitem) {
            this.hidePlaceholder();
            this.selection.innerText = sitem[this._item_text];
        } else {
            this.showPlaceholder();
            this.selection.innerText = "";
        }

        this.eventBus.emit("change", {
            input: this,
            value: this._value
        });

        this.validate();
    };

    this.showPlaceholder = () => {
        this.placeholder.style.display = "block";
    };
    this.hidePlaceholder = () => {
        this.placeholder.style.display = "none";
    };

    this.getFocus = () => {
        return this._focused;
    };
    this.setFocus = state => {
        if (state !== true) state = false;
        if (state === this._focused || (state === true && this._disabled)) return;
        this._focused = state;
        if (this._focused) {
            this.main_wrapper.classList.add("wk-select--focused");
            this.eventBus.emit("focus", {
                input: this
            });
        } else {
            this.main_wrapper.classList.remove("wk-select--focused");
            this.eventBus.emit("blur", {
                input: this
            });
        }
    };

    this.getDisabled = () => {
        return this._disabled;
    };
    this.setDisabled = state => {
        if (state !== true) state = false;
        if (state === this._disabled) return;
        this._disabled = state;
        if (this._disabled) {
            this.main_wrapper.classList.add("wk-select--disabled");
            this.el.setAttribute("disabled", true);
        } else {
            this.main_wrapper.classList.remove("wk-select--disabled");
            this.el.removeAttribute("disabled");
        }
    };

    this.getValid = () => {
        return this._valid;
    };
    this.setValid = state => {
        if (state !== true) state = false;
        if (state === this._valid) return;
        this._valid = state;
        if (this._valid) {
            this.main_wrapper.classList.remove("wk-select--invalid");
        } else {
            this.main_wrapper.classList.add("wk-select--invalid");
        }
    };

    this.validate = () => {
        var r = this.wkInput.validate();
        this.setValid(r);
        return r;
    };
    this.resetValidation = () => {
        this.wkInput.resetValidation();
        this.setValid(true);
    };

    this.setItemText = v => {
        this._item_text = v;
    };
    this.setItemValue = v => {
        this._item_value = v;
    };
    this.setItemDisabled = v => {
        this._item_disabled = v;
    };

    this.setItems = items => {
        this._items = JSON.parse(JSON.stringify(items));
        this.renderItems();
    };

    this.renderItems = () => {
        const optel = document.createElement("div");
        optel.classList.add("wk-select__itemslist");
        optel.setAttribute("data-input", this.id);
        optel.addEventListener("click", e => e.stopPropagation());

        for (let i = 0; i < this._items.length; i++) {
            const item = this._items[i];
            const el = document.createElement("button");
            el.classList.add("wk-select__item");

            if (item[this._item_value] === this._value) {
                el.classList.add("wk-select__item--selected");
            }

            el.innerHTML = item[this._item_text];
            el.setAttribute("data-input", this.id);
            el.setAttribute("data-value", item[this._item_value]);
            el.addEventListener("click", function () {
                wkInputs[this.getAttribute("data-input")].setValue(this.getAttribute("data-value"));
                wkInputs[this.getAttribute("data-input")].closeItemsList();
                wkInputs[this.getAttribute("data-input")].renderItems();
                wkInputs[this.getAttribute("data-input")].main_wrapper.focus();
            });

            if (i == this._items.length - 1) {
                el.addEventListener("keydown", function (e) {
                    if (e.keyCode == 9) {
                        e.preventDefault();
                        wkInputs[this.getAttribute("data-input")]._optslist.firstElementChild.focus(
                            { preventScroll: true }
                        );
                    }
                });
            }
            el.addEventListener("keydown", function (e) {
                if (e.keyCode == 27) {
                    e.preventDefault();
                    wkInputs[this.getAttribute("data-input")].closeItemsList();
                    wkInputs[this.getAttribute("data-input")].main_wrapper.focus();
                } else if (e.keyCode === 40) {
                    e.preventDefault();
                    if (this.nextElementSibling) {
                        this.nextElementSibling.focus();
                    } else {
                        wkInputs[
                            this.getAttribute("data-input")
                        ]._optslist.firstElementChild.focus();
                    }
                } else if (e.keyCode === 38) {
                    e.preventDefault();
                    if (this.previousElementSibling) {
                        this.previousElementSibling.focus();
                    } else {
                        wkInputs[
                            this.getAttribute("data-input")
                        ]._optslist.lastElementChild.focus();
                    }
                }
            });

            optel.appendChild(el);
        }

        this._optslist = optel;
    };

    this.openItemsList = () => {
        if (this._optslist === null || this._items_list_opened === true) return;
        document.body.appendChild(this._optslist);
        this._optslist.style.width = this.main_wrapper.offsetWidth + "px";
        this._popper = Popper.createPopper(this.main_wrapper, this._optslist, {
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
        this.icon.classList.add("wk-select__icon--active");
        document.body.addEventListener("click", this.clickOutsideHanlder);
    };
    this.closeItemsList = () => {
        if (this._items_list_opened !== true) return;
        this._popper.destroy();
        this._popper = null;
        document.body.removeChild(this._optslist);
        this._items_list_opened = false;
        this.icon.classList.remove("wk-select__icon--active");
        document.body.removeEventListener("click", this.clickOutsideHanlder);
    };
    this.toggleItemsList = () => {
        if (this._items_list_opened) this.closeItemsList();
        else this.openItemsList();
    };
    this.clickOutsideHanlder = () => {
        if (this._items_list_opened) this.closeItemsList();
    };

    // ekspozycja event busa
    this.on = (event_name, handler) => {
        return this.eventBus.on(event_name, handler);
    };
    this.once = (event_name, handler) => {
        return this.eventBus.once(event_name, handler);
    };
    this.off = (event_name, handler) => {
        return this.eventBus.off(event_name, handler);
    };

    // eventy wewnętrzne
    this.main_wrapper.addEventListener("click", ev => {
        ev.stopPropagation();
        if (this._disabled) return;

        this.eventBus.emit("click", {
            input: this,
            native_event: ev
        });

        this.toggleItemsList();
    });
    this.main_wrapper.addEventListener("focus", ev => {
        this.setFocus(true);
    });
    this.main_wrapper.addEventListener("blur", ev => {
        this.setFocus(false);
    });
    this.main_wrapper.addEventListener("keydown", ev => {
        if (ev.keyCode === 32 && this._focused === true) {
            this.toggleItemsList();
        }
        if ((ev.keyCode === 9 || ev.keyCode === 40) && this._items_list_opened === true) {
            ev.preventDefault();
            this._optslist.firstElementChild.focus();
        }
        if (ev.keyCode === 38 && this._items_list_opened === true) {
            ev.preventDefault();
            this._optslist.lastElementChild.focus();
        }
    });

    // mounting
    if (opts.items != undefined) this.setItems(opts.items);
    this.setValue(this._value);
}
