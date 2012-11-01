
Include = function (ctx, data, completeFn) {
    var self = this;

    var jsonDataHolder;
    var called = false;


    this.setName = function(name) {
        this.name = normalizeName(name);
        this.originalName = name;
    };

    this.setName(data.name);

    this.url = data.url;

    this.setUrl = function (url) {
        this.url = url;
        jsonDataHolder = undefined;
        called = false;
    };

    this.jsonReady = function () {
        this.jsonData();
        return jsonDataHolder != undefined;
    };

    this.jsonData = function() {
        if (!called && jsonDataHolder == undefined) {
            called = true;
            var ajaxCall = {
                url: this.url,
                dataType: 'json',
                success: function(jsonObj) {
                    jsonDataHolder = jsonObj;
                    completeFn();
                }
            };

            if ($.ajax.get != undefined) {
                $.ajax.get(ajaxCall);
            } else  {
                $.ajax(ajaxCall);
            }
        }
        return jsonDataHolder;
    };


    this.persistenceJsonData = function () {
        return {name: this.originalName, url: this.url};
    };

    this.symbol = function () {
        return Symbols.includeSymbol(self.name);
    };
};

Include.fromData = function fromData(ctx, data, completeFn) {
    var inc = new Include(ctx, data, completeFn);
    ctx[inc.symbol()] = inc;
    return inc;
};
