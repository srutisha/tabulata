
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

function FrontendMessage(eventName) {
	this.eventName = eventName;
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


