
DetailControlFactory = function () {
	
};

DetailControlFactory.getControlObject = function (type) {
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
		return TextInputControl.createInputField(id, "inp-act " + className, value);
	} else {
		return TextInputControl.renderReadOnly(id, className, value); 
	}
};

TextInputControl.renderReadOnly = function (id, className, value) {
	var elem = TextInputControl.createInputField(id, "inp-cal " + className, value);
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


/*
TextInputControl.renderReadOnly = function (id, classNames, value) {
	var dv = html.crelem("div");
	dv.id = id;
	dv.className = "inp-cal " + classNames;
	dv.innerText = value;
	return dv;
};
*/