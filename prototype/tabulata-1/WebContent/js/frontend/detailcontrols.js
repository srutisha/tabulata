
DetailControlFactory = function () {
	
};

DetailControlFactory.getControlObject = function (type) {
    switch (type) {
        case "boolean": return BooleanControl;
    }
	return TextInputControl;
};

TextInputControl = function () {
	
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

BooleanControl.renderToDisplay = function (id, className, isValue, value) {
    if (isValue) {
        return BooleanControl.doRender(id, className, value);
    } else {
        // TODO
    }
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

BooleanControl.valueFromSelect = function (target) {
    return $(target).val();
};
