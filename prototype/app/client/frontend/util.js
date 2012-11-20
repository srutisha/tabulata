
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

function html() {

}

html.td = function(elem) {
	return html.crelem("td", elem);
};

html.tr = function(elem) {
	return html.crelem("tr", elem);
};

html.thead = function(elem) {
    return html.crelem("thead", elem);
};

html.tbody = function(elem) {
    return html.crelem("tbody", elem);
};

html.th = function(elem) {
	return html.crelem("th", elem);
};


html.div = function(elem) {
    return html.crelem("div", elem);
};

html.dl = function(elem) {
    return html.crelem("dl", elem);
};

html.dt = function(elem) {
    return html.crelem("dt", elem);
};

html.dd = function(elem) {
    return html.crelem("dd", elem);
};

html.span = function(elem) {
    return html.crelem("span", elem);
};


html.input = function (id, className, value) {
	var e = document.createElement("input");
	e.className = className;
	e.id = id;
	e.value = value;
	return e;
};

html.crelem = function (name, inside, id) {
	var elem = document.createElement(name);
	if (inside != undefined)
		$(elem).append(inside);
    if (id != undefined)
        elem.id = id;
	return elem;
};
