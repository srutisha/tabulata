

function EditPane () {
};

EditPane.attachEvents = function () {
	$('.radio-coltype').change(function (event) {
		$('#pane-edit-expression').toggle(event.target.id == 'radio-coltype-valueFunction');
		//EditPane.showPaneForHeader(EditPane.lastClicked, event.target.id == 'radio-coltype-values');
		
	});
	
	$("#pane-apply").on("tap", function (event) {
		EditPane.savePane();
		EditPane.dismissPane();
		event.preventDefault();
	});
	
	$("#pane-cancel").on("tap", function (event) {
		EditPane.dismissPane();
		event.preventDefault();
	});
};

EditPane.visible = false;
EditPane.editField = 0;
EditPane.showing = "";


EditPane.savePane = function () {
	var elem = $("#pane-value-function");
	var exp = elem.val();
	var d = elem.data();

	var newType = $('#radio-coltype-values').prop("checked") ? "values" : "valueFunction";
	
	if (d.originalType != newType) {
		lc.changeColumnType(d.listName, d.columnName, newType);
	}
	
	if (newType == "valueFunction") {
		$("#"+Symbols.columnRowSymbol(d.listName, d.columnName, "H")).data("exp", exp);
		ef.sendEvent(FrontendMessage.columnValueFunctionChanged(d.listName, d.columnName, exp));
	} else {
		if (d.originalType == "valueFunction") {
			$("#"+Symbols.columnRowSymbol(d.listName, d.columnName, "H")).removeData("exp");
			delete $("#"+Symbols.columnRowSymbol(d.listName, d.columnName, "H"))[0].dataset["exp"];
		}
	}
	
};


EditPane.dismissPane = function () {
	$("#pane").toggle(false);
	
	EditPane.normalColumn(EditPane.showing);
	EditPane.showing = "";
	
	EditPane.hide();
};


EditPane.showPaneEvent = function(event) {
	EditPane.lastClicked = event.target;
	
	var idParts = event.target.id.split(/_/);
	
	EditPane.showPaneForHeader(EditPane.lastClicked, 
			$("#"+Symbols.columnRowSymbol(idParts[1], idParts[2], "H")).data("exp") == undefined);
	event.stopImmediatePropagation();
};

EditPane.updatePaneEvent = function(event) {
	EditPane.lastClicked = event.target;
	var idParts = event.target.id.split(/_/);
	$(EditPane.editField).data("listName", idParts[1]);
	$(EditPane.editField).data("columnName", idParts[2]);
};

EditPane.showPaneForHeader = function(inputElem, isValues) {
	EditPane.editField = $("#pane-value-function");
	var idParts = inputElem.id.split(/_/);
	var exp = $("#"+Symbols.columnRowSymbol(idParts[1], idParts[2], "H")).data("exp");
	if (isValues) {
		// it's a values column
		$('#radio-coltype-values').prop("checked", true).checkboxradio("refresh");
		$('#radio-coltype-valueFunction').prop("checked", false).checkboxradio("refresh");
		$('#pane-edit-expression').toggle(false);
	} else {
		$('#radio-coltype-valueFunction').prop("checked", true).checkboxradio("refresh");
		$('#radio-coltype-values').prop("checked", false).checkboxradio("refresh");
		$('#pane-edit-expression').toggle(true);
	}
	
	$(EditPane.editField).data("originalType", exp == undefined ? "values" : "valueFunction");
	$(EditPane.editField).data("listName", idParts[1]);
	$(EditPane.editField).data("columnName", idParts[2]);
	EditPane.editField.val(exp);
	
	$("#pane").toggle(true);
	
	if (! isValues && idParts[3] != 'H') {
		// take away focus when field is not editable
		// TODO: set field to readonly
		inputElem.blur();
	}
	
	EditPane.highlightColumn(inputElem);
	
	EditPane.show();
};

EditPane.highlightColumn = function (elem) {
	var className = elem.className.match(/list_col_\d+/);
	if (EditPane.showing != "" && EditPane.showing != className) {
		EditPane.normalColumn(EditPane.showing);
	}
	$("."+className).addClass("shown-in-pane");
	EditPane.showing = className;
};

EditPane.normalColumn = function (className) {
	$("."+className).removeClass("shown-in-pane");
};

EditPane.show = function () {
	EditPane.visible = true;
};

EditPane.hide = function () {
	EditPane.visible = false;
};


EditPane.focusEvent = function (event) {
	console.log("focus event");
	console.log(event);
	if (! EditPane.visible) return;

	if ($(event.target).closest("#pane").length>0) {
		return;
	}
	
	EditPane.dismissPane();
};
