
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
    }
	return TextInputControl;
};

DetailControlFactory = new DetailControlFactory_();

TextInputControl = function () {
};

DetailControlFactory.addControlObject(TextInputControl);

TextInputControl.attachChangeHandler = function (parentElem, changeHandler) {
    parentElem.on("focusout", ".inp-act", function (event) {
        changeHandler(event.target.id, event.target.value);
    });
};

TextInputControl.createInputField = function(id, cls, value) {
	if (value == undefined) value = "";
	return html.input(id, cls, value);
};

TextInputControl.renderToDisplay = function (id, className, isValue, value) {
	if (isValue) {
		return TextInputControl.createInputField(id, "control-type-text inp-act " + className, value);
	} else {
		return TextInputControl.renderReadOnly(id, "control-type-text inp-cal " + className, value);
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


BooleanControl = function () {
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
    div.className = "control-type-boolean";

    return div;
};

BooleanControl.valueFromIdElement = function (elem) {
    return $(elem).children("select").val();
};
