
function Engine(block) {
	var self = this;

    this.block = block;

	this.ctx = new Context(self, block);

    this.isSummaryMode = false;

    if (block.singulars)
        block.singulars.forEach(function (sgData) {
            self.ctx.addSingular(sgData);
        });

    block.lists.forEach(function (listData) {
        self.ctx.addList(listData);
    });

    if (block.includes)
        block.includes.forEach(function (includeData) {
            self.ctx.addInclude(includeData);
        });
}

Engine.prototype.changeProlog = function (prolog) {
    this.ctx.changeProlog(prolog);
};

Engine.prototype.changeInclude = function (include) {
    this.ctx.changeInclude(include);
}

Engine.prototype.changeList = function (listIndex, listData) {
    this.ctx.updateList(listIndex, listData);
};

Engine.prototype.changeColumnValue = function (changeData) {
    var col = this.ctx.columnByListAndName(changeData.listName, changeData.columnName);
    if (changeData.dataType) {
        col.setDataType(changeData.dataType);
    } else {
        col.updateValue(changeData.idx, changeData.value);
        this.invalidateValueColumns();
    }
};

Engine.prototype.changeColumnValueFunction = function (listName, columnName, value) {
    var col = this.ctx.columnByListAndName(listName, columnName);
    col.updateValueFunction(value);
    this.invalidateValueColumns();
};

Engine.prototype.changeColumn = function (listName, oldColumnName, newColumnName, type, valueFunction) {
    Column.changeColumn(this.ctx, listName, oldColumnName, newColumnName, type, valueFunction);
};

Engine.prototype.changeSingular = function (cdata) {
    Singular.changeSingular(this.ctx, cdata);
    this.invalidateValueColumns();
};

Engine.prototype.addListRow = function (listName) {
    var list = this.ctx.listByName(listName);
    list.addRow();
};

Engine.prototype.listNames = function () {
    return this.ctx.listNames();
};

Engine.prototype.singularResultValues = function () {
    // calculate the values for aggregating columns,
    // as only calculating them will determine the contents
    // and correct calculation of dependent columns.
    this.calculateAggregatingValueColumns();

    return this.ctx.allSingulars().map(function (sg) {
        var sgName = sg.humanName();
        var sgValue = "-empty-";
        if (sgName == "") {
            sgName = "-empty-";
        }
        try {
            sgValue = sg.value();
        } catch (ex) {}

        return {name: sgName, resultValue: sgValue, isFavorite: sg.isFavorite };
    });
};

Engine.prototype.calculateAggregatingValueColumns = function() {
    this.ctx.valueFunctionColumns().forEach(function(col) {
        try {
            if (col.isAggregating()) {
                var dummy = col.values();
            }
        } catch (ex) {}
    });
};

Engine.prototype.sendSingulars = function (rr) {
    this.ctx.allSingulars().forEach(function (sg) {
        var sgValue;
        try {
            sgValue = sg.value();
        } catch (ex) {
            console.log(ex);
            sgValue = "#ERR#";
        }
        var em = EngineMessage.updateSingularValue(sg.name(), sgValue);
        rr(em);
    });
};

Engine.prototype.sendChangedData = function (rr) {
    this.calculateAggregatingValueColumns();
	// for now, just send everything
	this.ctx.valueFunctionColumns().forEach(function(col) {
        if (col.valueFunction() != undefined && col.valueFunction().length > 0) {
            try {
                var em = EngineMessage.updateColumnValues(col.listName(), col.name(), col.values());
                em.isAggregated = col.list.isAggregated;
                rr(em);
            } catch (ex) {
                rr(EngineMessage.updateColumnValues(col.listName(), col.name(), ["#ERR#"]));
                console.log(ex);
            }
        }
	});
    this.sendSingulars(rr);
};

Engine.prototype.invalidateNanColumns = function () {
    this.ctx.valueFunctionColumns().forEach(function(col) {
        col.invalidateWhenNan();
    });
};

Engine.prototype.invalidateValueColumns = function () {
    this.ctx.valueFunctionColumns().forEach(function(col) {
        col.invalidateCache();
    });
};

Engine.prototype.blockJson = function () {
    return this.ctx.blockJson();
};

Engine.prototype.sendSummaryBlockData = function () {
    this.isSummaryMode = true;
    var blockData = new BlockData(this.block.prolog, this.singularResultValues(), this.listNames());
    resultReceiver(EngineMessage.blockDataMessage(blockData));
};

Engine.prototype.refetchFunction = function() {
    var self = this;
    return function () {
        self.invalidateNanColumns();
        self.calculateAggregatingValueColumns();
        self.invalidateNanColumns();
        if (self.isSummaryMode) {
            self.sendSummaryBlockData();
        } else {
            self.sendChangedData(resultReceiver);
        }
    };
};
