

$(document).ready(function () {
	initEmpty();
	$("body").ontouchmove = function (event) {
		event.preventDefault();
	};
});


function EngineFront() {
	var self = this;
	this.worker = new Worker("js/backendWorker.js");
	
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

function initEmpty() {
	sc = new SingularControl();
	sc.build();
	lc = new ListControl();
	lc.build();
	
	il = new InfoLine([sc, lc]);
	
	loadExample();
	
	il.update();
	
	attachEvents();
	
	ef = new EngineFront();
	ef.sendEvent(FrontendMessage.initWithBlock(block));
}

function attachEvents() {
	$(".inp-act").focusout(function (event) {
		ef.handleColumnValueChangeEvent(event);
	});
	
	$(".inp-value").focus(function (event) {
		$(event.target).data("locked", true);
		$(event.target).val(event.target.dataset.exp);
	});
	
	$(".inp-value").focusout(function (event) {
		var exp = event.target.dataset.exp = $(event.target).val();
		$(event.target).val("..");
		$(event.target).data("locked", false);
		
		ef.sendEvent(FrontendMessage.singularExpChanged(event.target.id.substring(2), exp));
	});

	$(".inp-key").focus(function (event) {
		$(event.target).data("oldValue", event.target.value);
	});

	
	$(".inp-key").focusout(function (event) {
		if ($(event.target).data("oldValue") != event.target.value) {
			handleSingularNameChangedEvent(event);			
		}
	});
	
	$(".inp-cal").focus(function (event) {
		var idParts = event.target.id.split(/_/);
		var exp = $("#"+Symbols.columnRowSymbol(idParts[1], idParts[2], "H")).data("exp");
		var editField = $("#pane-value-function");
		$(editField).data("listName", idParts[1]);
		$(editField).data("columnName", idParts[2]);
		editField.val(exp);
		
		$("#pane").toggle(true);
		
		editField.focus();
//		setCursor(editField[0], 0);
	});
	
	$("#pane-value-function").focusout(function (event) {
		var exp = event.target.value;
		var d = $(event.target).data();
		
		$("#"+Symbols.columnRowSymbol(d.listName, d.columnName, "H")).data("exp", exp);


		$("#pane").toggle(false);
		
		ef.sendEvent(FrontendMessage.columnValueFunctionChanged(d.listName, d.columnName, exp));
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


function td(txt) {
	if (txt == undefined) txt = "";
	return "<td>" + txt + "</td>";
}

function th(txt) {
	if (txt == undefined) txt = "";
	return "<th>" + txt + "</th>";
}

function oth(elem) {
	return crelem("th", elem);
}

function otr(elem) {
	return crelem("tr", elem);
}

function crelem(name, inside) {
	var elem = document.createElement(name);
	if (inside != undefined)
		$(elem).append(inside);
	return elem;	
}

function tr(txt) {
	return "<tr>" + txt + "</tr>";
}

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
		$("#stbl").append(tr(td(this.createAddButton())+td()));
	};
	
	this.addRow = function (button) {
		$(button).parent().parent().before(this.createRow(this.newCounter++, "", ""));
		this.size ++;
		il.update();
		attachEvents();
	};
	
	this.createRow = function (id, key, value) {
		return tr(td(this.createInputFieldKey(id, key)) + td(this.createInputFieldValue(id, value)));
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
		return "<input class='inp-key' id = '"+SingularControl.keyId(symbol)+"' value = '"+key+"'/>";
	};
	
	this.createInputFieldValue = function(symbol, value) {
		if (value == undefined) value = "";
		return "<input class='inp-value' id = '"+SingularControl.valueId(symbol)+"' data-exp = '"+value+"' value = '"+value+"'/>";
	};
	
	this.createAddButton = function () {
		return "<input class='input-button add-button' id='scAddRow' type='button' value='+' onClick='sc.addRow(this)' />";
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
	
	this.build = function () {
		$("#mtbl").append(tr(th(this.createHeaderField(""))+th()));
		
		$("#mtbl").append(tr(td(this.createInputField())+td(this.createAddColumnButton()))+
				tr(td(this.createAddRowButton())+td()));
	};
	
	var createFieldNode = function (listName, col, row) {
		var id = Symbols.columnRowSymbol(listName, col.name, row);
		if (col.values) {
			return td(self.createInputField(id, "inp-act", col.values[row]));
		} else {
			if (row == 0) {
				return td(self.createInputField(id, "inp-cal", col.valueFunction));
			} else {
				return td(self.createInputField(id, "inp-cal", ""));
				//TODO: column.valueFunction
			}
		}
	};
	
	this.init = function (list) {
		_list = list;
		$("#mtbl").html("");
		
		var headers = new Array();
		
		list.columns.forEach(function (col) {
			headers.push(oth(self.createHeaderField(list.name, col)));
		});

		$("#mtbl").append(otr(headers));
		
		for (var row=0; row<list.numRows; row++) {
			c = "";
			list.columns.forEach(function (col) {
				 c += createFieldNode(list.name, col, row);
			});
			if (row==0) {
				c += td(self.createAddColumnButton());
			} else {
				c += td();
			}
			$("#mtbl").append(tr(c));
		}
		c = "";
		
		c += td(self.createAddRowButton());
		for (var col=1; col<list.columns.length; col++) {
			c += td();
		}
		$("#mtbl").append(tr(c));
		
		dimensions.x = list.columns.length;
		dimensions.y = list.numRows;
	};
	
	this.createInputField = function(id, cls, value) {
		if (value == undefined) value = "";
		if (cls == undefined) cls = "inp-act";
		return "<input class='"+cls+"' id = '"+id+"' value = '"+value+"'/>";
	};
	
	this.createHeaderField = function(listName, col) {
		//TODO kludge for empty creation
		if (col == undefined) {
			return "<input class='hed-act' value = ''/>";	
		}
		
		if (col.values) {
			return "<input class='hed-act' value = '"+col.name+"'/>";
		}
		
		var hi = document.createElement("input");
		hi.className = 'hed-act';
		hi.value = col.name;
		hi.id = Symbols.columnRowSymbol(listName, col.name, "H");
		hi.dataset.exp = col.valueFunction;
		
		return hi;
	};
	
	this.createAddRowButton = function() {
		return this.createAddButton("lcAddRowButton", "addRow");
	};
	
	this.createAddColumnButton = function() {
		return this.createAddButton("lcAddColumnButton", "addColumn");
	};
	
	this.createAddButton = function(id, callFn) {
		return "<input id='"+id+"' class='add-button' type='button' value='+' onClick='lc."+callFn+"(this)' />";
	};
	
	this.addRow = function(button) {
		var tr = $(button).parent().parent().get(0);
		
		$(tr).children().each(function(index){
			if (index == dimensions.x) {
				// last cell
				$(this).html("");
			} else {
				$(this).html(createFieldNode(_list.name, _list.columns[index], _list.numRows));
			}
		});
		
		_list.numRows++;

		$(tr).parent().append("<tr></tr>");
		var newrow = $(tr).next();
		newrow.append(td(this.createAddRowButton()));
		for (var i = 0; i<dimensions.x; i++) {
			newrow.append(td(""));
		}
		
		dimensions.y ++;
		
		attachEvents();
		ef.sendEvent(FrontendMessage.rowAdded(_list.name));
		il.update();
	};
	
	this.addColumn = function(button) {
		var tr = $(button).parent().parent().get(0);
		
		$(button).replaceWith(this.createInputField());
		$(tr).append(td(this.createAddColumnButton()));
		
		var hr = $(tr).siblings().first();
		$(hr).children().last().html(this.createHeaderField());
		$(hr).append(th(""));
		
		var cr = tr;
		for (var i=1; i<dimensions.y; i++) {
			cr = $(cr).next();
			$(cr).children().last().html(this.createInputField());
			$(cr).append(td(""));
		}
		
		$(cr).next().append(td(""));
		
		dimensions.x ++;
		il.update();
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

