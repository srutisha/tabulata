
importScripts('engine.js', 'common.js', 'engineMessage.js', 'parser.js');

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
	} else if (message.data.eventName == "columnValueChanged") {
		var target = message.data.colRowSymbol.split("_");
		var col = engine.ctx.columnByListAndName(target[1], target[2]);
		col.updateValue(target[3], message.data.value);
	} else if (message.data.eventName == "singularExpChanged") {
		var sgName = message.data.sgSymbol.split(/_/)[1];
		var exp = message.data.exp;
		var sg = engine.ctx.singularByName(sgName);
		sg.exp = exp;
	} else if (message.data.eventName == "singularChanged") {
		var oldSymbol = message.data.oldSymbol;
		var sgNewName = message.data.newName;
		var sgExp = message.data.exp;
		Singular.changeSingular(engine.ctx, oldSymbol, sgNewName, sgExp);
	} else if (message.data.eventName == "rowAdded") {
		var listName = message.data.listName;
		var list = engine.ctx.listByName(listName);
		list.addRow();
		engine.ctx.columnsByList(listName).forEach(function (col) {
			col.addRow();
		});
	}
	// for now, do this on any message
	engine.sendChangedData(resultReceiver);
};


postLog = function (msg) {
	postMessage({eventName:"log", msg:msg})	;
};