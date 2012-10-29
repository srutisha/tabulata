

function DetailPageController () {

}

var sc, lc, il, lsc, incc;

DetailPageController.init = function () {
    sc = new SingularControl();
    sc.build();
    lc = new ListControl();

    il = new InfoLine([sc, lc]);

    lsc = new ListSelectControl();

    incc = new IncludesControl();

    DetailPageController.attachEvents();
    EditPane.attachEvents();
};

DetailPageController.attachEvents = function () {
    DetailPageController.attachSingularEvents();
    DetailPageController.attachListEvents();
    DetailPageController.attachSelectControlEvents();
    $("#navigation-to-home").on("tap", function (event) {
        $(".page-home").css("display", "block");
        $(".page-detail").css("display", "none");
        $("#info").html("");
        document.title = "home -- tabulata";
        ef.sendEvent(FrontendMessage.loadBlocks());
    });

    $("#block-title").on("focusout", function () {
        var title = $("#block-title").val();
        ef.sendEvent(FrontendMessage.prologChanged({'name': title}));
    });

    $("#open-includes").on("tap", function (event) {
        $('#includes').toggle();
        $("#open-includes").toggleClass('open');
    });
};

DetailPageController.loadBlock = function(block) {
    $(".page-home").css("display", "none");
    $(".page-detail").css("display", "block");

    document.title = block.prolog.name + " -- tabulata";
    sc.init(block.singulars);
    $("#block-title").val(block.prolog.name);

    lc.clear();

    if (block.lists.length > 0) {
        lc.init(0, block.lists[0]);
        $('#no-list-message').hide();
    } else {
        $('#no-list-message').show();
    }

    lsc.init(block.lists);

    incc.init(block.includes);

    il.update();
    sc.updateOffset();

    ef.sendEvent(FrontendMessage.readyForBlock());
};

DetailPageController.attachSelectControlEvents = function () {
    $("#listselect").on("tap", ".listselect-inactive", function (event) {
        lsc.selected(event.target);
        event.preventDefault();
    });

    $("#listselect").on("focusout", ".listselect-active", function (event) {
        lsc.changed(event.target);
    });

    $("#listselect").on("tap", "#listselect-new-list", function (event) {
        lsc.createNew();
        event.preventDefault();
    });

};

DetailPageController.updateColumnEventReceived = function (data) {
    var idx = ListControl.idx(data.listName);
    if (idx != lsc.activeIndex) {
        return;
    }

    if (data.isAggregated) {
        lc.makeAggregate(data.values.length);
    }

    var isNumericColumn = _.every(data.values, ObjUtil.isNumber);
    var numberOfAfterComma;
    var values = data.values;

    if (isNumericColumn) {
        values = _.map(values, function (value) {
            return Math.round(value*10000)/10000; // chop off stray decimal places
        });
        numberOfAfterComma = _.reduce(values, function (memo, value) {
            var decimalIndex = (""+value).indexOf('.');
            if (decimalIndex < 0) return memo;
            var numberOfPlaces = (""+value).length - decimalIndex - 1;
            return Math.max(memo, Math.min(4, numberOfPlaces));
        }, 0);
    }

    for (var i=0; i<values.length; i++) {
        var id = Symbols.columnRowSymbol(idx, data.columnName, i);
        var value = values[i];
        if (isNumericColumn) {
            $("#"+id).addClass("control-type-number");
            value = value.toFixed(numberOfAfterComma);
        }
        $("#"+id).val(value);
    }
};

DetailPageController.updateSingularEventReceived = function (data) {
    var id = Symbols.singularSymbol(data.appliesTo);
    var inp = $("#v_"+id);
    if (inp.data("locked")) {
        return;
    }
    inp.val(data.value);
};

DetailPageController.attachSingularEvents = function () {
    $("#stbl").on("tap, focus", ".inp-value", function (event) {
        $(event.target).data("locked", true);
        $(event.target).val(event.target.dataset.exp);
        $(event.target).removeClass("display");

        if (event.type.indexOf('focus') == -1) {
            $(event.target).focus();
        }

        //event.preventDefault();
    });

    $("#stbl").on("click", function (event) {
        event.preventDefault();
    });

    $("#stbl").on("focusout", ".inp-value", function (event) {
        var exp = event.target.dataset.exp = $(event.target).val();
        $(event.target).addClass("display");
        $(event.target).val("..");
        $(event.target).data("locked", false);

        ef.sendEvent(FrontendMessage.singularChanged(event.target.id.substring(2), undefined, exp, undefined));
    });

    $("#stbl").on("tap", /*".sg-star",*/ function (event) {
        var $startd = $(event.target);
        if ($startd.hasClass("sg-star")) {
            $startd = $startd.parent();
        }
        // the event fires on the TD, and not the span.
        if ($startd.children(".sg-star").length == 0) return;

        var isFavorite = $startd.children(".sg-starred").length == 0;
        var sgSymbol = ($startd.next().children()[0].id).substring(2);

        ef.sendEvent(FrontendMessage.singularChanged(sgSymbol, undefined, undefined, isFavorite));

        $startd.children(".sg-star").toggleClass("sg-starred");
        $startd.children(".sg-star").toggleClass("sg-unstarred");
    });

    $("#stbl").on("tap", ".inp-key", function (event) {
        if (EditPane.singularKeyPushed(event)) {
            event.stopImmediatePropagation();
            event.preventDefault();
        } else {
            $(event.target).data("oldValue", event.target.value);
        }
    });


    $("#stbl").on("focusout", ".inp-key", function (event) {
        if ($(event.target).data("oldValue") != event.target.value) {
            DetailPageController.handleSingularNameChangedEvent(event);
        }
    });

    $("#stbl").on("tap", "#scAddRow", function (event) {
        sc.addRow(event.target);
        event.preventDefault();
    });


    $("#stbl").on("tap", "input", function (event) {
        EditPane.focusEvent(event);
        event.preventDefault();
    });
};

DetailPageController.handleSingularNameChangedEvent = function (event) {
    var name = event.target.value;
    var oldSymbol = event.target.id.substring(2);
    var newSymbol = Symbols.singularSymbol(name);

    event.target.id = SingularControl.keyId(newSymbol);
    $("#"+SingularControl.valueId(oldSymbol)).attr("id", SingularControl.valueId(newSymbol));

    // for a new singular, doesn't send an old symbol (it was only temporary in the gui)
    if (oldSymbol.match(/\d+/)) {
        oldSymbol = undefined;
    }

    ef.sendEvent(FrontendMessage.singularChanged(oldSymbol, name, undefined));
};


var ColumnValueChangeHandler = function(e, v) {
    // a lambda such that "this" will be set to ef and not the window object when passing the function as reference
    return DetailPageController.handleColumnValueChangeEvent(e, v);
};

DetailPageController.attachListEvents = function () {
    var rowsToAdd = 0;
    var rowAddHandle;

    var handleAddRowClicked = function(){
        $('#clickCounter').hide('fast');
        for (var i=0;i<rowsToAdd; i++) {
            lc.addRow();
        }
        rowsToAdd = 0;
    };

    $("#mtbl").on("click", function (event) {
        event.preventDefault();
    });

    DetailControlFactory.attachChangeHandlers($("#mtbl"), ColumnValueChangeHandler);

    $("#mtbl").on("tap", "#lcAddRowButton", function (event) {
        window.clearTimeout(rowAddHandle);
        rowsToAdd ++;
        var buttonPos = $('#lcAddRowButton').offset();
        buttonPos.left += 50;
        buttonPos.top -= $('#clickCounter').height()/2;
        $('#clickCounter').html(rowsToAdd).css({left:0,top:0}).offset(buttonPos).show('fast');
        rowAddHandle = window.setTimeout(handleAddRowClicked, 900);
    });

    $("#mtbl").on("tap", "#lcAddColumnButton", function (event) {
        var headerField = lc.addColumn(event.target);
        showPaneIfName($(headerField));
        focusScrollblock(headerField, event);
        // this is for the pane to not immediately disappear again due to the focus event
        event.stopImmediatePropagation();
    });

    var showPaneTimer;

    var showPaneIfName = function ($headerElem) {
        if ($headerElem.val().length > 1) {
            EditPane.showPaneForElement($headerElem);
        } else {
            showPaneTimer = window.setTimeout(function() {
                showPaneIfName($headerElem);
            }, 1600);
        }
    };

    $("#mtbl").on("tap", ".hed-act", function (event) {
        if (EditPane.headerColumnPushed(event)) {
            event.stopImmediatePropagation();
            event.preventDefault();
        } else {
            showPaneIfName($(event.target));
            event.stopImmediatePropagation();
            focusScrollblock(event.target, event);
        }
    });

    $("#mtbl").on("focusout", ".hed-act", function (event) {
        window.clearTimeout(showPaneTimer);
        DetailPageController.handleColumnHeaderChangeEvent(event);
    });

    $("#mtbl").on("tap", ".inp-cal", function (event) {
        EditPane.showPaneForElement($(event.target));
        event.stopImmediatePropagation();
    });

    $("#mtbl").on("tap", "input.inp-act", function (event) {
        EditPane.focusEvent(event);
        //event.preventDefault();
        var currentScrollPos = $("#mtbl tbody").scrollTop();
        var elemPosRelative = $(event.target).position().top;
        var totalHeight = $("#mainwrapper").height();

        if (totalHeight - elemPosRelative < c.KEYBOARD_HEIGHT) {
            $("#mtbl tbody").scrollTop(currentScrollPos+elemPosRelative-totalHeight+c.KEYBOARD_HEIGHT);
        }

        focusScrollblock(event.target, event);
    });
};



DetailPageController.handleColumnValueChangeEvent = function (id, newValue) {
    var symbolElems = id.split(/_/);
    lc.changeColumnValue(symbolElems[1], symbolElems[2], symbolElems[3], newValue);
};

DetailPageController.handleColumnHeaderChangeEvent = function (event) {
    var idp = event.target.id.split(/_/);
    var listIdx = idp[1];
    var listName = ListControl.lname(listIdx);
    var oldColumnSymbol = idp[2];
    var oldColumnName = $(event.target).data("name");
    var newName = event.target.value;

    if (oldColumnName == newName) return;
    if (newName == "") {
        // don't allow setting a column name to blank.
        if (oldColumnName != undefined) {
            event.target.value = oldColumnName;
        }
        return;
    }

    $(event.target).data("name", newName);

    DetailPageController.renameColumnIds(listIdx, oldColumnSymbol, newName);

    ef.sendEvent(FrontendMessage.columnChanged(listName, oldColumnName, newName, undefined));

    // TODO this should not be here
    if (oldColumnName == "" || oldColumnName == undefined) oldColumnName = oldColumnSymbol;
    lc.changeColumnName(oldColumnName, newName);

    EditPane.updatePaneEvent(event);
};

DetailPageController.renameColumnIds = function (listIdx, oldColumnSymbol, newName) {
    $("#"+Symbols.columnRowSymbol(listIdx, oldColumnSymbol, "H")).attr("id", Symbols.columnRowSymbol(listIdx, newName, "H"));

    var i = 0;
    var col;
    while ((col = $("#"+Symbols.columnRowSymbol(listIdx, oldColumnSymbol, i))).length > 0) {
        col.attr("id", Symbols.columnRowSymbol(listIdx, newName, i++));
    }

};


focusScrollblock = function (elem, event) {
    elem.focus();

    window.scrollTo(0, 0);
    document.body.scrollTop = 0;

    event.preventDefault();
};

c = new function () {};
//TODO: dynamically determine
c.KEYBOARD_HEIGHT = 340;


