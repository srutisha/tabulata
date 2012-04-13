

BlockData = function (id, name, values) {
    this.id = id;
    this.name = name;
    this.values = values == undefined ? [] : values;
};

function ObjUtil() {

};

ObjUtil.isNumber = function (s) {
    return (''+s).match(/[\d.-]+/);
};

ObjUtil.stringToObject = function(s) {
    if (ObjUtil.isNumber(s)) {
        return parseFloat(s);
    }

    switch ((''+s).toLowerCase()) {
        case "true": case "yes": case "1": return true;
        case "false": case "no": case "0": return false;
    }

    if (s == "") {
        return 0;
    }

    return s;
};


function normalizeName(name) {
	return name.replace(/\s+/g, "");
}

function Symbols() {}


Symbols.columnSymbol = function (ln, n) {
	return "c_"+normalizeName(ln)+"_"+normalizeName(n);
};

Symbols.columnRowSymbol = function (ln, n, rowNumber) {
	return "c_"+normalizeName(ln)+"_"+normalizeName(n)+"_"+rowNumber;
};

Symbols.singularSymbol = function (n) {
	return "s_"+normalizeName(n);
};

Symbols.listSymbol = function (n) {
	return "l_"+normalizeName(n);
};

function setCursor(node,pos){

    var node = (typeof node == "string" || node instanceof String) ? document.getElementById(node) : node;

    if(!node){
        return false;
    }else if(node.createTextRange){
        var textRange = node.createTextRange();
        textRange.collapse(true);
        textRange.moveEnd(pos);
        textRange.moveStart(pos);
        textRange.select();
        return true;
    }else if(node.setSelectionRange){
        node.setSelectionRange(pos,pos);
        return true;
    }

    return false;
}