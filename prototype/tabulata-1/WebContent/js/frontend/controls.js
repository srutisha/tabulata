
function SingularControl() {
	this.size = 0;
	
	this.newCounter = 0;
	
	this.build = function () {
		$("#stbl").append(html.tr([html.td(this.createAddButton()), html.td()]));
	};
	
	this.addRow = function (button) {
		$(button).parent().parent().before(this.createRow(this.newCounter++, "", ""));
		this.size ++;
		il.update();
		this.updateOffset();
	};
	
	this.updateOffset = function () {
		var refElem = $("#bottom-singulars");
		$("#main").css('margin-top', (refElem.offset().top + 15) + "px");
	};
	
	this.createRow = function (id, key, value) {
		var tdcont = [html.td(this.createInputFieldKey(id, key)), html.td(this.createInputFieldValue(id, value))];
		return html.tr(tdcont);
	};
	
	this.init = function (singulars) {
		$("#stbl").html("");
		for (var i = 0; i<singulars.length; i++) {
			$("#stbl").append(this.createRow(Symbols.singularSymbol(singulars[i].name),
					singulars[i].name, singulars[i].value));
			this.size ++;
		}
		//recreate the button
		this.build();
		this.updateOffset();
	};
	
	this.createInputFieldKey = function(symbol, key) {
		if (key == undefined) key = "";
		return html.input(SingularControl.keyId(symbol), 'inp-key', key);
	};
	
	this.createInputFieldValue = function(symbol, value) {
		if (value == undefined) value = "";
		var e = html.input (SingularControl.valueId(symbol), 'inp-value', value);
		e.dataset.exp = value;
		return e;
	};
	
	this.createAddButton = function () {
		var e = html.input('scAddRow', 'input-button add-button', '+');
		e.type = 'button';
		return e;
	};
	
	this.infoText = function () {
		return "Singulars: "+this.size;
	};
}

SingularControl.valueId = function(symbol) {
	return "v_"+symbol;
};

SingularControl.keyId = function(symbol) {
	return "k_"+symbol;
};

function ListControl() {
	var self = this;
	
	var dimensions = {'x': 1, 'y' : 1};
	
	var _list = new Array();
	
	var newCounter = 0;
	
	// TODO this is ugly
	this.changeColumnName = function (oldName, newName) {
		_list.columns.forEach(function(col) {
			if (col.name == oldName) {
				col.name = newName;
			}
		});
	};
	
	this.build = function () {
		$("#mtbl").append(html.tr([html.th(this.createHeaderField("")), html.th()]));
		
		$("#mtbl").append([html.tr([html.td(this.createInputField()), html.td(this.createAddColumnButton())]),
				html.tr([html.td(this.createAddRowButton()), html.td()])]);
	};
	
	var createFieldNode = function (listName, col, row) {
		var id = Symbols.columnRowSymbol(listName, col.name, row);
		if (col.values) {
			return html.td(self.createInputField(id, "inp-act", col.values[row]));
		} else {
			if (row == 0) {
				return html.td(self.createInputField(id, "inp-cal", col.valueFunction));
			} else {
				return html.td(self.createInputField(id, "inp-cal", ""));
				//TODO: column.valueFunction
			}
		}
	};
	
	this.init = function (list) {
		_list = list;
		$("#mtbl").html("");
		
		var headers = new Array();
		
		list.columns.forEach(function (col) {
			headers.push(html.th(self.createHeaderField(list.name, col)));
		});

		headers.push(html.th());

		$("#mtbl").append(html.tr(headers));
		
		
		for (var row=0; row<list.numRows; row++) {
			var c = new Array();

			list.columns.forEach(function (col) {
				 c.push(createFieldNode(list.name, col, row));
			});
			
			if (row==0) {
				c.push(html.td(self.createAddColumnButton()));
			} else {
				c.push(html.td());
			}
			
			$("#mtbl").append(html.tr(c));
		}

		var footer = new Array();
		
		footer.push(html.td(self.createAddRowButton()));
		for (var col=1; col<list.columns.length+1; col++) {
			footer.push(html.td());
		}
		
		$("#mtbl").append(html.tr(footer));
		
		dimensions.x = list.columns.length;
		dimensions.y = list.numRows;
	};
	
	this.createInputField = function(id, cls, value) {
		if (value == undefined) value = "";
		if (cls == undefined) cls = "inp-act";
		return html.input(id, cls, value);
	};
	
	this.createHeaderField = function(listName, col) {
		var hi = document.createElement("input");
		hi.className = 'hed-act';

		if (col == undefined) {
			hi.id = Symbols.columnRowSymbol(listName, "" + newCounter, "H");
		} else {
			hi.value = col.name;
			hi.id = Symbols.columnRowSymbol(listName, col.name, "H");
			
			$(hi).data("name", col.name);
			
			if (col.valueFunction) {
				hi.dataset.exp = col.valueFunction;
			}
		}
		
		return hi;
	};
	
	this.createAddRowButton = function() {
		return this.createAddButton("lcAddRowButton");
	};
	
	this.createAddColumnButton = function() {
		return this.createAddButton("lcAddColumnButton");
	};
	
	this.createAddButton = function(id) {
		var e = html.input(id, 'add-button', '+');
		e.type = 'button';
		return e;
	};
	
	this.addRow = function(button) {
		var tr = $(button).parent().parent().get(0);
		
		$(tr).children().each(function(index, elem){
			if (index == dimensions.x) {
				// last cell
				$(this).empty();
			} else {
				$(this).replaceWith(createFieldNode(_list.name, _list.columns[index], _list.numRows));
			}
		});
		
		_list.numRows++;

		var newrow = new Array();
		newrow.push(html.td(this.createAddRowButton()));
		for (var i = 0; i<dimensions.x; i++) {
			newrow.push(html.td());
		}

		$(tr).after(html.tr(newrow));
		
		dimensions.y ++;
		
		ef.sendEvent(FrontendMessage.rowAdded(_list.name));
		il.update();
	};
	
	this.addColumn = function(button) {
		var tr = $(button).parent().parent().get(0);
		
		$(button).replaceWith(this.createInputField(Symbols.columnRowSymbol(_list.name, ""+newCounter, "0")));
		$(tr).append(html.td(this.createAddColumnButton()));
		
		var hr = $(tr).siblings().first();
		$(hr).children().last().append(this.createHeaderField(_list.name));
		$(hr).append(html.th());
		
		var cr = tr;
		for (var i=1; i<dimensions.y; i++) {
			cr = $(cr).next();
			$(cr).children().last().append(this.createInputField(Symbols.columnRowSymbol(_list.name, ""+newCounter, ""+i)));
			$(cr).append(html.td());
		}
		
		$(cr).next().append(html.td());
		
		_list.columns[dimensions.x] = {name: ""+newCounter, values: []};
		
		dimensions.x ++;
		newCounter ++;
		il.update();
	};
	
	this.changeColumnType = function (listName, columnName, type) {
		var newClass = '';
		if (type == "valueFunction") newClass = 'inp-cal';
		if (type == "values") newClass = 'inp-act';
		var i = 0;
		var col;
		while ((col=$('#'+Symbols.columnRowSymbol(listName, columnName, ""+i))).length > 0) {
			col.attr("class", newClass);
			col.val("");
			i++;
		}
		ef.sendEvent(FrontendMessage.columnChanged(listName, columnName, columnName, type));
	};
	
	
	this.infoText = function () {
		return "Dimensions: x="+dimensions.x+ ",  &nbsp; y=" + dimensions.y;
	};
}
