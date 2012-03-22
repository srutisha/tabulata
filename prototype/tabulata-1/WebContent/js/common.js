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