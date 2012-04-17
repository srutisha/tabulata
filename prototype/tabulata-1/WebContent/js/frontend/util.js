
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
