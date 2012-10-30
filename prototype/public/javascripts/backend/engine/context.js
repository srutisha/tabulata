function Context(engine, block) {
    var self = this;
    var singulars = new Array();
    var columns = new Array();
    var lists = new Array();
    var includes = new Array();
    var eng = engine;

    this.changeProlog = function (prolog) {
        block.prolog.name = prolog.name;
    };

    this.changeInclude = function (newInclude) {
        if (includes[newInclude.index] == undefined) {
            this.addInclude(newInclude);
            return;
        }

        var currentInclude = includes[newInclude.index];

        currentInclude.setName(newInclude.name);

        if (currentInclude.url != newInclude.url && newInclude.url.length > 0) {
            currentInclude.setUrl(newInclude.url);
        }
    };

    this.singularByName = function (sgName) {
        return singulars.filter(function (sgn) {
            return sgn.name () == sgName;
        })[0];
    };

    this.listByIndex = function (index) {
        return lists[index];
    };

    this.listByName = function (listName) {
        return lists.filter(function (list) {
            return list.name () == listName;
        })[0];
    };

    this.valueFunctionColumns = function () {
        return columns.filter(function (column) {
            return column.isFunction;
        });
    };

    this.allSingulars = function () {
        return singulars;
    };

    this.columnByListAndName = function (listName, colName) {
        return columns.filter(function (column) {
            return column.listName() == listName
                && column.name () == colName;
        })[0];
    };

    this.columnsByList = function (listName) {
        return columns.filter(function (column) {
            return column.listName() == listName;
        });
    };

    this.columnsByListObj = function (list) {
        return columns.filter(function (column) {
            return column.list == list;
        });
    };

    this.addSingular = function (sgData) {
        var sg = Singular.fromData(self, sgData);
        singulars.push(sg);
    };

    this.addInclude = function (includeData) {
        var inc = Include.fromData(self, includeData, eng.refetchFunction());
        includes.push(inc);
    };

    this.includeByName = function (includeName) {
        return includes.filter(function (inc) {
            return inc.name == includeName;
        })[0];
    };

    this.replaceSingular = function (sg, newSgData) {
        self[sg.symbol()] = undefined;
        var delIdx = -1;
        for (var i=0; i<singulars.length; i++) {
            if (singulars[i] === sg) {
                delIdx = i;
            }
        }

        if (newSgData) {
            singulars.splice(delIdx, 1, Singular.fromData(self, newSgData));
        } else {
            singulars.splice(delIdx, 1);
        }
    };

    this.removeColumn = function (col) {
        self[col.symbol()] = undefined;
        columns.splice(this.columnToIndex(col), 1);
    };

    this.columnToIndex = function (col) {
        var idx = -1;
        for (var i=0; i<columns.length; i++) {
            if (columns[i] === col) {
                idx = i;
            }
        }
        return idx;
    };

    this.replaceColumn = function(list, oldCol, newColData) {
        self[oldCol.symbol()] = undefined;
        var idx = this.columnToIndex(oldCol);
        var nc = new Column(self, list, newColData);
        self[nc.symbol()] = nc;
        columns[idx] = nc;
    };

    this.addList = function (listData) {
        var list = new List(self, listData);
        listData.columns.forEach(function (colData) {
            var col = self.addColumn(list, colData);
        });
        self[list.symbol()] = list;
        lists.push(list);
    };

    this.updateList = function(listIndex, listData) {
        var list = this.listByIndex(listIndex);

        if (list != undefined) {
            self[list.symbol()] = undefined;
            this.columnsByListObj(list).forEach(function (col) {
                self[col.symbol()] = undefined;
            });

            list.update(listData);

            self[list.symbol()] = list;
            this.columnsByListObj(list).forEach(function (col) {
                self[col.symbol()] = col;
            });
        } else {
            self.addList(listData);
        }
    };

    this.addColumn = function (list, colData) {
        var col = new Column(self, list, colData);
        self[col.symbol()] = col;
        columns.push(col);
        return col;
    };

    this.logMembers = function () {
        for (var e in this) {
            console.log(e);
        }
    };

    this.evaluate = function (exp) {
        return new ExpressionEvaluator(self).evaluateText(exp);
    };

    this.listNames  = function () {
        return lists.map(function (list) { return list.cname(); });
    };

    // -------- persistence -----------

    this.blockJson = function () {
        return {
            'prolog': block.prolog,
            'includes': this.includesJson(),
            'singulars': this.singularsJson(),
            'lists': this.listsJson()
        };
    };

    this.includesJson = function () {
        return includes.map(function (inc) { return inc.persistenceJsonData(); });
    };

    this.singularsJson = function () {
        return singulars.map(function (sg) { return sg.jsonData(); });
    };

    this.listsJson = function () {
        return lists.map(function (list) { return list.jsonData(); });
    };

    //--- FNs.

    this.$fn = new function () {};

    this.$fn.$_safeValue = function (valFn) {
        try {
            return valFn();
        } catch (e) {
            return 0;
        }
    };

    this.$fn.$Sequence = function (zz, a) {
        var ret = new Array();
        if (a == undefined) {
            a = 10;
        }
        for (var i=0;i<a;i++) {
            ret.push(i);
        }
        return new ValueColumn(self, ret);
    }

}
