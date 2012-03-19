
var console = function () {};

console.log = function(msg) {
	postLog("engine.js: "+msg);
};

function Engine(block) {
	var self = this;
	
	this.ctx = new Context();
	
	block.singulars.forEach(function (sgData) {
		self.ctx.addSingular(sgData);
	});
	
	this.ctx.addList(block.lists[0]);
	
	//this.ctx.logMembers();
}


Engine.prototype.sendChangedData = function (rr) {
	// for now, just send everything
	this.ctx.valueFunctionColumns().forEach(function(col) {
		var em = EngineMessage.updateColumnValues(col.listName(), col.name(), col.values());
		rr(em);
	});
	
	this.ctx.allSingulars().forEach(function(sg) {
		var em = EngineMessage.updateSingularValue(sg.name(), sg.value());
		rr(em);
	});
};

function Context() {
	var self = this;
	var singulars = new Array();
	var columns = new Array();
	var lists = new Array();
	
	this.singularByName = function (sgName) { 
		return singulars.filter(function (sgn) {
			return sgn.name () == sgName;
		})[0];
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
	
	this.addSingular = function (sgData) {
		var sg = new Singular(self, sgData);
		self[sg.symbol()] = sg;
		singulars.push(sg);
	};
	
	this.addList = function (listData) {
		var list = new List(self, listData);
		listData.columns.forEach(function (col) {
			self.addColumn(list, col);
		});
		self[list.symbol()] = list;
		lists.push(list);
	};
	
	this.addColumn = function (list, colData) {
		var col = new Column(self, list, colData);
		self[col.symbol()] = col;
		columns.push(col);
	};
	
	this.logMembers = function () {
		for (var e in this) {
			console.log(e);
		}
	};
	
	this.evaluate = function (exp) {
		return new ExpressionEvaluator(self).evaluateText(exp);
	};
}

function ExpressionEvaluator(ctx) {
	
	this.ctx = ctx;
	
	this.evaluateText = function (exp, ac) {
		if (ac == undefined) ac = AccessContext.top();
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
} ;

// TODO this is not efficient
stringToObject = function(s) {
	switch ((''+s).toLowerCase()) {
		case "true": case "yes": case "1": return true;
		case "false": case "no": case "0": return false;
	}
	
	if ((''+s).match(/[\d.-]+/)) {
	    return parseFloat(s);
	}
	
	return s;
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
		// TODO: clean this up
		if ((''+ast).match(/[\d.-]+/)) {
			//console.log(ast);
			return 'stringToObject('+ast.join("")+')';
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
	} /*else if (ac.column && operand.type == "identifier" && operand.name == "above") {
		return ac.column.symbol()+".$V_above(idx)";
	} */else if (ac.column || ac.valueList) {
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
};

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
	
	this.symbol = function () {
		return Symbols.singularSymbol(self.name());
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

function List(ctx, list) {
	var self = this;
	
	this.symbol = function () {
		return Symbols.listSymbol(self.name());
	};
	
	this.name = function () {
		return normalizeName(list.name);
	};
	
	this.numRows = function () {
		return list.numRows;
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
		ret += stringToObject(v);
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
	
	var isData = content.values != undefined;
	this.isFunction = content.valueFunction != undefined;
	
	var valueCache = new Array();
	
	this.listName = function () {
		return list.name();
	};
	
	this.symbol = function () {
		return Symbols.columnSymbol(list.name(),self.name());
	};
	
	this.name = function () {
		return normalizeName(content.name);
	};
	
	this.updateValue = function (idx, value) {
		if (isData) {
			content.values[idx] = stringToObject(value);
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
		return this.values()[idx];
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
}

Column.prototype = ValueColumn.prototype;




