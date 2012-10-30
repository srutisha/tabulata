
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
