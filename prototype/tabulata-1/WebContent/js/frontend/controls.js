
function SingularControl() {
	this.size = 0;
	
	this.newCounter = 0;
	
	this.build = function () {
		$("#stbl").append(html.tr([html.td(this.createAddButton()), html.td()]));
	};
	
	this.addRow = function (button) {
		$(button).parent().parent().before(this.createRow(this.newCounter++, "", ""));
		this.size ++;
		il.update();
		this.updateOffset();
	};
	
	this.updateOffset = function () {
		var refElem = $("#bottom-singulars");
		var topIdx = refElem.offset().top + 6;

        $("#listselectwrapper").css('top', topIdx + "px");

        topIdx += $("#listselectwrapper").height();
		$("#mainwrapper").css('top', topIdx + "px");
		var bottom = $(window).height();
		$("#mainwrapper").css('height', (bottom - topIdx) + "px");
		$("#main").css('height', (bottom - topIdx) + "px");
        $("#mtbl tbody").css('height', (bottom - topIdx - 25 - c.KEYBOARD_HEIGHT) + "px");
	};
	
	this.createRow = function (id, key, value, isFavorite) {
		var tdcont = [html.td(this.createFavorite(isFavorite)), html.td(this.createInputFieldKey(id, key)), html.td(this.createInputFieldValue(id, value))];
		return html.tr(tdcont);
	};
	
	this.init = function (singulars) {
        this.size = 0;
		$("#stbl").html("");
		for (var i = 0; i<singulars.length; i++) {
			$("#stbl").append(this.createRow(Symbols.singularSymbol(singulars[i].name),
					singulars[i].name, singulars[i].value, singulars[i].isFavorite));
			this.size ++;
		}
		//recreate the button
		this.build();
		this.updateOffset();
	};

    this.createFavorite = function (isFavorite) {
        var sp = html.span();
        var starclass = isFavorite ? "sg-starred" : "sg-unstarred";
        $(sp).addClass("sg-star "+starclass);
        return sp;
    };
	
	this.createInputFieldKey = function(symbol, key) {
		if (key == undefined) key = "";
		return html.input(SingularControl.keyId(symbol), 'inp-key', key);
	};
	
	this.createInputFieldValue = function(symbol, value) {
		if (value == undefined) value = "";
		var e = html.input (SingularControl.valueId(symbol), 'inp-value', value);
		e.dataset.exp = value;
		return e;
	};
	
	this.createAddButton = function () {
		var e = html.input('scAddRow', 'input-button add-button', '+');
		e.type = 'button';
		return e;
	};
	
	this.infoText = function () {
		return "Singulars: "+this.size;
	};
}

SingularControl.valueId = function(symbol) {
	return "v_"+symbol;
};

SingularControl.keyId = function(symbol) {
	return "k_"+symbol;
};

function ListSelectControl() {
    var self = this;
    var lists;

    this.activeIndex = 0;

    this.init = function (_lists) {
        lists = _lists;
        self.render(lists);
    };

    this.selected = function (targetElem) {
        $(".listselect-active")
            .toggleClass("listselect-inactive")
            .toggleClass("listselect-active")
            .attr("readonly", true);
        $(targetElem)
            .toggleClass("listselect-active")
            .toggleClass("listselect-inactive")
            .removeAttr("readonly");
        var idx = targetElem.id.match(/\d+/);
        lc.init(lists[idx]);
        il.update();
        sc.updateOffset();

        ef.sendEvent(FrontendMessage.readyForBlock());
    };

    this.render = function (lists) {
        $("#listselect").empty();
        lists.forEach(function (list, idx) {
            $(idx == self.activeIndex ? self.renderActive(idx, list) : self.renderToSelect(idx, list)).appendTo("#listselect");
        });
        $("#listselect").trigger('create');
    };

    this.renderActive = function (idx, list) {
       return styleInput(html.input("listselect-input-"+idx, "listselect-active", list.name));
    };

    this.renderToSelect = function (idx, list) {
        return readonly(styleInput(html.input("listselect-input-"+idx, "listselect-inactive", list.name)));
    };

    var readonly = function (inp) {
        inp.readOnly = true;
        return inp;
    };

    var styleInput = function (inp) {
        inp.dataset.mini = true;
        // TODO jqm doesn't recognize inline with input fields (stupid). it's not overridden in the css.
        inp.dataset.inline = true;

        return inp;
    };
}

function ListControl() {
	var self = this;
	
	var dimensions = {'x': 1, 'y' : 1};
	
	var _list = new Array();
	
	var columnCounter = 0;
	
	this.genColumnClassName = function (idx) {
		if (idx == undefined) idx = columnCounter;
		return " list_col_"+idx;
	};

	this.changeColumnName = function (oldName, newName) {
		_list.columns.forEach(function(col) {
			if (col.name == oldName) {
				col.name = newName;
			}
		});
	};
	
	this.build = function () {
	};

	
	var createFieldNode = function (col, colNr, row) {
		var id = Symbols.columnRowSymbol(self.cn(), col.name, row);
		var co = DetailControlFactory.getControlObject(col.type);
		var value = "";
		var isEditable = false;
		
		if (col.values) {
			value = col.values[row];
			isEditable = true;
		}
		
		return html.td(co.renderToDisplay(id, self.genColumnClassName(colNr), isEditable, value));
	};

    this.myIdx = -1;

    var initNameMapping = function () {
        ListControl.indexToName[ListControl.nextListIndex] = normalizeName(_list.name);
        self.myIdx = ListControl.nextListIndex;
        ListControl.nextListIndex ++;
    };

    this.cn = function () {
        return ""+this.myIdx;
    };

	this.init = function (list) {
		_list = list;
		$("#mtbl").html("");

        initNameMapping();
		
		var headers = new Array();
		
		list.columns.forEach(function (col, idx) {
            var th = html.th(self.createHeaderField(col, idx));
			headers.push(th);
		});

		headers.push(html.th());

		$("#mtbl").append(html.thead(html.tr(headers)));

        var allRows = [];
		
		for (var row=0; row<list.numRows; row++) {
			var c = new Array();
			
			list.columns.forEach(function (col, idx) {
				 c.push(createFieldNode(col, idx, row));
			});
			
			if (row==0) {
				c.push(html.td(self.createAddColumnButton()));
			} else {
				c.push(html.td());
			}
			
			allRows.push(html.tr(c));
		}

		var footer = new Array();
		
		footer.push(html.td(self.createAddRowButton()));
		for (var col=1; col<list.columns.length+1; col++) {
			footer.push(html.td());
		}

        allRows.push(html.tr(footer));
		
		$("#mtbl").append(html.tbody(allRows));

		columnCounter = dimensions.x = list.columns.length;
		dimensions.y = list.numRows;
	};
	
	this.createHeaderField = function(col, idx) {
		var hi = document.createElement("input");
		hi.className = 'hed-act'+self.genColumnClassName(idx);

		if (col == null) {
			hi.id = Symbols.columnRowSymbol(self.cn(), "" + columnCounter, "H");
			$(hi).data("name", undefined);
		} else {
			hi.value = col.name;
			hi.id = Symbols.columnRowSymbol(self.cn(), col.name, "H");
			
			$(hi).data("name", col.name);
			
			if (col.valueFunction) {
				hi.dataset.exp = col.valueFunction;
			}
		}


		return hi;
	};
	
	this.createAddRowButton = function() {
		return this.createAddButton("lcAddRowButton");
	};
	
	this.createAddColumnButton = function() {
		return this.createAddButton("lcAddColumnButton");
	};
	
	this.createAddButton = function(id) {
		var e = html.input(id, 'add-button', '+');
		e.type = 'button';
		return e;
	};
	
	this.addRow = function(button) {
		var tr = $(button).parent().parent().get(0);
		
		$(tr).children().each(function(index){
			if (index == dimensions.x) {
				// last cell
				$(this).empty();
			} else {
				$(this).replaceWith(createFieldNode(_list.columns[index], index, _list.numRows));
			}
		});
		
		_list.numRows++;

		var newrow = new Array();
		newrow.push(html.td(this.createAddRowButton()));
		for (var i = 0; i<dimensions.x; i++) {
			newrow.push(html.td());
		}

		$(tr).after(html.tr(newrow));
		
		dimensions.y ++;
		
		ef.sendEvent(FrontendMessage.rowAdded(normalizeName(_list.name)));
		il.update();
	};
	
	this.addColumn = function(button) {
		var tr = $(button).parent().parent().get(0);
		
		var col = _list.columns[dimensions.x] = {name: ""+columnCounter, values: []};
		
		$(button).parent().replaceWith(createFieldNode(col, dimensions.x, 0));
		$(tr).append(html.td(this.createAddColumnButton()));
		
		var hr = $(tr).parents("table").find("thead>tr");
		var headerField = this.createHeaderField(null, columnCounter);
		$(hr).children().last().append(headerField);
		$(hr).append(html.th());
		
		var cr = tr;
		for (var i=1; i<dimensions.y; i++) {
			cr = $(cr).next();
			$(cr).children().last().replaceWith(createFieldNode(col, dimensions.x, i));
			$(cr).append(html.td());
		}
		
		$(cr).next().append(html.td());
		
		dimensions.x ++;
		columnCounter ++;

		il.update();
		
		return headerField;
	};

    this.changeColumnValue = function (listIdx, columnName, rowIdx, newValue) {
        this.columnWithName(columnName).values[rowIdx] = newValue;
        ef.sendEvent(FrontendMessage.columnValueChanged(ListControl.lname(listIdx),
            columnName, rowIdx, newValue));
    };

	this.changeColumnType = function (listIdx, columnName, type) {
        TextInputControl.changeValueType( listIdx, columnName, type );
        this.changeTypeInListData(columnName, type);
		ef.sendEvent( FrontendMessage.columnChanged( ListControl.lname(listIdx), columnName, columnName, type ) );
	};

    this.columnWithName = function (columnName) {
        var ret = undefined;
        _list.columns.forEach(function (col) {
            if (normalizeName(col.name) == columnName) {
                ret = col;
            }
        });
        return ret;
    };

    this.getColumnDataType = function (columnName) {
        return this.columnWithName(columnName).type;
    };

    this.setColumnDataType = function (columnName, newType) {
        this.columnWithName(columnName).type = newType;
    };
	
	this.changeTypeInListData = function (columnName, type) {
        var col = this.columnWithName(columnName);

        if (type == "values" ) {
            delete col.valueFunction;
            col.values = [];
        }

        if (type == "valueFunction") {
            delete col.values;
            col.valueFunction = [];
        }
	};
	
	
	this.infoText = function () {
		return "Dimensions: x="+dimensions.x+ ",  &nbsp; y=" + dimensions.y;
	};
}

ListControl.lname = function listIndexToName (idx) {
    return ListControl.indexToName[idx];
};

ListControl.idx = function nameToListIndex (name) {
    var idx = -1;
    ListControl.indexToName.forEach(function (v, i) {
        if (v == name) {
            idx = i;
        }
    });
    return ""+idx;
};

ListControl.nextListIndex = 0;
ListControl.indexToName = [];