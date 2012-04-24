

HomePageController = function () {

};
HomePageController.unnamedCounter = 1;

HomePageController.init = function () {
    $("#content-page-home").on("tap", ".home-block-container", function (event) {
        var id = $(event.target).closest(".home-block-container").data("id");

        ef.sendEvent(FrontendMessage.initWithBlockOfId(id));

        event.preventDefault();
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
    console.log(blockData.id);
    var existing = $(".home-block-container").filter(function () { return $(this).data('id') == blockData.id; });
    if (existing.length > 0) {
        existing.replaceWith(content);
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

    $(bldiv).append($(html.div(blockData.name)).addClass("home-block-title"),
                    $(html.div(blockData.listNames.join(" &nbsp;&bull;&nbsp;&nbsp;"))).addClass("home-block-lists"),
                    content);

    $(bldiv).addClass("home-block-container");
    $(bldiv).data("id", blockData.id);

    return bldiv;

};


BlockDisplayControl.renderNewBlock = function () {
    var bldiv = html.div();
    bldiv.id = "home-new-block";

    $(bldiv).append($(html.div("+")).addClass("home-new-block-plus"), $(html.div("New Block")).addClass("home-new-block-text"));


    return bldiv;

};

