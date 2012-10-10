var ef;
var user;

$(document).ready(function () {
    ef = new EngineFront();

    DetailPageController.init();
    HomePageController.init();

    user = /([\w-]+)$/.exec(window.location.pathname)[1];

    ef.sendEvent(FrontendMessage.loadBlocks());

   // loadDetailPage(block)
});

function loadDetailPage(block) {
    DetailPageController.loadBlock(block);
}


function EngineFront() {
	var self = this;
	this.worker = new MockWorker("/javascripts/backend/backendWorker.js");
    //this.worker = new Worker("/javascripts/backend/backendWorker.js");

    this.worker.onmessage = function(event) {
		self.messageHandler(event);
	};

	this.worker.onerror = function(error) {
		console.log("Worker error: " + error.message + " in "+error.filename+":"+error.lineno+"\n");
		throw error;
	};
}

var MockWorker = function (workerUrl) {

    __MW = this;

    $.ajax({
        url: workerUrl,
        dataType: 'script',
        async: false/*,
        error: function(jqXHR, textStatus, errorThrown) {
            console.log(errorThrown);
        }*/
    });

    this.workerPostedMessage = function (event) {
        var message = {data: jQuery.extend(true, {}, event)};
        this.onmessage(message);
    };

    this.postMessage = function(event) {
        this.workerMessageHandler({data: event});
    };
}

EngineFront.prototype.messageHandler = function (event) {
    console.log(event.data);
    if (event.data.eventName == "blockDataMessage") {
        HomePageController.load([event.data.data]);
    }
    if (event.data.eventName == "fullBlockMessage") {
        DetailPageController.loadBlock(event.data.block);
    }
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
    frontendMessage.user = user;
	this.worker.postMessage(frontendMessage);
};


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



