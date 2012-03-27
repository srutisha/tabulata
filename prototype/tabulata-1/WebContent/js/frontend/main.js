

$(document).ready(function () {
	initEmpty();
	/*
	$("body").ontouchmove = function (event) {
		event.preventDefault();
	};
	*/
	scrollHooks();
});


function scrollHooks() {
	var needsScrollUpdate = false;
    $(document).scroll(function(){
        if(needsScrollUpdate) {
            setTimeout(function() {
                $("body").css("height", "+=1").css("height", "-=1");
            }, 0);
        }
    });
    $("input, textarea").live("focus", function(e) {
        needsScrollUpdate = true;
    });

    $("input, textarea").live("blur", function(e) {
        needsScrollUpdate = false;
    });
}

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
		if (oldColumnName != undefined) {
			event.target.value = oldColumnName;			
		}
		return;
	};
	
	$(event.target).data("name", newName);
	
	EngineFront.renameColumnIds(listName, oldColumnSymbol, newName);
		
	this.sendEvent(FrontendMessage.columnChanged(listName, oldColumnName, newName));

	// TODO this should not be here
	if (oldColumnName == "" || oldColumnName == undefined) oldColumnName = oldColumnSymbol;
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

