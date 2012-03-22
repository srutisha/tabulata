

function EditPane () {
};

EditPane.visible = false;

EditPane.dismissPane = function () {
	var elem = $("#pane-value-function");
	var exp = elem.val();
	var d = elem.data();
	
	$("#"+Symbols.columnRowSymbol(d.listName, d.columnName, "H")).data("exp", exp);

	$("#pane").toggle(false);
	
	ef.sendEvent(FrontendMessage.columnValueFunctionChanged(d.listName, d.columnName, exp));
	
	EditPane.hide();
};

EditPane.showPaneEvent = function(event) {
	var idParts = event.target.id.split(/_/);
	var exp = $("#"+Symbols.columnRowSymbol(idParts[1], idParts[2], "H")).data("exp");
	var editField = $("#pane-value-function");
	$(editField).data("listName", idParts[1]);
	$(editField).data("columnName", idParts[2]);
	editField.val(exp);
	
	$("#pane").toggle(true);

	event.stopImmediatePropagation();
	
	editField.focus();
	
	EditPane.show();
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

