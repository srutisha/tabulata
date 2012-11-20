

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

BlockData = function (prolog, values, listNames) {
    this.prolog = prolog;
    this.values = values == undefined ? [] : values;
    this.listNames = listNames;
};

function ObjUtil() {

}

ObjUtil.stdFormatIfNumber = function (n) {
    if (ObjUtil.isNumber(n)) {
        // at most 2 places after the decimal point
        return Math.round(n*100)/100;
    }
    return n;
};

ObjUtil.isNumber = function (s) {
    return (''+s).match(/^[\d.-]+/);
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

Symbols.includeSymbol = function (n) {
    return "i_"+normalizeName(n);
}

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