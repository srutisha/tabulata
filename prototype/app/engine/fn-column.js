
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

function ValueColumn(ctx, valueArray) {
    this.ctx = ctx;
    this.valueArray = valueArray;
};

ValueColumn.hasFunction = function (name) {
    return ValueColumn.prototype['$_' + name] != undefined;
};

ValueColumn.hasListFunction = function (name) {
    return ValueColumn.prototype['$l_' + name] != undefined;
}

ValueColumn.prototype.values = function() {
    return this.valueArray;
};

ValueColumn.prototype.$_mean = function () {
    return this.$_count() == 0 ? 0 : this.$_sum() / this.$_count();
};

ValueColumn.prototype.$_sum = function () {
    var ret = 0;
    this.values().forEach(function(v) {
        ret += ObjUtil.stringToObject(v);
    });
    return ret;
};

ValueColumn.prototype.$_count = function () {
    return this.values().length;
};

ValueColumn.prototype.$l_uniques = function () {
    return new ValueColumn(this.ctx, this.values().reduce(function (ar, ac) {
        if (ar.indexOf(ac) == -1) {
            ar.push(ac);
        }
        return ar;
    }, []).sort());
};

ValueColumn.prototype.$_select = function (fn) {
    var ret = new Array();
    for (var i=0; i<this.values().length; i++) {
        if (fn(i)) {
            ret.push(this.values()[i]);
        }
    }
    return new ValueColumn(this.ctx, ret);
};

ValueColumn.prototype.$_selectFirst = function (fn) {
    var vals = this.values();
    for (var i=0; i<vals.length; i++) {
        if (fn(i)) {
            return vals[i];
        }
    }
    return undefined;
};

function Column(ctx, list, content) {
    var self = this;
    this.ctx = ctx;
    this.list = list;

    var isData = content.values != undefined;
    this.isFunction = content.valueFunction != undefined;

    var valueCache = new Array();

    var cee;

    this.invalidateWhenNan = function () {
        if (valueCache.every(function (v) { return isNaN(v); })) {
            this.invalidateCache();
        }
    };

    this.listName = function () {
        return list.name();
    };

    this.valueFunction = function () {
        return content.valueFunction;
    }

    this.getContent = function () {
        return content;
    };

    this.symbol = function () {
        return Symbols.columnSymbol(list.name(),self.name());
    };

    this.setName = function (name) {
        content.name = name;
    };

    this.setDataType = function (dataType) {
        content.dataType = dataType;
    };

    this.name = function () {
        return normalizeName(content.name);
    };

    this.updateValue = function (idx, value) {
        if (isData) {
            content.values[idx] = ObjUtil.stringToObject(value);
        }
    };

    this.updateValueFunction = function (fn) {
        cee = undefined;
        valueCache = [];
        content.valueFunction = fn;
    };

    this.addRow = function () {
        if (isData) {
            content.values.push("");
        } else {
            this.invalidateCache();
        }
    };

    this.invalidateCache = function() {
        valueCache = [];
    };

    this.values = function () {
        if (isData) {
            return content.values;
        }
        if (this.isFunction) {
            return this.evaluate();
        }
    };

    this.$V_above = function (idx, offset) {
        offset = offset || 1;
        var fetchIdx = idx - offset;
        if (fetchIdx < 0) return 0.0;
        return this.$V(fetchIdx);
    };

    this.$V = function(idx) {
        return valueCache[idx] || ObjUtil.stringToObject(this.values()[idx]);
    };

    this.evaluate = function () {
        if (valueCache.length == 0)
            exec();
        return valueCache;
    };

    this.isAggregating = function () {
        return getCee().compiledNode.type == NT.list;
    };

    var getCee = function () {
        if (cee == undefined) {
            cee = new ColumnExpressionEvaluator(ctx, list, content.valueFunction);
        }
        return cee;
    };

    var exec = function () {
        var cee = getCee();
        if (cee.compiledNode.type == NT.list) {
            with (ctx) {
                valueCache = cee.evaluate();
                list.makeAggregate(valueCache.length);
            }
        } else {
            valueCache = [];
            for (var i = 0; i < list.numRows(); i++) {
                with (ctx) {
                    valueCache[i] = cee.evaluate(i);
                }
            }
        }
    };

    // ----------- persistence -------

    this.jsonData = function () {
        return content;
    };
};

Column.prototype = ValueColumn.prototype;

Column.prototype.replaceWith = function (newColData) {
    this.ctx.replaceColumn(this.list, this, newColData);
};

Column.changeColumn = function (ctx, listName, oldColumnName, newColumnName, type, valueFunction) {
    if (oldColumnName == undefined) {
        // new column
        ctx.addColumn(ctx.listByName(listName), Column.createColumnData(newColumnName, type, valueFunction));
    } else {
        var col = ctx.columnByListAndName(listName, normalizeName(oldColumnName));
        var content = col.getContent();
        content.name = newColumnName;

        if (type != undefined) {
            if (type == "values") {
                content.valueFunction = undefined;
                content.values = [];
            }
            if (type == "valueFunction") {
                content.values = undefined;
                content.valueFunction = valueFunction;
            }
        }

        col.replaceWith(content);
    }
};

Column.createColumnData = function (name, type, valueFunction) {
    if (type == "valueFunction") {
        return {name: name, valueFunction: valueFunction};
    } else {
        // default should be values
        return {name: name, values: []};
    }
};
