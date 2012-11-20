
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
}

FrontendMessage.loadBlocks = function () {
    return new FrontendMessage("loadBlocks");
};

FrontendMessage.deleteBlock = function (blockId) {
    var fm = new FrontendMessage("deleteBlock");
    fm.blockId = blockId;
    return fm;
};

FrontendMessage.initWithBlockOfId = function (blockId) {
    var fm = new FrontendMessage("initWithBlockOfId");
    fm.blockId = blockId;
    return fm;
};

FrontendMessage.initWithNewBlock = function (blockName) {
    var fm = new FrontendMessage("initWithNewBlock");
    fm.blockName = blockName;
    return fm;
};

FrontendMessage.readyForBlock = function () {
    return new FrontendMessage("readyForBlock");
};

FrontendMessage.initWithBlock = function (block) {
	var fm = new FrontendMessage("initWithBlock");
	fm.block = block;
	return fm;
};

FrontendMessage.prologChanged = function (prolog) {
    var fm = new FrontendMessage("prologChanged");
    fm.prolog = prolog;
    return fm;
};

FrontendMessage.listChanged = function (listIndex, listData) {
    var fm = new FrontendMessage("listChanged");
    fm.listIndex = listIndex;
    fm.listData = listData;
    return fm;
};

FrontendMessage.columnValueChanged = function (listName, columnName, idx, value, dataType) {
	var fm = new FrontendMessage("columnValueChanged");
    fm.listName = listName;
    fm.columnName = columnName;
    fm.idx = idx;
    fm.value = value;
    fm.dataType = dataType;
	return fm;
};

FrontendMessage.columnValueFunctionChanged = function (listName, columnName, value) {
	var fm = new FrontendMessage("columnValueFunctionChanged");

	fm.listName = listName;
	fm.columnName = columnName;
	fm.value = value;

	return fm;
};

FrontendMessage.columnChanged = function (listName, oldColumnName, newColumnName, type, valueFunction) {
	var fm = new FrontendMessage("columnChanged");

	fm.listName = listName;
	fm.oldColumnName = oldColumnName;
	fm.newColumnName = newColumnName;
	fm.type = type;
    fm.valueFunction = valueFunction;

	return fm;
};

FrontendMessage.singularChanged = function (oldSymbol, sgNewName, sgExp, isFavorite) {
	var fm = new FrontendMessage("singularChanged");
	fm.oldSymbol = oldSymbol;
	fm.newName = sgNewName;
	fm.exp = sgExp;
    fm.isFavorite = isFavorite;
	return fm;
};

FrontendMessage.rowAdded = function (listName) {
	var fm = new FrontendMessage("rowAdded");
	fm.listName = listName;
	return fm;
};

FrontendMessage.includeChanged = function (index, name, url) {
    var fm = new FrontendMessage("includeChanged");
    fm.index = index;
    fm.name = name;
    fm.url = url;
    return fm;
};
