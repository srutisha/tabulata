

$(document).ready(function () {
	initEmpty();
	$("body").ontouchmove = function (event) {
		event.preventDefault();
	};
});


function EngineFront() {
	var self = this;
	this.worker = new Worker("js/backend/backendWorker.js");
	
	this.worker.onmessage = function(event) {
		self.messageHandler(event);
	};
	
	this.worker.onerror = function(error) {
		console.log("Worker error: " + error.message + " in "+error.filename+":"+error.lineno+"\n");
		throw error;
	};
}

EngineFront.prototype.messageHandler = function (event) {
	if (event.data.eventName == "updateColumn") {
		this.updateColumnEventReceived(event.data);
	}
	if (event.data.eventName == "updateSingular") {
		this.updateSingularEventReceived(event.data);
	}
	if (event.data.eventName == "log") {
		console.log(event.data.msg);
	}
};

EngineFront.prototype.updateColumnEventReceived = function (data) {
	for (var i=0; i<data.values.length; i++) {
		var id = Symbols.columnRowSymbol(data.listName, data.columnName, i);
		$("#"+id).val(data.values[i]);
	}
};

EngineFront.prototype.updateSingularEventReceived = function (data) {
	var id = Symbols.singularSymbol(data.appliesTo);
	var inp = $("#v_"+id);
	if (inp.data("locked")) {
		return;
	}
	inp.val(data.value);
};

EngineFront.prototype.sendEvent = function (frontendMessage) {
	console.log("Sending message .. ");
	console.log(frontendMessage);
	this.worker.postMessage(frontendMessage);
};

EngineFront.prototype.handleColumnValueChangeEvent = function (event) {
	console.log("Column change: "+event.target.id+" -> "+event.target.value);
	this.sendEvent(FrontendMessage.columnValueChanged(event.target.id, event.target.value));
};

EngineFront.prototype.handleColumnHeaderChangeEvent = function (event) {
	var idp = event.target.id.split(/_/);
	var listName = idp[1];
	var oldColumnSymbol = idp[2];
	var oldColumnName = $(event.target).data("name");
	var newName = event.target.value;
	
	if (oldColumnName == newName) return;
	if (newName == "") {
		// don't allow setting a column name to blank.
		event.target.value = oldColumnName;
		return;
	};
	
	$(event.target).data("name", newName);
	
	EngineFront.renameColumnIds(listName, oldColumnSymbol, newName);
		
	this.sendEvent(FrontendMessage.columnChanged(listName, oldColumnName, newName));

	// TODO this should not be here
	if (oldColumnName == undefined) oldColumnName = oldColumnSymbol;
	lc.changeColumnName(oldColumnName, newName);
};

EngineFront.renameColumnIds = function (listName, oldColumnSymbol, newName) {
	$("#"+Symbols.columnRowSymbol(listName, oldColumnSymbol, "H")).attr("id", Symbols.columnRowSymbol(listName, newName, "H"));
	
	var i = 0;
	var col;
	while ((col = $("#"+Symbols.columnRowSymbol(listName, oldColumnSymbol, i))).length > 0) {
		col.attr("id", Symbols.columnRowSymbol(listName, newName, i++));
	}
	
};

function initEmpty() {
	sc = new SingularControl();
	sc.build();
	lc = new ListControl();
	lc.build();
	
	il = new InfoLine([sc, lc]);
	
	loadExample();
	
	il.update();
	
	attachEvents();
	EditPane.attachEvents();
	
	
	ef = new EngineFront();
	ef.sendEvent(FrontendMessage.initWithBlock(block));
}

function attachEvents() {
	$("#mtbl").on("focusout", ".inp-act", function (event) {
		ef.handleColumnValueChangeEvent(event);
	});

	$("#mtbl").on("focusout", ".hed-act", function (event) {
		ef.handleColumnHeaderChangeEvent(event);
	});
	
	$("#mtbl").on("click", "#lcAddRowButton", function (event) {
		lc.addRow(event.target);
	});

	$("#mtbl").on("click", "#lcAddColumnButton", function (event) {
		lc.addColumn(event.target);
	});
	
	$("#stbl").on("focus", ".inp-value", function (event) {
		$(event.target).data("locked", true);
		$(event.target).val(event.target.dataset.exp);
	});
	
	$("#stbl").on("focusout", ".inp-value", function (event) {
		var exp = event.target.dataset.exp = $(event.target).val();
		$(event.target).val("..");
		$(event.target).data("locked", false);
		
		ef.sendEvent(FrontendMessage.singularExpChanged(event.target.id.substring(2), exp));
	});

	$("#stbl").on("focus", ".inp-key", function (event) {
		$(event.target).data("oldValue", event.target.value);
	});

	
	$("#stbl").on("focusout", ".inp-key", function (event) {
		if ($(event.target).data("oldValue") != event.target.value) {
			handleSingularNameChangedEvent(event);			
		}
	});

	$("#stbl").on("click", "#scAddRow", function (event) {
		sc.addRow(event.target);
	});
	
	$("#mtbl").on("focus", ".inp-cal, .hed-act", function (event) {
		EditPane.showPaneEvent(event);
	});

	$("#mtbl,#stbl").on("focus", "input", function (event) {
		EditPane.focusEvent(event);
	});
	
	$("#pane-apply").on("click", function (event) {
		EditPane.dismissPane();
	});
};

handleSingularNameChangedEvent = function (event) {
	var name = event.target.value;
	var oldSymbol = event.target.id.substring(2);
	var newSymbol = Symbols.singularSymbol(name);
	
	event.target.id = SingularControl.keyId(newSymbol);
	$("#"+SingularControl.valueId(oldSymbol)).attr("id", SingularControl.valueId(newSymbol));
	
	// for a new singular, doesn't send an old symbol (it was only temporary in the gui)
	if (oldSymbol.match(/\d+/)) {
		oldSymbol = undefined;
	}
	
	ef.sendEvent(FrontendMessage.singularChanged(oldSymbol, name, undefined));
};

function html() {
	
}

html.td = function(elem) {
	return html.crelem("td", elem);
};

html.tr = function(elem) {
	return html.crelem("tr", elem);
};

html.th = function(elem) {
	return html.crelem("th", elem);
};


html.input = function (id, className, value) {
	var e = document.createElement("input");
	e.className = className;
	e.id = id;
	e.value = value;
	return e;
};

html.crelem = function (name, inside) {
	var elem = document.createElement(name);
	if (inside != undefined)
		$(elem).append(inside);
	return elem;	
};

function loadExample() {
	new LoadControls().load(block);
}

function LoadControls() {
	this.load = function(block) {
		document.title = block.prolog.name + " -- tabulata";
		sc.init(block.singulars);
		lc.init(block.lists[0]);
	};
}

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

function InfoLine(sources) {
	this.update = function () {
		var txt = "";
		
		sources.forEach(function (source) {
			if (txt.length>0) txt += " &mdash; ";
			if (source.infoText)
				txt += source.infoText();
		});
		
		$("#info").html(txt);
	};
}

