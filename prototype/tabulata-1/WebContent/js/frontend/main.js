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
        DetailPageController.updateColumnEventReceived(event.data);
	}
	if (event.data.eventName == "updateSingular") {
        DetailPageController.updateSingularEventReceived(event.data);
	}
	if (event.data.eventName == "log") {
		console.log(event.data.msg);
	}
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



