
importScripts('engine.js', 'datasource.js', 'interface/common.js', 'interface/engineMessage.js', '../lib/parser.js', '../lib/pollen-0.1.91.js');

var engine;

function resultReceiver(event) {
	postMessage(event);
}

function errorReceiver(event) {
  throw event.data;
}

onmessage = function(message) {
	if (message.data.eventName == "initWithBlock") {
		engine = new Engine (message.data.block);
	} else if (message.data.eventName == "initWithBlockOfId") {
        var block = DataSource.getBlockWithId(message.data.blockId);
        engine = new Engine (block);
        resultReceiver(EngineMessage.fullBlockMessage(block));
        return;
    } else if (message.data.eventName == "initWithNewBlock") {
        var block = DataSource.newBlock(message.data.blockName);
        engine = new Engine (block);
        resultReceiver(EngineMessage.fullBlockMessage(block));
        return;
    } else if (message.data.eventName == "loadBlocks") {
        var blocks = DataSource.getBlocks();
        blocks.forEach(function (block) {
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
				message.data.oldColumnName, message.data.newColumnName, message.data.type);
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
	postMessage({eventName:"log", msg:msg})	;
};