

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
		$(event.target).data("locked", false);
		$(event.target).val("..");
		
		ef.sendEvent(FrontendMessage.singularExpChanged(event.target.id.substring(2), exp));
	});
}

function td(txt) {
	if (txt == undefined) txt = "";
	return "<td>" + txt + "</td>";
}

function th(txt) {
	if (txt == undefined) txt = "";
	return "<th>" + txt + "</th>";
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
	
	this.build = function () {
		$("#stbl").append(tr(td(this.createAddButton())+td()));
	};
	
	this.addRow = function (button) {
		$(button).parent().parent().before(this.createRow());
		this.size ++;
		il.update();
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
	
	this.createInputFieldKey = function(id, key) {
		if (key == undefined) key = "";
		return "<input class='inp-key' id = 'k_"+id+"' value = '"+key+"'/>";
	};
	
	this.createInputFieldValue = function(id, value) {
		if (value == undefined) value = "";
		return "<input class='inp-value' id = 'v_"+id+"' data-exp = '"+value+"'value = '"+value+"'/>";
	};
	
	this.createAddButton = function () {
		return "<input class='input-button' id='scAddRow' type='button' value='+' onClick='sc.addRow(this)' />";
	};
	
	this.infoText = function () {
		return "Singulars: "+this.size;
	};
}

function ListControl() {
	var self = this;
	
	var dimensions = {'x': 1, 'y' : 1};
	
	this.build = function () {
		$("#mtbl").append(tr(th(this.createHeaderField())+th()));
		
		$("#mtbl").append(tr(td(this.createInputField())+td(this.createAddColumnButton()))+
				tr(td(this.createAddRowButton())+td()));
	};
	
	this.init = function (list) {
		$("#mtbl").html("");
		var c = "";
		list.columns.forEach(function (col) {
			c += th(self.createHeaderField(col.name));
		});
		c += th();
		$("#mtbl").append(tr(c));
		
		for (var row=0; row<list.numRows; row++) {
			c = "";
			list.columns.forEach(function (col) {
				var id = Symbols.columnRowSymbol(list.name, col.name, row);
				if (col.values) {
					c += td(self.createInputField(id, "inp-act", col.values[row]));
				} else {
					if (row == 0) {
						c += td(self.createInputField(id, "inp-cal", col.valueFunction));
					} else {
						c += td(self.createInputField(id, "inp-cal", ""));
						//TODO: column.valueFunction
					}
				}
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
	
	this.createHeaderField = function(value) {
		if (value == undefined) value = "";
		return "<input class='hed-act' value = '"+value+"'/>";
	};
	
	this.createAddRowButton = function() {
		return this.createAddButton("lcAddRowButton", "addRow");
	};
	
	this.createAddColumnButton = function() {
		return this.createAddButton("lcAddColumnButton", "addColumn");
	};
	
	this.createAddButton = function(id, callFn) {
		return "<input id='"+id+"' type='button' value='+' onClick='lc."+callFn+"(this)' />";
	};
	
	this.addRow = function(button) {
		var tr = $(button).parent().parent().get(0);
		var t = this;
		
		$(tr).children().each(function(index){
			if (index == dimensions.x) {
				// last cell
				$(this).html("");
			} else {
				$(this).html(t.createInputField());
			}
		});
		$(tr).parent().append("<tr></tr>");
		var newrow = $(tr).next();
		newrow.append(td(this.createAddRowButton()));
		for (var i = 0; i<dimensions.x; i++) {
			newrow.append(td(""));
		}
		
		dimensions.y ++;
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

