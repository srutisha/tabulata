

HomePageController = function () {

};

HomePageController.init = function () {
    $("#content-page-home").on("tap", ".home-block-container", function (event) {
        var id = $(event.target).closest(".home-block-container").data("id");

        ef.sendEvent(FrontendMessage.initWithBlockOfId(id));

        event.preventDefault();
    });
};

HomePageController.load = function (blocks) {
    var content = blocks.map(BlockDisplayControl.render);
    $("#content-page-home").append(content);
};

BlockDisplayControl = function () {

};

BlockDisplayControl.render = function (blockData) {
    var content =  [];

    blockData.values.forEach(function(sg) {
        content.push(html.dt(sg.name), html.dd(sg.resultValue));
    });

    var bldiv = html.div();

    $(bldiv).append($(html.div(blockData.name)).addClass("home-block-title"), content);

    $(bldiv).addClass("home-block-container");
    $(bldiv).data("id", blockData.id);

    return bldiv;

};


