var DataSource = function () {};

DataSource.getBlocks = function () {
return DataSource.staticData;
};

DataSource.getBlockWithId = function (id) {
    return (DataSource.staticData.filter(function (block) {
        return block.prolog.id == id;
    }))[0];
};

DataSource.updateBlock = function (block) {
    var id = block.prolog.id;
    DataSource.staticData =
        DataSource.staticData.map(function (oldBlock) {
        if (oldBlock.prolog.id == id) {
            return block;
        }
        return oldBlock;
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

DataSource.staticData = [ {
    prolog: {
        name: 'Check List',
        id: 'tid-1'
    },
    singulars : [ {
        name : 'Percentage Done',
        value : 'Tasks.Task.select(Tasks.Done == {true}).count / Tasks.count',
        isFavorite: true
    }, {
        name : 'Sum Intern',
        value : 'Tasks.HoursSpentIntern.sum',
        isFavorite: true
    }, {
        name : 'Sum Extern',
        value : 'Tasks.HoursSpentExtern.sum',
        isFavorite: true
    }, {
        name : 'Sum Total One',
        value : 'Tasks.HoursSpentIntern.sum + Tasks.HoursSpentExtern.sum',
        isFavorite: true
    }, {
        name : 'Sum Total Two',
        value : 'SumExtern + SumIntern'
    }, {
        name : 'Sum Total Three',
        value : 'Tasks.HoursSpentTotal.sum'
    }, {
        name : 'Spent On Done Total',
        value : 'Tasks.HoursSpentTotal.select(Tasks.Done == {true}).sum',
        isFavorite: true
    }, {
        name : 'Salary Per Hour Intern',
        value : '15'
    }, {
        name : 'Total',
        value : 'Tasks.count',
        isFavorite: true
    } ],
    lists: [
        {
            name: 'Tasks',
            numRows: 25,
            columns: [
                {
                    name: 'Task',
                    values: ['Task 1', 'Task 2', 'Task 3', 'Task 4', 'Task 2', 'Task 3', 'Task 4', 'Task 2', 'Task 3', 'Task 4', 'Task 2', 'Task 3', 'Task 4', 'Task 2', 'Task 3', 'Task 4', 'Task 2', 'Task 3', 'Task 4', 'Task 2', 'Task 3', 'Task 4', 'Task 2', 'Task 3', 'Task 4']
                },
                {
                    name: 'Done',
                    type: 'boolean',
                    values: [true, true, false, false, true, false, false, true, false, false, true, false, false, true, false, false, true, false, false, true, false, false, true, false, false]
                },
                {
                    name: 'Hours Spent Intern',
                    type: 'number',
                    values: [5, 4, 3, 2, 4, 3, 2, 4, 3, 2, 4, 3, 2, 4, 3, 2, 4, 3, 2, 4, 3, 2, 4, 3, 2]
                },
                {
                    name: 'Salary Intern',
                    valueFunction: 'HoursSpentIntern * SalaryPerHourIntern'
                },
                {
                    name: 'Hours Spent Extern',
                    type: 'number',
                    values: [6, 3, 2, 1, 3, 2, 1, 3, 2, 1, 3, 2, 1, 3, 2, 1, 3, 2, 1, 3, 2, 1, 3, 2, 1]
                },
                {
                    name: 'Hours Spent Total',
                    valueFunction: 'HoursSpentIntern + HoursSpentExtern'
                },
                {
                    name: 'Sum Hours Spent',
                    valueFunction: 'SumHoursSpent.above + HoursSpentTotal'
                },
                {
                    name: 'Due',
                    values: ['2012-03-12T14:39:30Z', '2011-03-12T14:39:30Z', '2012-03-12T14:39:30Z', '2011-03-12T14:39:30Z', '2011-03-12T14:39:30Z', '2012-03-12T14:39:30Z', '2011-03-12T14:39:30Z', '2011-03-12T14:39:30Z', '2012-03-12T14:39:30Z', '2011-03-12T14:39:30Z', '2011-03-12T14:39:30Z', '2012-03-12T14:39:30Z', '2011-03-12T14:39:30Z', '2011-03-12T14:39:30Z', '2012-03-12T14:39:30Z', '2011-03-12T14:39:30Z', '2011-03-12T14:39:30Z', '2012-03-12T14:39:30Z', '2011-03-12T14:39:30Z', '2011-03-12T14:39:30Z', '2012-03-12T14:39:30Z', '2011-03-12T14:39:30Z', '2011-03-12T14:39:30Z', '2012-03-12T14:39:30Z', '2011-03-12T14:39:30Z']
                }

            ]
        },
        {
            name: 'Tasks Aggregated',
            numRows: 0,
            columns: [
                {
                    name: 'Task',
                    valueFunction: 'Tasks.Task.uniques'
                },
                {
                    name: 'Hours Total',
                    valueFunction: 'Tasks.HoursSpentTotal.select(Task == Tasks.Task).sum'
                }
            ]
        }
    ]
}
    ,

    {
        prolog: {
            name: 'Check List 2',
            id: 'tid-2'
        },
        singulars : [ {
            name : 'Percentage Done',
            value : 'Tasks.Task.select(Tasks.Done == {true}).count / Tasks.count',
            isFavorite: true
        }, {
            name : 'Sum Intern',
            value : 'Tasks.HoursSpentIntern.sum',
            isFavorite: true
        }, {
            name : 'Sum Extern',
            value : 'Tasks.HoursSpentExtern.sum',
            isFavorite: true
        }, {
            name : 'Sum Total One',
            value : 'Tasks.HoursSpentIntern.sum + Tasks.HoursSpentExtern.sum'
        }, {
            name : 'Sum Total Two',
            value : 'SumExtern + SumIntern',
            isFavorite: true
        }, {
            name : 'Sum Total Three',
            value : 'Tasks.HoursSpentTotal.sum'
        }, {
            name : 'Spent On Done Total',
            value : 'Tasks.HoursSpentTotal.select(Tasks.Done == {true}).sum',
            isFavorite: true
        }, {
            name : 'Salary Per Hour Intern',
            value : '15'
        }, {
            name : 'Total',
            value : 'Tasks.count',
            isFavorite: true
        } ],
        lists: [
            {
                name: 'Tasks',
                numRows: 25,
                columns: [
                    {
                        name: 'Task',
                        values: ['Task 1', 'Task 2', 'Task 3', 'Task 4', 'Task 2', 'Task 3', 'Task 4', 'Task 2', 'Task 3', 'Task 4', 'Task 2', 'Task 3', 'Task 4', 'Task 2', 'Task 3', 'Task 4', 'Task 2', 'Task 3', 'Task 4', 'Task 2', 'Task 3', 'Task 4', 'Task 2', 'Task 3', 'Task 4']
                    },
                    {
                        name: 'Done',
                        type: 'boolean',
                        values: [true, true, false, false, true, false, false, true, false, false, true, false, false, true, false, false, true, false, false, true, false, false, true, false, false]
                    },
                    {
                        name: 'Hours Spent Intern',
                        type: 'number',
                        values: [5, 4, 3, 2, 4, 3, 2, 4, 3, 2, 4, 3, 2, 4, 3, 2, 4, 3, 2, 4, 3, 2, 4, 3, 2]
                    },
                    {
                        name: 'Salary Intern',
                        valueFunction: 'HoursSpentIntern * SalaryPerHourIntern'
                    },
                    {
                        name: 'Hours Spent Extern',
                        type: 'number',
                        values: [6, 3, 2, 1, 3, 2, 1, 3, 2, 1, 3, 2, 1, 3, 2, 1, 3, 2, 1, 3, 2, 1, 3, 2, 1]
                    },
                    {
                        name: 'Hours Spent Total',
                        valueFunction: 'HoursSpentIntern + HoursSpentExtern'
                    },
                    {
                        name: 'Sum Hours Spent',
                        valueFunction: 'SumHoursSpent.above + HoursSpentTotal'
                    },
                    {
                        name: 'Due',
                        values: ['2012-03-12T14:39:30Z', '2011-03-12T14:39:30Z', '2012-03-12T14:39:30Z', '2011-03-12T14:39:30Z', '2011-03-12T14:39:30Z', '2012-03-12T14:39:30Z', '2011-03-12T14:39:30Z', '2011-03-12T14:39:30Z', '2012-03-12T14:39:30Z', '2011-03-12T14:39:30Z', '2011-03-12T14:39:30Z', '2012-03-12T14:39:30Z', '2011-03-12T14:39:30Z', '2011-03-12T14:39:30Z', '2012-03-12T14:39:30Z', '2011-03-12T14:39:30Z', '2011-03-12T14:39:30Z', '2012-03-12T14:39:30Z', '2011-03-12T14:39:30Z', '2011-03-12T14:39:30Z', '2012-03-12T14:39:30Z', '2011-03-12T14:39:30Z', '2011-03-12T14:39:30Z', '2012-03-12T14:39:30Z', '2011-03-12T14:39:30Z']
                    }

                ]
            }
        ]
    },

    {
        prolog: {
            name: 'Check List 3',
            id: 'tid-3'
        },
        singulars : [ {
            name : 'Percentage Done',
            value : 'Tasks.Task.select(Tasks.Done == {true}).count / Tasks.count',
            isFavorite: true
        }, {
            name : 'Sum Intern',
            value : 'Tasks.HoursSpentIntern.sum'
        }, {
            name : 'Sum Extern',
            value : 'Tasks.HoursSpentExtern.sum'
        }, {
            name : 'Sum Total One',
            value : 'Tasks.HoursSpentIntern.sum + Tasks.HoursSpentExtern.sum'
        }, {
            name : 'Sum Total Two',
            value : 'SumExtern + SumIntern'
        }, {
            name : 'Sum Total Three',
            value : 'Tasks.HoursSpentTotal.sum',
            isFavorite: true
        }, {
            name : 'Spent On Done Total',
            value : 'Tasks.HoursSpentTotal.select(Tasks.Done == {true}).sum',
            isFavorite: true
        }, {
            name : 'Salary Per Hour Intern',
            value : '15'
        }, {
            name : 'Total',
            value : 'Tasks.count'
        } ],
        lists: [
            {
                name: 'Tasks',
                numRows: 25,
                columns: [
                    {
                        name: 'Task',
                        values: ['Task 1', 'Task 2', 'Task 3', 'Task 4', 'Task 2', 'Task 3', 'Task 4', 'Task 2', 'Task 3', 'Task 4', 'Task 2', 'Task 3', 'Task 4', 'Task 2', 'Task 3', 'Task 4', 'Task 2', 'Task 3', 'Task 4', 'Task 2', 'Task 3', 'Task 4', 'Task 2', 'Task 3', 'Task 4']
                    },
                    {
                        name: 'Done',
                        type: 'boolean',
                        values: [true, true, false, false, true, false, false, true, false, false, true, false, false, true, false, false, true, false, false, true, false, false, true, false, false]
                    },
                    {
                        name: 'Hours Spent Intern',
                        type: 'number',
                        values: [5, 4, 3, 2, 4, 3, 2, 4, 3, 2, 4, 3, 2, 4, 3, 2, 4, 3, 2, 4, 3, 2, 4, 3, 2]
                    },
                    {
                        name: 'Salary Intern',
                        valueFunction: 'HoursSpentIntern * SalaryPerHourIntern'
                    },
                    {
                        name: 'Hours Spent Extern',
                        type: 'number',
                        values: [6, 3, 2, 1, 3, 2, 1, 3, 2, 1, 3, 2, 1, 3, 2, 1, 3, 2, 1, 3, 2, 1, 3, 2, 1]
                    },
                    {
                        name: 'Hours Spent Total',
                        valueFunction: 'HoursSpentIntern + HoursSpentExtern'
                    },
                    {
                        name: 'Sum Hours Spent',
                        valueFunction: 'SumHoursSpent.above + HoursSpentTotal'
                    },
                    {
                        name: 'Due',
                        values: ['2012-03-12T14:39:30Z', '2011-03-12T14:39:30Z', '2012-03-12T14:39:30Z', '2011-03-12T14:39:30Z', '2011-03-12T14:39:30Z', '2012-03-12T14:39:30Z', '2011-03-12T14:39:30Z', '2011-03-12T14:39:30Z', '2012-03-12T14:39:30Z', '2011-03-12T14:39:30Z', '2011-03-12T14:39:30Z', '2012-03-12T14:39:30Z', '2011-03-12T14:39:30Z', '2011-03-12T14:39:30Z', '2012-03-12T14:39:30Z', '2011-03-12T14:39:30Z', '2011-03-12T14:39:30Z', '2012-03-12T14:39:30Z', '2011-03-12T14:39:30Z', '2011-03-12T14:39:30Z', '2012-03-12T14:39:30Z', '2011-03-12T14:39:30Z', '2011-03-12T14:39:30Z', '2012-03-12T14:39:30Z', '2011-03-12T14:39:30Z']
                    }

                ]
            },
            {
                name: 'Second List',
                numRows: 3,
                columns: [
                    {
                        name: 'Column One',
                        values: ['Name 1', 'Name 2', 'Name 3']
                    },
                    {
                        name: 'Numbers One',
                        type: 'number',
                        values: [5, 4, 3]
                    },
                    {
                        name: 'Numbers Two',
                        type: 'number',
                        values: [6, 3, 2]
                    },
                    {
                        name: 'Total Numbers',
                        valueFunction: 'NumbersOne + NumbersTwo'
                    }
                ]
            },
            {
                name: 'Third List',
                numRows: 3,
                columns: [
                    {
                        name: 'Column One',
                        values: ['Name 1', 'Name 2', 'Name 3']
                    },
                    {
                        name: 'Numbers One',
                        type: 'number',
                        values: [5, 4, 3]
                    },
                    {
                        name: 'Numbers Two',
                        type: 'number',
                        values: [6, 3, 2]
                    },
                    {
                        name: 'Total Numbers',
                        valueFunction: 'NumbersOne + NumbersTwo'
                    }
                ]
            }
        ]
    }


];