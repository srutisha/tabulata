
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

function ColumnExpressionEvaluator(ctx, list, exp) {
	this.ctx = ctx;
	this.ast = listcalcParser.parse(exp);
	this.compiled = this.handleNode(this.ast, AccessContext.list(list));

	eval("this.calcFn = function (idx) { with (this.ctx) { return "+this.compiled+"} }");
	
	this.evaluate = function (row) {
		return this.calcFn(row);
	};
}

ColumnExpressionEvaluator.prototype = ExpressionEvaluator.prototype;

ExpressionEvaluator.prototype.evaluateAst = function (ast) {
	var compiled = this.handleNode(ast, AccessContext.top());
	with (this.ctx) {
		// console.log(compiled);
		return eval(compiled);
	}
};


ExpressionEvaluator.prototype.handleNode = function (ast, ac) {
	switch(ast.type) {
	case "binaryFunction":
		return "(" + this.handleNode( ast.left , ac ) + ")" 
			+ ast.op + "("+ this.handleNode( ast.right , ac ) + ")";
		break;
	case "js":
		return "(" + ast.execution + ")";
		break;
	case "access":
		return this.handleAccess(ac, ast.data, ast.operand);
		break;
	case "identifier":
		return this.handleIdentifier(ac, ast.name, ast.param);
		break;
	default: 
		if (ObjUtil.isNumber(ast)) {
			return 'ObjUtil.stringToObject('+ast+')';
		}
	
		throw Error("Unknown ast node:"+ast);
	}
};

ExpressionEvaluator.prototype.handleAccess = function (ac, data, operand) {
	if (ac.top) {
		// top-level symbol is table
		if (this.ctx.listByName(data.name) != undefined) {
			var list = this.ctx.listByName(data.name);
			return this.handleNode(operand, AccessContext.list(list));
		} else throw Error("Top-level symbol not known: "+data.name);
	} else if (ac.list) {
		if (this.ctx.columnByListAndName(ac.list.name(), data.name)) {
			var col = this.ctx.columnByListAndName(ac.list.name(), data.name);
			return col.symbol() + ""
				+ this.handleNode(operand, AccessContext.column(col));
		} else throw Error("List column not known: "+data.name);
	} else if (ac.column || ac.valueList) {
		return this.handleNode(data, ac)+this.handleNode(operand, AccessContext.valueList());
	} else throw Error("Access not possible here: "+data+" "+operand);
};

ExpressionEvaluator.prototype.handleIdentifier = function (ac, name, param) {
	if (ac.top) {
		// top-level symbol is singular
		if (this.ctx.singularByName(name) != undefined) {
			var sg = this.ctx.singularByName(name);
			return sg.symbol()+".$V()";
		} else throw Error("Top-level symbol not known: "+name);
	} else if (ac.list) {
		if (this.ctx.columnByListAndName(ac.list.name(), name)) {
			var col = this.ctx.columnByListAndName(ac.list.name(), name);
			return col.symbol() +".$V(idx)";
		} else if (this.ctx.singularByName(name) != undefined) {
			var sg = this.ctx.singularByName(name);
			return sg.symbol()+".$V()";
		} else if (name === "count") {
			return ac.list.symbol()+".$_count()";
		} else throw Error("List column not known: "+name);
	} else if (ac.column) {
		if (name === "sum") {
			return ".$_sum()";
		} if (name === "count") {
			return ".$_count()";
		} if (name === "above") {
			return ".$V_above(idx)";
		} else if (name === "select") {
			if (param == undefined) throw Error("select needs param");
			return this.handleSelect(ac, param[0]);
		} else throw Error("column function not known: "+name);
	} else if (ac.valueList) {
		if (name === "sum") {
			return ".$_sum()";
		} if (name === "count") {
			return ".$_count()";
		} else throw Error("value list function not known: "+name);
	} else throw Error("cannot handle identifier here: "+name);
};

ExpressionEvaluator.prototype.handleSelect = function (ac, select) {
	if (select.type != "binaryFunction")  throw new Error("select needs a bin. function");
	return ".$_select(function(idx) { return " + this.handleNode(select, AccessContext.top()) + "; })";
};

function AccessContext() {
	this.top = false;
		
	this.list = false;
	this.column = false;
	
	this.valueList = false;
	
	this.value = false; // singular or function result
}

AccessContext.top = function () {
	var ac = new AccessContext();
	ac.top = true;
	return ac;
};
AccessContext.list = function (list) {
	var ac = new AccessContext();
	ac.list = list;
	return ac;
};
AccessContext.column = function (column) {
	var ac = new AccessContext();
	ac.column = column;
	return ac;
};
AccessContext.valueList = function () {
	var ac = new AccessContext();
	ac.valueList = true;
	return ac;
};
AccessContext.value = function () {
	var ac = new AccessContext();
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
	
	this.symbol = function () {
		return Symbols.listSymbol(self.name());
	};

    this.cname = function () {
        return list.name;
    };

	this.name = function () {
		return normalizeName(list.name);
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

	var exec = function (ctx, exp) {
		var cee = new ColumnExpressionEvaluator(ctx, list, exp);
		for (var i = 0; i < list.numRows(); i++) {
			with (ctx) {
				valueCache[i] = cee.evaluate(i);
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



