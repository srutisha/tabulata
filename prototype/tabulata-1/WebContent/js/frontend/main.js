var ef;

$(document).ready(function () {
    ef = new EngineFront();

	initDetailPage();
    loadDetailPage(block)
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
		//$("#"+id).text(data.values[i]);
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


function initDetailPage() {
    DetailPageController.init();
}

function loadDetailPage(block) {
    DetailPageController.loadBlock(block);
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



