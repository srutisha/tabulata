

IncludesControl = function() {

};

IncludesControl.prototype.lc = 0;

IncludesControl.prototype.init = function (includes) {

    var self = this;

    includes = includes || [];

    $('#includes-list').html("");
    this.lc = 0;

    includes.forEach(function(include) {
        this.add(include);
    }, this);

    $("#includes-list").on("focusout", ".inc-name, .inc-url", function (event) {
        var index = event.target.id.match(/\-(\d+)/)[1];
        var name = $('#inc-name-'+index).val();
        var url = $('#inc-url-'+index).val();

        if (name && url && name.length>0 && url.length>0) {
            ef.sendEvent(FrontendMessage.includeChanged(index,name,url));
        }

        event.preventDefault();
    });

    $("#includes").on("tap", "#add-button", function (event) {
        self.add({name:'', url:''});
    });
};

IncludesControl.prototype.add = function (include) {
    $('#includes-list').append(html.input('inc-name-'+this.lc, 'inc-name', include.name));
    $('#includes-list').append(html.input('inc-url-'+this.lc, 'inc-url', include.url));
    this.lc++;
};

