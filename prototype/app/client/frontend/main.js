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
	this.worker = new MockWorker("/scripts/application-backend.js");
    //this.worker = new Worker("/javascripts/backend/backendWorker.js");

    this.worker.onmessage = function(event) {
		self.messageHandler(event);
	};

	this.worker.onerror = function(error) {
		console.log("Worker error: " + error.message + " in "+error.filename+":"+error.lineno+"\n");
		throw error;
	};
};

var __MW;

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

    var createMessage = function (event) {
        return {data: jQuery.extend(true, {}, event)};
    };

    this.workerPostedMessage = function (event) {
        this.onmessage(createMessage(event));
    };

    this.postMessage = function(event) {
        this.workerMessageHandler(createMessage(event));
    };
}

EngineFront.prototype.messageHandler = function (event) {
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



