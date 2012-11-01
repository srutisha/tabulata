
ImportControl = function () {
    var self = this;

    $("#pane-import").on("tap", "#import-button", function (event) {
        var files = $("#pane-import input")[0].files;

        // "FileList" cannot do iterable
        for (var i = 0; i < files.length; i++) {
            self.importFile (files.item(i));
        }
        $("#pane-import").hide();
        event.preventDefault();
    });

    $("#pane-import").on("tap", "#import-cancel", function (event) {
        $("#pane-import").hide();
        event.preventDefault();
    });
};

ImportControl.prototype.importFile = function (file) {
    var self=this, reader = new FileReader();
    reader.readAsText(file);
    reader.onload = function () {
        var csv = reader.result;
        var arrays = $.csv.toArrays(csv);
        var listData = self.toListData(arrays);
        lsc.createNewWithData(listData);
    };
};

ImportControl.allListIndex = 0;

ImportControl.prototype.toListData = function (array) {
    array = array.filter(function(e) {return e != undefined; } ); // chop off empty lines at the end

    if (array.length < 1) {
        throw new Error("Too Small.");
    }

    var list = {};
    list.numRows = array.length - 1; // assume a header
    list.name = 'Imported List ' + (ImportControl.allListIndex++);
    list.columns = [];


    var columns = array.shift();

    columns.forEach(function (column, idx) {
        var values = array.map(function(row) { return row[idx]; });
        var col = {name: column, values: values};
        list.columns.push(col);
    });

    return list;
};

ImportControl.prototype.open = function () {
    $("#pane-import").show();
};
