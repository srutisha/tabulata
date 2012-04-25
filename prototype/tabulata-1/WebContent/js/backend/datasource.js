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

DataSource.staticData = [
    {
    prolog: {
        name: 'Todo List',
        id: 'tid-1'
    },
    singulars : [ {
        name : 'Percentage Done',
        value : 'Tasks.Task.select(Tasks.Done == {true}).count * 100 / Tasks.count',
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
            name: 'Summary Of Tasks',
            numRows: 0,
            columns: [
                {
                    name: 'Task',
                    valueFunction: 'Tasks.Task.uniques'
                },
                {
                    name: 'Hours Total',
                    valueFunction: 'Tasks.HoursSpentTotal.select(Task == Tasks.Task).sum'
                },
                {
                    name: 'Hours Total Undone',
                    valueFunction: 'Tasks.HoursSpentTotal.select(Task == Tasks.Task && Tasks.Done == {false}).sum'
                },
                {
                    name: 'Hours Total Done',
                    valueFunction: 'Tasks.HoursSpentTotal.select(Task == Tasks.Task && Tasks.Done == {true}).sum'
                }
            ]
        },
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
                    values: [true, true, false, true, true, false, false, true, false, false, true, false, false, true, false, false, true, false, false, true, false, false, true, false, false]
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
    }
    ,
    {
        prolog: {
            name: 'Budget',
            id: 'tid-2'
        },
        singulars : [
            {
                name : 'Total Spent',
                value : 'Transactions.Price.sum',
                isFavorite: true
            }
            ,
            {
                name : 'Total Budgeted',
                value : 'Budget.CategoryBudget.sum',
                isFavorite: true
            }
        ],
        lists: [
            {
                name: 'Control',
                numRows: 0,
                columns: [
                    {
                        name: 'Category',
                        valueFunction: 'Transactions.Category.uniques'
                    },
                    {
                        name: 'Budgeted',
                        valueFunction: 'Budget.CategoryBudget.select(Category == Budget.Category).sum'
                    },
                    {
                        name: 'Actual',
                        valueFunction: 'Transactions.Price.select(Category == Transactions.Category).sum'
                    },
                    {
                        name: 'Difference',
                        valueFunction: 'Budgeted - Actual'
                    }
                ]
            },
            {
                name: 'Budget',
                numRows: 3,
                columns: [
                    {
                        name: 'Category',
                        values: [ 'Food', 'Fun', 'Car' ]
                    },
                    {
                        name: 'Category Budget',
                        type: 'number',
                        values: [20, 20, 100]
                    }
                ]
            },
            {
                name: 'Transactions',
                numRows: 5,
                columns: [
                    {
                        name: 'Category',
                        values: ['Food', 'Fun', 'Food', 'Car', 'Food']
                    },
                    {
                        name: 'Item',
                        values: ['Dinner', 'Cinema', 'Pizza', 'Gasoline', 'Ice Cream']
                    },
                    {
                        name: 'Price',
                        type: 'number',
                        values: [25, 18, 5, 105, 3.5]
                    },
                    {
                        name: 'When',
                        values: ['2012-03-12T14:39:30Z', '2011-03-12T14:39:30Z', '2012-03-12T14:39:30Z', '2011-03-12T14:39:30Z', '2011-03-12T14:39:30Z' ]
                    }

                ]
            }
        ]
    }
    ,
    {
        prolog: {
            name: 'Example Multiple Lists',
            id: 'tid-3'
        },
        singulars : [
        ],
        lists: [
            {
                name: 'First List',
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
                        values: [15, 4, 3]
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
                        values: [25, 4, 3]
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