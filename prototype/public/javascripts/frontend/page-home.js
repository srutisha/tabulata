

HomePageController = function () {

};
HomePageController.unnamedCounter = 1;

HomePageController.blockId = function (eventTarget) {
    return HomePageController.containingBlock(eventTarget).data("id");
};

HomePageController.containingBlock = function (eventTarget) {
    return $(eventTarget).closest(".home-block-container");
}

HomePageController.init = function () {
    $("#content-page-home").on("tap", ".home-block-container", function (event) {
        var id = HomePageController.blockId(event.target);

        ef.sendEvent(FrontendMessage.initWithBlockOfId(id));

        event.preventDefault();
    });

    $("#content-page-home").on("tap", ".home-block-delete", function (event) {
        var id = HomePageController.blockId(event.target);

        if (confirm("Really delete block?")) {
            HomePageController.containingBlock(event.target).remove();
            ef.sendEvent(FrontendMessage.deleteBlock(id));
        }

        return false;
    });

    $("#content-page-home").append(BlockDisplayControl.renderNewBlock());

    $("#home-new-block").on("tap", function (event) {
        ef.sendEvent(FrontendMessage.initWithNewBlock("Unnamed Block "+HomePageController.unnamedCounter));
        HomePageController.unnamedCounter++;
    });
};

HomePageController.load = function (blocks) {
    blocks.forEach(HomePageController.loadOrReload);
};

HomePageController.loadOrReload = function (blockData) {
    var content = BlockDisplayControl.render(blockData);
    var existing = $(".home-block-container").filter(function () { return $(this).data('id') == blockData.prolog.id; });
    if (existing.length > 0) {
        existing.remove();
    }

    var insertElem;

    $(".home-block-container").each(function (idx, elem) {
        if (insertElem  == undefined && $(elem).data('updated') < blockData.prolog.updated) {
            insertElem = elem;
        }
    });

    if (insertElem) {
        $(insertElem).before(content);
    } else {
        $("#home-new-block").before(content);
    }
}

BlockDisplayControl = function () {

};

BlockDisplayControl.render = function (blockData) {
    var content =  [];

    blockData.values.forEach(function(sg) {
        if (sg.isFavorite) {
            content.push(html.dt(sg.name), html.dd(ObjUtil.stdFormatIfNumber(sg.resultValue)));
        }
    });

    var bldiv = html.div();

    $(bldiv).append($(html.div('&times;')).addClass("home-block-delete"),
                    $(html.div(blockData.prolog.name)).addClass("home-block-title"),
                    $(html.div(blockData.listNames.join(" &nbsp;&bull;&nbsp;&nbsp;"))).addClass("home-block-lists"),
                    content);

    $(bldiv).addClass("home-block-container");
    $(bldiv).data("id", blockData.prolog.id);
    $(bldiv).data("updated", blockData.prolog.updated);

    return bldiv;
};


BlockDisplayControl.renderNewBlock = function () {
    var bldiv = html.div();
    bldiv.id = "home-new-block";

    $(bldiv).append($(html.div("+")).addClass("home-new-block-plus"), $(html.div("New Block")).addClass("home-new-block-text"));


    return bldiv;

};

