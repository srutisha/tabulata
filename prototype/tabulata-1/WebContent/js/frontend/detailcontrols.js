
DetailControlFactory_ = function () {

    var cos = [];

    this.addControlObject = function (obj) {
        cos.push(obj);
    };

    this.attachChangeHandlers = function (parentElem, changeHandler) {
        cos.forEach(function (co) {
            co.attachChangeHandler(parentElem, changeHandler);
        });
    }
};


DetailControlFactory_.prototype.getControlObject = function (type) {
    switch (type) {
        case "boolean": return BooleanControl;
        case "number": return NumberInputControl;
    }
	return TextInputControl;
};

DetailControlFactory_.prototype.getControlObjectByClass = function (classNames) {
    if (classNames.indexOf("control-type-text")!=-1) {
        return TextInputControl;
    }
    if (classNames.indexOf("control-type-boolean")!=-1) {
        return BooleanControl;
    }
    return undefined;
};

DetailControlFactory = new DetailControlFactory_();

TextInputControl = function () {
    this.name = "TextInputControl";
};

DetailControlFactory.addControlObject(TextInputControl);

TextInputControl.attachChangeHandler = function (parentElem, changeHandler) {
    parentElem.on("focusout", ".inp-act", function (event) {
        changeHandler(event.target.id, event.target.value);
    });
};

TextInputControl.valueFromIdElement = function (elem) {
    return $(elem).val();
};

TextInputControl.createInputField = function(id, cls, value) {
	if (value == undefined) value = "";
	return html.input(id, cls, value);
};

TextInputControl.renderToDisplay = function (id, className, isValue, value) {
    return this.renderToDisplayWithTypeClass(id, "control-type-text "+className, isValue, value);
};

TextInputControl.renderToDisplayWithTypeClass = function (id, className, isValue, value) {
    if (isValue) {
        return TextInputControl.createInputField(id, "inp-act " + className, value);
    } else {
        return TextInputControl.renderReadOnly(id, "inp-cal " + className, value);
    }
};

TextInputControl.renderReadOnly = function (id, className, value) {
	var elem = TextInputControl.createInputField(id, className, value);
	elem.readOnly = true;
	
	return elem;
};

TextInputControl.changeValueType = function (listName, columnName, type) {
	var newClass = '';
	var oldClass = '';
	var readOnly = true;
	if (type == "valueFunction") { 
		newClass = 'inp-cal';
		oldClass = 'inp-act'; 
	}
	if (type == "values") {
		newClass = 'inp-act'; 
		oldClass = 'inp-cal';
		readOnly = false;
	}
	var i = 0;
	var col;
	while ((col=$('#'+Symbols.columnRowSymbol(listName, columnName, ""+i))).length > 0) {
		col.removeClass(oldClass);
		col.addClass(newClass);
		col.val("");
		col.prop("readOnly", readOnly);
		i++;
	}
};


NumberInputControl = new TextInputControl();
NumberInputControl.constructor = function () {
    this.name = "NumberInputControl";
};

NumberInputControl.renderToDisplay = function (id, className, isValue, value) {
    var ctrl = TextInputControl.renderToDisplayWithTypeClass(id, "control-type-number "+className, isValue, value);
    ctrl.type = "number";
    return ctrl;
};


BooleanControl = function () {
    this.name = "BooleanControl";
};

DetailControlFactory.addControlObject(BooleanControl);

BooleanControl.renderToDisplay = function (id, className, isValue, value) {
    if (isValue) {
        return BooleanControl.doRender(id, className, value);
    } else {
        // TODO
    }
};

BooleanControl.attachChangeHandler = function (parentElem, changeHandler) {
    parentElem.on("change", ".control-type-boolean select", function (event) {
        var elem = $(event.target).parents(".control-type-boolean")[0];
        var value = BooleanControl.valueFromIdElement(elem);
        changeHandler(elem.id, value);
    });
};

function createOption(txt1, txt2, selected) {
    var option = html.crelem("option", txt2);
    option.value = txt1;
    option.selected = selected;
    return option;
}

BooleanControl.doRender = function (id, className, value) {
    // TODO: make jqm render this as a slider
    var selectId = id+"-select";

    var label = html.crelem("label", "OnOff");
    label.htmlFor = selectId;
    label.className = "ui-hidden-accessible";
    var select = html.crelem("select", [
        createOption("true", "True", value),
        createOption("false", "False", ! value)], selectId);
    select.dataset.role = "slider"; // JQM

    var div =  html.crelem("div", [label, select], id);
    div.className = "control-type-boolean " + className;

    return div;
};

BooleanControl.valueFromIdElement = function (elem) {
    return $(elem).children("select").val();
};


DetailControlOps = function () {

};

DetailControlOps.replaceControlWithType = function (listName, columnName, newType) {
    var colSymb = Symbols.columnSymbol(listName, columnName);
    var controlElem;
    var i = 0;
    var controlObject;
    while ((controlElem = $("#"+colSymb+"_"+i)).length > 0) {
        controlElem = controlElem[0];
        controlObject = DetailControlFactory.getControlObjectByClass(controlElem.className);
        var val = controlObject.valueFromIdElement(controlElem);
        var id = controlElem.id;
        var cls = controlElem.className.match(/list_col_\d+/)[0];
        $(controlElem).replaceWith(DetailControlFactory.getControlObject(newType).renderToDisplay(id, cls, true, ObjUtil.stringToObject(val)));
        i++;
    }
};

