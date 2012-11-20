
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
