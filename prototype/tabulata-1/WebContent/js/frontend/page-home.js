




BlockDisplayControl = function (blockData) {
    this.blockData = blockData;

};

BlockDisplayControl.prototype.render = function () {
    return $(html.div()).append(function () {
            var ret = [
                $(html.div(this.blockData.name)).addClass("home-block-title")
            ];

            this.blockData.values.forEach(function(sg) {
                ret.push(html.dt(sg.name), html.dd(sg.resultValue));
            });

            return ret;
        }
    ).addClass("home-block-container").data("blockId", this.blockData.id);
};


