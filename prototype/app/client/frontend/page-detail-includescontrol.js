

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

