
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
        if (col.isAggregating()) {
            var dummy = col.values();
        }
    });
};

Engine.prototype.sendSingulars = function (rr) {
    this.ctx.allSingulars().forEach(function (sg) {
        var em = EngineMessage.updateSingularValue(sg.name(), sg.value());
        rr(em);
    });
};

Engine.prototype.sendChangedData = function (rr) {
    this.calculateAggregatingValueColumns();
	// for now, just send everything
	this.ctx.valueFunctionColumns().forEach(function(col) {
        if (col.valueFunction() != undefined && col.valueFunction().length > 0) {
            var em = EngineMessage.updateColumnValues(col.listName(), col.name(), col.values());
            em.isAggregated = col.list.isAggregated;
            rr(em);
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

function ExpressionEvaluator(ctx) {

	this.ctx = ctx;

	this.evaluateText = function (exp) {
		var ast = listcalcParser.parse(exp);
		return this.evaluateAst(ast);
	};
}

function NT () {};

NT.scalar = 1;
NT.list = 2;

function Node (exp, type) {
    this.type = type;
    this.exp = exp;
};

Node.c = function (exp, type) {
    type = type || NT.scalar;
    return new Node(exp, type);
};

Node.prototype.concat = function (b) {
    return new Node(this.exp+b.exp, b.type);
};

function ColumnExpressionEvaluator(ctx, list, exp) {
	this.ctx = ctx;
	this.ast = listcalcParser.parse(exp);
	this.compiledNode = this.handleNode(this.ast, AccessContext.list(list));
    if (this.compiledNode.type == NT.list) {
        eval("this.calcFnList = function () { with (this.ctx) { return "+this.compiledNode.exp+"} }");
        this.evaluate = function () {
            return this.calcFnList().values();
        }
    } else {
        eval("this.calcFn = function (idx0) { with (this.ctx) { return "+this.compiledNode.exp+"} }");
        this.evaluate = function (row) {

            return this.calcFn(row);
        };
    }
}

ColumnExpressionEvaluator.prototype = ExpressionEvaluator.prototype;

ExpressionEvaluator.prototype.evaluateAst = function (ast) {
	var compiled = this.handleNode(ast, AccessContext.top()).exp;
	with (this.ctx) {
		return eval(compiled);
	}
};


ExpressionEvaluator.prototype.handleNode = function (ast, ac) {
	switch(ast.type) {
	case "binaryFunction":
		return Node.c("(" + this.handleNode( ast.left , ac).exp + ")"
			+ ast.op + "("+ this.handleNode( ast.right , ac).exp + ")");
		break;
	case "js":
		return Node.c("(" + ast.execution + ")");
		break;
	case "access":
		return this.handleAccess(ac, ast.data, ast.operand);
		break;
	case "identifier":
		return this.handleIdentifier(ac, ast.name, ast.param);
		break;
	default:
		if (ObjUtil.isNumber(ast)) {
			return Node.c('ObjUtil.stringToObject('+ast+')');
		}

		throw Error("Unknown ast node:"+ast);
	}
};

ExpressionEvaluator.prototype.handleAccess = function (ac, data, operand) {
    var self = this;

    var checkListAccess = function () {
        return ac.list && self.ctx.columnByListAndName(ac.list.name(), data.name);
    };

	if (ac.top || ac.list) {
		// top-level symbol is table
		if (! checkListAccess() && this.ctx.listByName(data.name) != undefined) {
			var list = this.ctx.listByName(data.name);
			return this.handleNode(operand, AccessContext.list(list, ac));
		} if (this.ctx.includeByName(data.name)) {
            return this.handleInclude(ac, data, operand);
        } else {
            if (ac.top) {
                // when context is list, the list name is implicit, so
                // try next to look up the name directly by the AccessContext
                // in the next if
                throw Error("Top-level symbol not known: "+data.name);
            }
        }
	}
    if (ac.list) {
		if (this.ctx.columnByListAndName(ac.list.name(), data.name)) {
            var col = this.ctx.columnByListAndName(ac.list.name(), data.name);
            return Node.c(col.symbol()).concat(
                 this.handleNode(operand, AccessContext.column(col, ac)));
		} else throw Error("List column not known: "+data.name);
	} else if (ac.column || ac.valueList) {
		return this.handleNode(data, ac).concat(this.handleNode(operand, AccessContext.valueList()));
	} else throw Error("Access not possible here: "+data+" "+operand);
};

ExpressionEvaluator.prototype.handleInclude = function (ac, data, operand) {
    var inc = this.ctx.includeByName(data.name);
    var path = inc.symbol()+'.jsonData()';
    var self = this;

    while (operand.type == 'access') {
        path += '.' + operand.data.name;
        operand = operand.operand;
    }

    if (operand.type != 'identifier') {
        throw new Error("JSON include must end in identifier");
    } else {
        path += '.' + operand.name;
    }

    var prefix = '('+inc.symbol()+'.jsonReady()?';

    if (operand.param) {
        if (operand.param.type && operand.param.type == 'indexed') {
            if (operand.param.name == '') {
                return Node.c(prefix+'new ValueColumn(ctx, Object.keys('+path+'))'+':new ValueColumn(ctx,[]))', NT.list);
            } else {
                return Node.c(prefix+path+"["+this.handleIdentifier(ac, operand.param.name).exp+"]"+':0)');
            }
        } else {
            throw new Error("no parameter list allowed in JSON access")
        }
    }


};

ExpressionEvaluator.prototype.numericParams = function (param) {
    if (param == undefined || param.length == 0 ) return "";
    return param.map(function(m) {
        if (! ObjUtil.isNumber(m)) {
            throw new Error("Param must be numeric: "+m);
        }
        return "," + m;
    });
};

ExpressionEvaluator.prototype.handleIdentifier = function (ac, name, param) {
	if (ac.top) {
		// top-level symbol is singular
		if (this.ctx.singularByName(name) != undefined) {
			var sg = this.ctx.singularByName(name);
			return Node.c(sg.symbol()+".$V()");
		} else if (name == "If") {
            return this.handleIf(ac, param[0], param[1], param[2]);
        } else return Node.c("'"+name+"'"); //throw Error("Top-level symbol not known: "+name);
	} else if (ac.list) {
		if (this.ctx.columnByListAndName(ac.list.name(), name)) {
			var col = this.ctx.columnByListAndName(ac.list.name(), name);
            var idxName = ac.listIndexContext.makeIndex(ac.list);
			return Node.c(col.symbol() +".$V("+idxName+")");
		} else if (this.ctx.singularByName(name) != undefined) {
			var sg = this.ctx.singularByName(name);
			return Node.c(sg.symbol()+".$V()");
		} else if (name === "count") {
			return Node.c(ac.list.symbol()+".$_count()");
		} else if (name == "Sequence") {
            return Node.c('$fn.$Sequence(0'+this.numericParams(param)+')', NT.list);
        } else if (name == "If") {
            return this.handleIf(ac, param[0], param[1], param[2]);
        } else throw Error("List column not known: "+name);
	} else if (ac.column) {
        switch (name) {
            case "sum":
            case "count":
                return Node.c(".$_"+name+"()");
            case "uniques":
                return Node.c(".$_"+name+"()", NT.list);
            case "above":
                return Node.c(".$V_above(idx0"+this.numericParams(param)+")");
            case "select":
            case "selectFirst":
                if (param == undefined) throw Error(name + " needs param");
                return this.handleSelect(name, ac, param[0]);
            default:
                throw Error("column function not known: "+name);
        }
	} else if (ac.valueList) {
        switch (name) {
            case "sum":
            case "count":
                return Node.c(".$_"+name+"()");
            case "uniques":
                return Node.c(".$_"+name+"()", NT.list);
            default:
                throw Error("value list function not known: "+name);
        }
	} else throw Error("cannot handle identifier here: "+name);
};

ExpressionEvaluator.prototype.handleIf = function(ac, cond, trueNodeExp, falseNodeExp) {
    var trueNode = this.handleNode(trueNodeExp, ac);
    var falseNode = this.handleNode(falseNodeExp, ac);

    return Node.c(' ('+this.handleNode(cond, ac).exp
            +') ? ( '+trueNode.exp
            +') : ( '+falseNode.exp
            +')', trueNode.type);
}

ExpressionEvaluator.prototype.handleSelect = function (name, ac, select) {
	if (select.type != "binaryFunction")  throw new Error(name + " needs a bin. function as parameter");
    var newAc = ac.firstListContext();

    // TODO XXX "newAc" isn't really new, so state is changed where it shouldn't ->fix.
    newAc.listIndexContext.putList(ac.column.list);
	var ret =  Node.c(".$_"+name+"(function("+newAc.listIndexContext.makeIndex(ac.column.list)+") { return " + this.handleNode(select, newAc).exp + "; })");
    newAc.listIndexContext.removeList();
    return ret;
};

function ListIndexContext () {
    var map = new Array();
    var ci = 0;

    this.putList = function (list) {
        ci++;
        map.push({list: list, index: ci});
    };

    this.removeList = function () {
        ci--;
        map.pop();
    }

    this.makeIndex = function (list) {
        var me = map.filter(function(e) {
            return e.list == list;
        });

        if (me.length > 0) {
            return "idx"+ me[0].index;
        } else {
            return "idx0";
        }
    };
}


function AccessContext(previousContext) {
    var self = this;

    this.previousContext = previousContext;

    this.listIndexContext = previousContext ? previousContext.listIndexContext : new ListIndexContext();

	this.top = false;

	this.list = false;
	this.column = false;

	this.valueList = false;

	this.value = false; // singular or function result

    this.firstListContext = function () {
        var ac = self;
        var acl = undefined;
        while (ac.previousContext) {
            ac = ac.previousContext;
            if (ac.list) {
                acl = ac;
            }
        }
        return acl;
    };

    this.previousListContext = function () {
        if (this.previousContext) {
            if (this.previousContext.list) {
                return self.previousContext;
            } else {
                return self.previousContext.previousListContext();
            }
        }
        return self;
    };
}

AccessContext.top = function (ac) {
	var ac = new AccessContext(ac);
	ac.top = true;
	return ac;
};
AccessContext.list = function (list, ac) {
	var ac = new AccessContext(ac);
	ac.list = list;
	return ac;
};
AccessContext.column = function (column, ac) {
	var ac = new AccessContext(ac);
	ac.column = column;
	return ac;
};
AccessContext.valueList = function (ac) {
	var ac = new AccessContext(ac);
	ac.valueList = true;
	return ac;
};
AccessContext.value = function (ac) {
	var ac = new AccessContext(ac);
	ac.value = true;
	return ac;
};


Include = function (ctx, data, completeFn) {
    var self = this;

    var jsonDataHolder;
    var called = false;


    this.setName = function(name) {
        this.name = normalizeName(name);
        this.originalName = name;
    };

    this.setName(data.name);

    this.url = data.url;

    this.setUrl = function (url) {
        this.url = url;
        jsonDataHolder = undefined;
        called = false;
    };

    this.jsonReady = function () {
        this.jsonData();
        return jsonDataHolder != undefined;
    };

    this.jsonData = function() {
        if (!called && jsonDataHolder == undefined) {
            called = true;
            var ajaxCall = {
                url: this.url,
                dataType: 'json',
                success: function(jsonObj) {
                    jsonDataHolder = jsonObj;
                    completeFn();
                }
            };

            if ($.ajax.get != undefined) {
                $.ajax.get(ajaxCall);
            } else  {
                $.ajax(ajaxCall);
            }
        }
        return jsonDataHolder;
    };


    this.persistenceJsonData = function () {
        return {name: this.originalName, url: this.url};
    };

    this.symbol = function () {
        return Symbols.includeSymbol(self.name);
    };
};

Include.fromData = function fromData(ctx, data, completeFn) {
    var inc = new Include(ctx, data, completeFn);
    ctx[inc.symbol()] = inc;
    return inc;
};

function Singular(ctx, data) {
	var self = this;

	this.exp = data.value;

    this.isFavorite = data.isFavorite;

    this.jsonData = function () {
        return {'name': data.name, 'value': this.exp, 'isFavorite': this.isFavorite};
    };

    this.setExp = function (exp) {
        delete this.valueCache;
        this.exp = exp;
    };

    this.setFavorite = function (isFavorite) {
        this.isFavorite = isFavorite;
    };

	this.symbol = function () {
		return Symbols.singularSymbol(self.name());
	};

    this.humanName = function () {
        return data.name;
    };

	this.name = function () {
		return normalizeName(data.name);
	};

	this.value = function() {
		return ctx.evaluate(self.exp);
	};

	this.$V = function() {
        if (this.valueCache == undefined) {
            this.valueCache = this.value();
        }
		return this.valueCache;
	};
}

Singular.fromData = function (ctx, sgData) {
    var sg = new Singular(ctx, sgData);
    ctx[sg.symbol()] = sg;
    return sg;
};

Singular.changeSingular = function (ctx, cdata) {

	var sgData = {name: cdata.newName, value: cdata.exp, isFavorite: cdata.isFavorite};

	if (cdata.oldSymbol != undefined) {
		var oldSg = ctx[cdata.oldSymbol];

        if (cdata.exp != undefined) {
			oldSg.setExp(cdata.exp);
			return;
		}

        if (cdata.isFavorite != undefined) {
            oldSg.setFavorite(cdata.isFavorite);
            return;
        }

		sgData.value = oldSg.exp;
		ctx.replaceSingular(oldSg, sgData);
	} else {
		sgData.value = "";
        ctx.addSingular(sgData);
	}


};

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
        return this.isAggregated ? {
                'name': _list.name,
                'columns': cols
            } : {
                'name': _list.name,
                'numRows': this.numRows(),
                'columns': cols
            };
    };

    this.update = function (listData) {
        list.name = listData.name;
    };

    this.$_count = this.numRows;
}


function ValueColumn(ctx, valueArray) {
	this.ctx = ctx;
	this.valueArray = valueArray;
}

ValueColumn.prototype.values = function() {
	return this.valueArray;
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

ValueColumn.prototype.$_uniques = function () {
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

	//TODO NOT GOOD!! BAD PROGRAMMER!
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
		if (valueCache[idx] != undefined) return valueCache[idx];
		return ObjUtil.stringToObject(this.values()[idx]);
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
    }

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
}

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



