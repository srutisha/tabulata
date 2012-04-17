

function DetailPageController () {

}

var sc, lc, il;

DetailPageController.init = function () {
    sc = new SingularControl();
    sc.build();
    lc = new ListControl();
    lc.build();

    il = new InfoLine([sc, lc]);

    DetailPageController.attachEvents();
    EditPane.attachEvents();
};

DetailPageController.attachEvents = function () {
    DetailPageController.attachSingularEvents();
    DetailPageController.attachListEvents();
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
    lc.init(block.lists[0]);
    $("#block-title").val(block.prolog.name);

    il.update();
    sc.updateOffset();

    ef.sendEvent(FrontendMessage.readyForBlock());
};


DetailPageController.updateColumnEventReceived = function (data) {
    for (var i=0; i<data.values.length; i++) {
        var id = Symbols.columnRowSymbol(data.listName, data.columnName, i);
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

        ef.sendEvent(FrontendMessage.singularExpChanged(event.target.id.substring(2), exp));
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
            handleSingularNameChangedEvent(event);
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
    console.log("Column change: "+id+" -> "+newValue);
    ef.sendEvent(FrontendMessage.columnValueChanged(id, newValue));
};

DetailPageController.handleColumnHeaderChangeEvent = function (event) {
    var idp = event.target.id.split(/_/);
    var listName = idp[1];
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

    DetailPageController.renameColumnIds(listName, oldColumnSymbol, newName);

    ef.sendEvent(FrontendMessage.columnChanged(listName, oldColumnName, newName));

    // TODO this should not be here
    if (oldColumnName == "" || oldColumnName == undefined) oldColumnName = oldColumnSymbol;
    lc.changeColumnName(oldColumnName, newName);

    EditPane.updatePaneEvent(event);
};

DetailPageController.renameColumnIds = function (listName, oldColumnSymbol, newName) {
    $("#"+Symbols.columnRowSymbol(listName, oldColumnSymbol, "H")).attr("id", Symbols.columnRowSymbol(listName, newName, "H"));

    var i = 0;
    var col;
    while ((col = $("#"+Symbols.columnRowSymbol(listName, oldColumnSymbol, i))).length > 0) {
        col.attr("id", Symbols.columnRowSymbol(listName, newName, i++));
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

handleSingularNameChangedEvent = function (event) {
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

