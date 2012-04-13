

HomePageController = function () {

}

HomePageController.init = function () {

};

HomePageController.load = function (blocks) {
    var content = blocks.map(BlockDisplayControl.render);
    console.log(content);
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

    return bldiv;

};


