

/*
 * Tabulata -- Calculate and Aggregate Lists
 *
 * Copyright (C) 2012 Samuel Rutishauser (samuel@rutishauser.name)
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

function EditPane () {
}

EditPane.attachEvents = function () {
	$('.radio-coltype').change(function (event) {
		$('#pane-edit-expression').toggle(event.target.id == 'radio-coltype-valueFunction');
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

	$("#pane-value-function").on("focus", function(event) {
		EditPane.isEditingFunction = true;
	});

    $('#quickselect-container').on("tap", "a", function (event) {
        var $e = $(event.target);
        var name = $e.text();
        var list = $e.siblings('.list-name').text();

        if ($(".listselect-active").val() != list) {
            name = list+"."+name;
        }

        EditPane.insertNameInFormula(normalizeName(name));

        event.preventDefault();
    });
};

EditPane.visible = false;
EditPane.editField = 0;
EditPane.showing = "";
EditPane.isEditingFunction = false;

EditPane.singularKeyPushed = function(event) {
	return EditPane.headerColumnPushed(event);
};

EditPane.insertNameInFormula = function (name) {
    if (EditPane.isEditingFunction) {
        var currentFormula = $("#pane-value-function").val();
        var name = normalizeName(name);
        var idx = $("#pane-value-function")[0].selectionStart;
        var newFormula = currentFormula.substr(0, idx) + name + currentFormula.substr(idx);
        $("#pane-value-function").val(newFormula);
        $("#pane-value-function").focus();
        $("#pane-value-function")[0].setSelectionRange(idx + name.length, idx + name.length);
        return true;
    }
    return false;
};

EditPane.headerColumnPushed = function(event) {
	return EditPane.insertNameInFormula($(event.target).val());
};

EditPane.savePane = function () {
	var elem = $("#pane-value-function");
	var exp = elem.val();
	var d = elem.data();

	var newType = $('#radio-coltype-values').prop("checked") ? "values" : "valueFunction";

	if (d.originalType != newType) {
		lc.changeColumnType(d.listIdx, d.columnName, newType, exp);
	}

	if (newType == "valueFunction") {
		$("#"+Symbols.columnRowSymbol(d.listIdx, d.columnName, "H")).data("exp", exp);
        lc.setColumnExp(d.columnName, exp);
		ef.sendEvent(FrontendMessage.columnValueFunctionChanged(ListControl.lname(d.listIdx), d.columnName, exp));
	} else {
        EditPane.handleDataTypeChange(d.listIdx, d.columnName);
		if (d.originalType == "valueFunction") {
			$("#"+Symbols.columnRowSymbol(d.listIdx, d.columnName, "H")).removeData("exp");
			delete $("#"+Symbols.columnRowSymbol(ListControl.lname(d.listIdx), d.columnName, "H"))[0].dataset["exp"];
		}
	}

};

EditPane.handleDataTypeChange = function (listIdx, columnName) {
    var newDataType = $('.radio-datatype:checked').val();
    var oldDataType = lc.getColumnDataType(columnName);
    if (newDataType != oldDataType) {
        DetailControlOps.replaceControlWithDataType(listIdx, columnName, newDataType);
    }
    lc.setColumnDataType(listIdx, columnName, newDataType);
};


EditPane.dismissPane = function () {
	//dismiss the keyboard
	$(document.activeElement).blur();

	EditPane.isEditingFunction = false;
	$("#pane").toggle(false);

	EditPane.normalColumn(EditPane.showing);
	EditPane.showing = "";

	EditPane.hide();
};


EditPane.showPaneForElement = function($elem) {
	EditPane.lastClicked = $elem[0];

	var idParts = $elem[0].id.split(/_/);

    //TODO remove dependency on DOM for determining column type, but query the list control.
	EditPane.showPaneForHeader(EditPane.lastClicked,
			$("#"+Symbols.columnRowSymbol(idParts[1], idParts[2], "H")).data("exp") == undefined);
};

EditPane.updatePaneEvent = function(event) {
	EditPane.lastClicked = event.target;
	var idParts = event.target.id.split(/_/);
	$(EditPane.editField).data("listIdx", idParts[1]);
	$(EditPane.editField).data("columnName", idParts[2]);
};

EditPane.showPaneForHeader = function(inputElem, isValues) {
	EditPane.editField = $("#pane-value-function");
	var idParts = inputElem.id.split(/_/);
	var exp = $("#"+Symbols.columnRowSymbol(idParts[1], idParts[2], "H")).data("exp");

    EditPane.updateQuickselect();

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

    var dataType = lc.getColumnDataType(idParts[2]);
    $('#radio-datatype-text').prop("checked", dataType == "text").checkboxradio("refresh");
    $('#radio-datatype-number').prop("checked", dataType == "number").checkboxradio("refresh");
    $('#radio-datatype-boolean').prop("checked", dataType == "boolean").checkboxradio("refresh");

	$(EditPane.editField).data("originalType", exp == undefined ? "values" : "valueFunction");
	$(EditPane.editField).data("listIdx", idParts[1]);
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
	if (! EditPane.visible) return;

	if ($(event.target).closest("#pane").length>0) {
		return;
	}

	EditPane.dismissPane();
};

EditPane.updateQuickselect = function () {
    var source   = $("#quickselect-template").html();
    var template = Handlebars.compile(source);
    var quickselect = template({lists: lsc.listsSource()});
    $('#quickselect-container').html(quickselect);
};