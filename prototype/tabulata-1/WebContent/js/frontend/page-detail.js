

function DetailPageController () {

}

var sc, lc, il, lsc;

DetailPageController.init = function () {
    sc = new SingularControl();
    sc.build();
    lc = new ListControl();

    il = new InfoLine([sc, lc]);

    lsc = new ListSelectControl();

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
};

DetailPageController.loadBlock = function(block) {
    $(".page-home").css("display", "none");
    $(".page-detail").css("display", "block");

    document.title = block.prolog.name + " -- tabulata";
    sc.init(block.singulars);
    $("#block-title").val(block.prolog.name);

    lc.init(0, block.lists[0]);
    lsc.init(block.lists);

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

    for (var i=0; i<data.values.length; i++) {
        var id = Symbols.columnRowSymbol(idx, data.columnName, i);
        $("#"+id).val(data.values[i]);
        //$("#"+id).text(data.values[i]);
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
    $("#stbl").on("tap", ".inp-value", function (event) {
        $(event.target).data("locked", true);
        $(event.target).val(event.target.dataset.exp);
        $(event.target).focus();
        //event.preventDefault();
    });

    $("#stbl").on("click", function (event) {
        event.preventDefault();
    });

    $("#stbl").on("focusout", ".inp-value", function (event) {
        var exp = event.target.dataset.exp = $(event.target).val();
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
    $("#mtbl").on("click", function (event) {
        event.preventDefault();
    });

    DetailControlFactory.attachChangeHandlers($("#mtbl"), ColumnValueChangeHandler);

    $("#mtbl").on("focusout", ".hed-act", function (event) {
        DetailPageController.handleColumnHeaderChangeEvent(event);
    });

    $("#mtbl").on("tap", "#lcAddRowButton", function (event) {
        lc.addRow(event.target);
        event.preventDefault();
    });

    $("#mtbl").on("tap", "#lcAddColumnButton", function (event) {
        var headerField = lc.addColumn(event.target);
        EditPane.showPaneForHeader(headerField, true);
        focusScrollblock(headerField, event);
        // this is for the pane to not immediately disappear again due to the focus event
        event.stopImmediatePropagation();
    });

    $("#mtbl").on("tap", ".hed-act", function (event) {
        if (EditPane.headerColumnPushed(event)) {
            event.stopImmediatePropagation();
            event.preventDefault();
        } else {
            EditPane.showPaneEvent(event);
            focusScrollblock(event.target, event);
        }
    });

    $("#mtbl").on("tap", ".inp-cal", function (event) {
        EditPane.showPaneEvent(event);
        event.preventDefault();
    });

    $("#mtbl").on("tap", "input", function (event) {
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
    var symbolElems = event.target.id.split(/_/);
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


