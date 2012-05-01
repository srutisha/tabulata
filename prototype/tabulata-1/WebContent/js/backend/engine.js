
var console = function () {};

console.log = function(msg) {
	postLog("engine.js: "+msg);
};

function Engine(block) {
	var self = this;
	
	this.ctx = new Context(block);
	
	block.singulars.forEach(function (sgData) {
		self.ctx.addSingular(sgData);
	});

    block.lists.forEach(function (listData) {
        self.ctx.addList(listData);
    });
}

Engine.prototype.changeProlog = function (prolog) {
    this.ctx.changeProlog(prolog);
};

Engine.prototype.changeList = function (listIndex, listData) {
    this.ctx.updateList(listIndex, listData);
};

Engine.prototype.changeColumnValue = function (changeData) {
    var col = this.ctx.columnByListAndName(changeData.listName, changeData.columnName);
    col.updateValue(changeData.idx, changeData.value)
};

Engine.prototype.changeColumnValueFunction = function (listName, columnName, value) {
    var col = this.ctx.columnByListAndName(listName, columnName);
    col.updateValueFunction(value)
};

Engine.prototype.changeColumn = function (listName, oldColumnName, newColumnName, type) {
    Column.changeColumn(this.ctx, listName, oldColumnName, newColumnName, type);
};

Engine.prototype.changeSingular = function (cdata) {
    Singular.changeSingular(this.ctx, cdata);
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
    this.ctx.valueFunctionColumns().forEach(function(col) {
        if (col.isAggregating()) {
            var dummy = col.values();
        }
    });

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

Engine.prototype.sendSingulars = function (rr) {
    this.ctx.allSingulars().forEach(function (sg) {
        var em = EngineMessage.updateSingularValue(sg.name(), sg.value());
        rr(em);
    });
};

Engine.prototype.sendChangedData = function (rr) {
	// for now, just send everything
	this.ctx.valueFunctionColumns().forEach(function(col) {
		var em = EngineMessage.updateColumnValues(col.listName(), col.name(), col.values());
        em.isAggregated = col.list.isAggregated;
		rr(em);
	});
    this.sendSingulars(rr);
};

Engine.prototype.blockJson = function () {
    return this.ctx.blockJson();
};

function Context(block) {
	var self = this;
	var singulars = new Array();
	var columns = new Array();
	var lists = new Array();

    this.changeProlog = function (prolog) {
        block.prolog.name = prolog.name;
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
		var delIdx = -1;
		for (var i=0; i<columns.length; i++) {
			if (columns[i] === col) {
				delIdx = i;
			}
		}
		columns.splice(delIdx, 1);
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
            'singulars': this.singularsJson(),
            'lists': this.listsJson()
        };
    };

    this.singularsJson = function () {
        return singulars.map(function (sg) { return sg.jsonData(); });
    };

    this.listsJson = function () {
        return lists.map(function (list) { return list.jsonData(); });
    };

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
            return this.calcFnList();
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
		// console.log(compiled);
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
	if (ac.top || ac.list) {
		// top-level symbol is table
		if (this.ctx.listByName(data.name) != undefined) {
			var list = this.ctx.listByName(data.name);
			return this.handleNode(operand, AccessContext.list(list, ac));
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

ExpressionEvaluator.prototype.handleIdentifier = function (ac, name, param) {
	if (ac.top) {
		// top-level symbol is singular
		if (this.ctx.singularByName(name) != undefined) {
			var sg = this.ctx.singularByName(name);
			return Node.c(sg.symbol()+".$V()");
		} else throw Error("Top-level symbol not known: "+name);
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
		} else throw Error("List column not known: "+name);
	} else if (ac.column) {
        switch (name) {
            case "sum":
            case "count":
                return Node.c(".$_"+name+"()");
            case "uniques":
                return Node.c(".$_"+name+"()", NT.list);
            case "above":
                return Node.c(".$V_above(idx0)");
            case "select":
                if (param == undefined) throw Error("select needs param");
                return this.handleSelect(ac, param[0]);
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

ExpressionEvaluator.prototype.handleSelect = function (ac, select) {
	if (select.type != "binaryFunction")  throw new Error("select needs a bin. function");
    var newAc = ac.firstListContext();
    newAc.listIndexContext.putList(ac.column.list);
	return Node.c(".$_select(function("+newAc.listIndexContext.makeIndex(ac.column.list)+") { return " + this.handleNode(select, newAc).exp + "; })");
};

function ListIndexContext () {
    var map = new Array();
    var ci = 0;

    this.putList = function (list) {
        ci++;
        map.push({list: list, index: ci});
    };

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


function Singular(ctx, data) {
	var self = this;
	
	this.exp = data.value;

    this.isFavorite = data.isFavorite;

    this.jsonData = function () {
        return {'name': data.name, 'value': this.exp, 'isFavorite': this.isFavorite};
    };

    this.setExp = function (exp) {
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
		return this.$V();
	};
	
	this.$V = function() {
		return ctx.evaluate(self.exp);
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
        return {
            'name': _list.name,
            'numRows': this.numRows(),
            'isAggregated': this.isAggregated,
            'columns': ctx.columnsByListObj(self).map(function (col) { return col.jsonData(); })
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
    return this.values().reduce(function (ar, ac) {
        if (ar.indexOf(ac) == -1) {
            ar.push(ac);
        }
        return ar;
    }, []).sort();
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


function Column(ctx, list, content) {
	var self = this;
	this.ctx = ctx;
	this.list = list;

	var isData = content.values != undefined;
	this.isFunction = content.valueFunction != undefined;

	var valueCache = new Array();

	this.listName = function () {
		return list.name();
	};

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

	this.name = function () {
		return normalizeName(content.name);
	};

	this.updateValue = function (idx, value) {
		if (isData) {
			content.values[idx] = ObjUtil.stringToObject(value);
		}
	};

	this.updateValueFunction = function (fn) {
		content.valueFunction = fn;
	};

	this.addRow = function () {
		if (isData) {
			content.values.push("");
		}
	};

	this.values = function () {
		if (isData) {
			return content.values;
		}
		if (this.isFunction) {
			return this.evaluate();
		}
	};

	this.$V_above = function (idx) {
		if (idx == 0) return 0.0;
		return this.$V(idx-1);
	};

	this.$V = function(idx) {
		if (valueCache[idx] != undefined) return valueCache[idx];
		return ObjUtil.stringToObject(this.values()[idx]);
	};

	this.evaluate = function () {
		exec(ctx, content.valueFunction);
		return valueCache;
	};

    this.isAggregating = function () {
        var cee = new ColumnExpressionEvaluator(ctx, list, content.valueFunction);
        return cee.compiledNode.type == NT.list;
    };

	var exec = function (ctx, exp) {
		var cee = new ColumnExpressionEvaluator(ctx, list, exp);
        if (cee.compiledNode.type == NT.list) {
            with (ctx) {
                valueCache = cee.evaluate();
                list.makeAggregate(valueCache.length);
            }
        } else {
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
	this.ctx.removeColumn(this);
	this.ctx.addColumn(this.list, newColData);
};

Column.changeColumn = function (ctx, listName, oldColumnName, newColumnName, type) {
	if (oldColumnName == undefined) {
		// new column
		ctx.addColumn(ctx.listByName(listName), Column.createColumnData(newColumnName, type));
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
				content.valueFunction = "";
			}
		}
		
		col.replaceWith(content);
	}
};

Column.createColumnData = function (name, type) {
	if (type == "valueFunction") {
		return {name: name, valueFunction: ""};
	} else {
		// default should be values
		return {name: name, values: []};
	}
};



