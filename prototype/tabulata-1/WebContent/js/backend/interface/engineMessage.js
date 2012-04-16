
function EngineMessage(eventName, appliesTo) {
	 this.eventName = eventName;
	 this.appliesTo = appliesTo;
};

EngineMessage.updateSingularValue = function(sgName, value) {
	var em = new EngineMessage("updateSingular", sgName);
	em.value = value;
	return em;
};

EngineMessage.updateColumnValues = function (listName, columnName, values) {
	var em = new EngineMessage("updateColumn");
	em.listName = listName;
	em.columnName = columnName;
	em.values = values;
	return em;
};

EngineMessage.blockDataMessage = function(blockData) {
    var em = new EngineMessage("blockDataMessage");
    em.data = blockData;
    return em;
};

EngineMessage.fullBlockMessage = function(block) {
    var em = new EngineMessage("fullBlockMessage");
    em.block = block;
    return em;
};

function FrontendMessage(eventName) {
	this.eventName = eventName;
};

FrontendMessage.loadBlocks = function () {
    var fm = new FrontendMessage("loadBlocks");
    return fm;
};

FrontendMessage.initWithBlockOfId = function (blockId) {
    var fm = new FrontendMessage("initWithBlockOfId");
    fm.blockId = blockId;
    return fm;
};

FrontendMessage.readyForBlock = function () {
    var fm = new FrontendMessage("readyForBlock");
    return fm;
};

FrontendMessage.initWithBlock = function (block) {
	var fm = new FrontendMessage("initWithBlock");
	fm.block = block;
	return fm;
};

FrontendMessage.columnValueChanged = function (colRowSymbol, value) {
	var fm = new FrontendMessage("columnValueChanged");
	fm.colRowSymbol = colRowSymbol;
	fm.value = value;
	return fm;
};

FrontendMessage.columnValueFunctionChanged = function (listName, columName, value) {
	var fm = new FrontendMessage("columnValueFunctionChanged");
	
	fm.listName = listName;
	fm.columnName = columName;
	fm.value = value;
	
	return fm;
};

FrontendMessage.columnChanged = function (listName, oldColumnName, newColumnName, type) {
	var fm = new FrontendMessage("columnChanged");
	
	fm.listName = listName;
	fm.oldColumnName = oldColumnName;
	fm.newColumnName = newColumnName;
	
	fm.type = type;
	
	return fm;
};

FrontendMessage.singularExpChanged = function (sgSymbol, exp) {
	var fm = new FrontendMessage("singularExpChanged");
	fm.sgSymbol = sgSymbol;
	fm.exp = exp;
	return fm;
};

FrontendMessage.singularChanged = function (oldSymbol, sgNewName, sgExp) {
	var fm = new FrontendMessage("singularChanged");
	fm.oldSymbol = oldSymbol;
	fm.newName = sgNewName;
	fm.exp = sgExp;
	return fm;
};

FrontendMessage.rowAdded = function (listName) {
	var fm = new FrontendMessage("rowAdded");
	fm.listName = listName;
	return fm;
};


