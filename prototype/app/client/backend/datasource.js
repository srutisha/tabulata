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

var DataSource = function () {};

DataSource.user = 1;

var ajaxFailer = function(jqx, status) {
    throw Error(status);
};

DataSource.getBlocks = function (blockWork) {
    $.ajax({url: '/user/'+DataSource.user})
        .done(function(blockReply) {
            blockReply.blocks.forEach(function (blockUuid) {
                DataSource.onBlockWithId(blockUuid, blockWork);
            });
         }).fail(ajaxFailer);
};

DataSource.deleteBlock = function (blockId) {
    $.ajax('/block/'+blockId+"?user="+DataSource.user,
        {
            type: 'DELETE'
        });
};

DataSource.onBlockWithId = function (blockUuid, blockWork) {
    $.ajax('/block/'+blockUuid+"?user="+DataSource.user)
        .done(function(block) {
            blockWork(block);
        }).fail(ajaxFailer);
};

DataSource.updateBlock = function (block) {
    var blockUuid = block.prolog.id;
    $.ajax('/block/'+blockUuid+"?user="+DataSource.user,
        {
            type: 'PUT',
            data: JSON.stringify( block ),
            contentType: "application/json; charset=utf-8"
        });
};

DataSource.newBlock = function (name, blockWork) {
    var uuid = DataSource.generateUuid();
    $.ajax('/block/'+uuid+"?user="+DataSource.user+"&name="+name,
        {
            type: 'PUT',
            data: ""
        }).done(function(block) {
            blockWork(block);
        });
};

//http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript
DataSource.generateUuid = function () {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
        return v.toString(16);
    });
};
