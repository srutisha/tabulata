var DataSource = function () {};

var user = 1;

var ajaxFailer = function(jqx, status) {
    throw Error(status);
};

DataSource.getBlocks = function (blockWork) {
    $.ajax('/user/'+user)
        .done(function(blockReply) {
            blockReply.blocks.forEach(function (blockUuid) {
                DataSource.onBlockWithId(blockUuid, blockWork);
            });
         }).fail(ajaxFailer);
};

DataSource.onBlockWithId = function (blockUuid, blockWork) {
    $.ajax('/block/'+blockUuid+"?user="+user)
        .done(function(block) {
            blockWork(block);
        }).fail(ajaxFailer);
};

DataSource.updateBlock = function (block) {
    var blockUuid = block.prolog.id;
    $.ajax('/block/'+blockUuid+"?user="+user,
        {
            type: 'PUT',
            data: block
        });
};

DataSource.newBlock = function (name) {
    var block = {
        prolog: {
            'name': name,
            'id': DataSource.generateUuid()
        },
        singulars : [ {
            name : 'Singular',
            value : 'List.Column.sum'
        } ],
        lists: [
            {
                name: 'List',
                numRows: 1,
                columns: [
                    {
                        name: 'Column',
                        values: ['']
                    }

                ]
            }
        ]
    };

    DataSource.staticData.push(block);

    return block;
};

//http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript
DataSource.generateUuid = function () {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
        return v.toString(16);
    });
};
