
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

var isWebWorker = typeof(importScripts)!=="undefined";

postLog = function (msg) {
    if (isWebWorker) {
        postMessage({eventName:"log", msg:msg})	;
    } else {
        console.log("worker:");
        console.log(msg);
    }
};

if (isWebWorker) {
    console = function () {};

    console.log = function(msg) {
        postLog("engine.js: "+msg);
    };

    importScripts('../lib/pollen-0.1.91.js');
}

var engine;

function resultReceiver(event) {
    if (isWebWorker) {
	    postMessage(event);
    } else {
        __MW.workerPostedMessage(event);
    }
}

function errorReceiver(event) {
  throw event.data;
}

var onmessageFunction = function(message) {
    DataSource.user = message.data.user;
	if (message.data.eventName == "initWithBlock") {
		engine = new Engine (message.data.block);
	} else if (message.data.eventName == "initWithBlockOfId") {
        DataSource.onBlockWithId(message.data.blockId, function (block) {
            engine = new Engine (block);
            resultReceiver(EngineMessage.fullBlockMessage(block));
        });
        return;
    } else if (message.data.eventName == "initWithNewBlock") {
        DataSource.newBlock(message.data.blockName, function (block) {
            engine = new Engine (block);
            resultReceiver(EngineMessage.fullBlockMessage(block));
        });
        return;
    } else if (message.data.eventName == "loadBlocks") {
        DataSource.getBlocks(function (block) {
            var e = new Engine (block);
            e.sendSummaryBlockData();
        });
        return;
    } else if (message.data.eventName == "deleteBlock") {
        DataSource.deleteBlock(message.data.blockId);
        return;
    } else if (message.data.eventName == "listChanged") {
        engine.changeList(message.data.listIndex, message.data.listData);
    } else if (message.data.eventName == "columnValueChanged") {
        engine.changeColumnValue(message.data);
	} else if (message.data.eventName == "prologChanged") {
        engine.changeProlog(message.data.prolog);
    } else if (message.data.eventName == "columnValueFunctionChanged") {
		engine.changeColumnValueFunction(message.data.listName, message.data.columnName, message.data.value);
	} else if (message.data.eventName == "columnChanged") {
		engine.changeColumn(message.data.listName,
				message.data.oldColumnName, message.data.newColumnName, message.data.type,  message.data.valueFunction);
	} else if (message.data.eventName == "singularChanged") {
		engine.changeSingular(message.data);
	} else if (message.data.eventName == "rowAdded") {
		var listName = message.data.listName;
		engine.addListRow(listName);
	} else if (message.data.eventName == "includeChanged") {
        engine.changeInclude(message.data);
    } else if (message.data.eventName == "readyForBlock") {
        // do nothing, just send the changed data (below)
    }

    // for now, do this on any message
    DataSource.updateBlock(engine.blockJson());
	engine.sendChangedData(resultReceiver);
};

if (isWebWorker) {
    onmessage = onmessageFunction;
} else {
    __MW.workerMessageHandler = onmessageFunction;
}