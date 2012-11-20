
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
