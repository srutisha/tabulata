
function List(ctx, _list) {
    var self = this;
    var list = _list;
    this.isAggregated = false;

    this.symbol = function () {
        return Symbols.listSymbol(self.name());
    };

    this.cname = function () {
        return list.name;
    };

    this.name = function () {
        return normalizeName(list.name);
    };

    this.makeAggregate = function (numRows) {
        self.isAggregated = true;
        list.numRows = numRows;
    };

    this.numRows = function () {
        return list.numRows;
    };

    this.addRow = function () {
        list.numRows ++;
        ctx.columnsByListObj(self).forEach(function (col) {
            col.addRow();
        });
    };

    this.jsonData = function () {
        var cols = ctx.columnsByListObj(self).map(function (col) { return col.jsonData(); });
        var obj = {
            'name': _list.name,
            'columns': cols
        };
        if (! this.isAggregated) {
            obj['numRows'] = this.numRows();
        }
        return obj;
    };

    this.update = function (listData) {
        list.name = listData.name;
    };

    this.$_count = this.numRows;
};
