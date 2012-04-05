
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
		var topIdx = refElem.offset().top + 12;
		$("#mainwrapper").css('top', topIdx + "px");
		var bottom = $(window).height();
		$("#mainwrapper").css('height', (bottom - topIdx) + "px");
		$("#main").css('height', (bottom - topIdx) + "px");
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
	
	this.genColumnClassName = function (idx) {
		if (idx == undefined) idx = newCounter;
		return " list_col_"+idx;
	};
	
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
	
	var createFieldNode = function (listName, col, colNr, row) {
		var id = Symbols.columnRowSymbol(listName, col.name, row);
		if (col.values) {
			return html.td(self.createInputField(id, "inp-act"+self.genColumnClassName(colNr), col.values[row]));
		} else {
			if (row == 0) {
				return html.td(self.createInputField(id, "inp-cal"+self.genColumnClassName(colNr), col.valueFunction));
			} else {
				return html.td(self.createInputField(id, "inp-cal"+self.genColumnClassName(colNr), ""));
			}
		}
	};
	
	this.init = function (list) {
		_list = list;
		$("#mtbl").html("");
		
		var headers = new Array();
		
		list.columns.forEach(function (col, idx) {
			headers.push(html.th(self.createHeaderField(list.name, col, idx)));
		});

		headers.push(html.th());

		$("#mtbl").append(html.tr(headers));
		
		
		for (var row=0; row<list.numRows; row++) {
			var c = new Array();
			
			list.columns.forEach(function (col, idx) {
				 c.push(createFieldNode(list.name, col, idx, row));
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
		
		newCounter = dimensions.x = list.columns.length;
		dimensions.y = list.numRows;
	};
	
	this.createInputField = function(id, cls, value) {
		if (value == undefined) value = "";
		if (cls == undefined) cls = "inp-act";
		return html.input(id, cls, value);
	};
	
	this.createHeaderField = function(listName, col, idx) {
		var hi = document.createElement("input");
		hi.className = 'hed-act'+self.genColumnClassName(idx);

		if (col == null) {
			hi.id = Symbols.columnRowSymbol(listName, "" + newCounter, "H");
			$(hi).data("name", undefined);
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
				$(this).replaceWith(createFieldNode(_list.name, _list.columns[index], index, _list.numRows));
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
		
		var col = _list.columns[dimensions.x] = {name: ""+newCounter, values: []};
		
		$(button).parent().replaceWith(createFieldNode(_list.name, col, dimensions.x, 0));
		$(tr).append(html.td(this.createAddColumnButton()));
		
		var hr = $(tr).siblings().first();
		var headerField = this.createHeaderField(_list.name, null, newCounter);
		$(hr).children().last().append(headerField);
		$(hr).append(html.th());
		
		var cr = tr;
		for (var i=1; i<dimensions.y; i++) {
			cr = $(cr).next();
			$(cr).children().last().replaceWith(createFieldNode(_list.name, col, dimensions.x, i));
			$(cr).append(html.td());
		}
		
		$(cr).next().append(html.td());
		
		dimensions.x ++;
		newCounter ++;

		il.update();
		
		return headerField;
	};
	
	this.changeColumnType = function (listName, columnName, type) {
		var newClass = '';
		var oldClass = '';
		if (type == "valueFunction") { 
			newClass = 'inp-cal';
			oldClass = 'inp-act'; 
		}
		if (type == "values") {
			newClass = 'inp-act'; 
			oldClass = 'inp-cal';
		}
		var i = 0;
		var col;
		while ((col=$('#'+Symbols.columnRowSymbol(listName, columnName, ""+i))).length > 0) {
			col.removeClass(oldClass);
			col.addClass(newClass);
			col.val("");
			i++;
		}
		ef.sendEvent(FrontendMessage.columnChanged(listName, columnName, columnName, type));
	};
	
	
	this.infoText = function () {
		return "Dimensions: x="+dimensions.x+ ",  &nbsp; y=" + dimensions.y;
	};
}
