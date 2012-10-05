
var isWebWorker = typeof(importScripts)!=="undefined";

var includes = ['engine.js', 'datasource.js', 'interface/common.js', 'interface/engineMessage.js', '../lib/parser.js'];
if (isWebWorker) {
    includes.forEach(function(i) {
        importScripts(i);
    });
    importScripts('../lib/pollen-0.1.91.js');

    console = function () {};

    console.log = function(msg) {
        postLog("engine.js: "+msg);
    };

} else {
    includes.forEach(function(i) {
        $.ajax({
            url: 'javascripts/backend/'+i,
            dataType: 'script',
            async: false
        });
    });
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


postLog = function (msg) {
    if (isWebWorker) {
    	postMessage({eventName:"log", msg:msg})	;
    } else {
        console.log("worker:");
        console.log(msg);
    }
};

console.log("here");

if (isWebWorker) {
    onmessage = onmessageFunction;
} else {
    __MW.workerMessageHandler = onmessageFunction;
}