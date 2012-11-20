
/*
 * Tabulata -- Calculate and Aggregate Lists
 *
 * Copyright (C) 2012 Samuel Rutishauser (samuel@rutishauser.name)
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

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
