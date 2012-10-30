
function Singular(ctx, data) {
    var self = this;

    this.exp = data.value;

    this.isFavorite = data.isFavorite;

    this.jsonData = function () {
        return {'name': data.name, 'value': this.exp, 'isFavorite': this.isFavorite};
    };

    this.setExp = function (exp) {
        delete this.valueCache;
        this.exp = exp;
    };

    this.setFavorite = function (isFavorite) {
        this.isFavorite = isFavorite;
    };

    this.symbol = function () {
        return Symbols.singularSymbol(self.name());
    };

    this.humanName = function () {
        return data.name;
    };

    this.name = function () {
        return normalizeName(data.name);
    };

    this.value = function() {
        return ctx.evaluate(self.exp);
    };

    this.$V = function() {
        if (this.valueCache == undefined) {
            this.valueCache = this.value();
        }
        return this.valueCache;
    };
}

Singular.fromData = function (ctx, sgData) {
    var sg = new Singular(ctx, sgData);
    ctx[sg.symbol()] = sg;
    return sg;
};

Singular.changeSingular = function (ctx, cdata) {

    var sgData = {name: cdata.newName, value: cdata.exp, isFavorite: cdata.isFavorite};

    if (cdata.oldSymbol != undefined) {
        var oldSg = ctx[cdata.oldSymbol];

        if (cdata.exp != undefined) {
            oldSg.setExp(cdata.exp);
            return;
        }

        if (cdata.isFavorite != undefined) {
            oldSg.setFavorite(cdata.isFavorite);
            return;
        }

        sgData.value = oldSg.exp;
        ctx.replaceSingular(oldSg, sgData);
    } else {
        sgData.value = "";
        ctx.addSingular(sgData);
    }


};
