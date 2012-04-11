
function html() {
	
}

html.td = function(elem) {
	return html.crelem("td", elem);
};

html.tr = function(elem) {
	return html.crelem("tr", elem);
};

html.th = function(elem) {
	return html.crelem("th", elem);
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
