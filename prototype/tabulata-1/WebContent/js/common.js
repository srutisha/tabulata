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

