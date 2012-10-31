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
