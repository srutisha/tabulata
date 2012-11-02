
ImportControl = function () {
    var self = this;

    $("#pane-import").on("tap", "#import-button", function (event) {
        var files = $("#pane-import #import-file")[0].files;
        var name = $("#import-name").val();

        if (!name || name.length == 0) {
            self.showError("Set a name", "name");
        } else if (!files || files.length < 1) {
            self.showError("Select a file", "file");
        } else {
            // "FileList" cannot do iterable
            for (var i = 0; i < files.length; i++) {
                self.importFile (name, files.item(i));
            }
            $.modal.close();
        }
        event.preventDefault();
    });
};

ImportControl.prototype.showError = function (text, field) {
    $("#import-name, #import-file").removeClass("error");
    $('#import-error').html(text);
    if (field) {
        $("#import-"+field).addClass("error");
    }
};

ImportControl.prototype.importFile = function (name, file) {
    var self=this, reader = new FileReader();
    reader.readAsText(file);
    reader.onload = function () {
        var csv = reader.result;
        var arrays = $.csv.toArrays(csv);
        var listData = self.toListData(name, arrays);
        lsc.createNewWithData(listData);
    };
};

ImportControl.prototype.toListData = function (name, array) {
    array = array.filter(function(e) {return e != undefined; } ); // chop off empty lines at the end

    if (array.length < 1) {
        this.showError("No valid contents", "file");
    }

    var list = {};
    list.numRows = array.length - 1; // assume a header
    list.name = name;
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
    this.showError("&nbsp;");
    $("#pane-import").modal();
};
