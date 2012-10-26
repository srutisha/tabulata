var emptyBlock = function(uuid, name) {
    return {
        prolog: {
            'name': name,
            'id': uuid,
            'created': new Date().getTime()
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
};

exports.emptyBlock = emptyBlock;

generateUuid = function () {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
        return v.toString(16);
    });
};


exports.generateUuid = generateUuid;

exports.exampleBlocks = [
        {
            prolog: {
                name: 'Todo List',
                id: generateUuid()
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
                            dataType: 'boolean',
                            values: [true, true, false, true, true, false, false, true, false, false, true, false, false, true, false, false, true, false, false, true, false, false, true, false, false]
                        },
                        {
                            name: 'Hours Spent Intern',
                            dataType: 'number',
                            values: [5, 4, 3, 2, 4, 3, 2, 4, 3, 2, 4, 3, 2, 4, 3, 2, 4, 3, 2, 4, 3, 2, 4, 3, 2]
                        },
                        {
                            name: 'Salary Intern',
                            valueFunction: 'HoursSpentIntern * SalaryPerHourIntern'
                        },
                        {
                            name: 'Hours Spent Extern',
                            dataType: 'number',
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
                id: generateUuid()
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
                ,
                {
                    name : 'Number Of Transactions',
                    value : 'Transactions.count',
                    isFavorite: true
                }
                ,
                {
                    name : 'Tax Rate',
                    value : '0.08'
                }
                ,
                {
                    name : 'Spent In Categories Over Budget',
                    value : 'Control.Actual.select(Control.Difference < 0).sum',
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
                            dataType: 'number',
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
                            dataType: 'number',
                            values: [25, 18, 5, 105, 3.5]
                        },
                        {
                            name: 'Tax',
                            valueFunction: 'Price * TaxRate'
                        },
                        {
                            name: 'Price Sum',
                            valueFunction: 'PriceSum.above + Price'
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
                id: generateUuid()
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
                            dataType: 'number',
                            values: [5, 4, 3]
                        },
                        {
                            name: 'Numbers Two',
                            dataType: 'number',
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
                            dataType: 'number',
                            values: [15, 4, 3]
                        },
                        {
                            name: 'Numbers Two',
                            dataType: 'number',
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
                            dataType: 'number',
                            values: [25, 4, 3]
                        },
                        {
                            name: 'Numbers Two',
                            dataType: 'number',
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
        ,
        {
            prolog: {
                name: 'Currency Portfolio',
                id: generateUuid()
            },
            includes : [
                {
                    name : "Open Rates",
                    /*                url : "http://openexchangerates.org/api/latest.json?app_id=76e31cf78b46494986f8f5ec65ed381c" */
                    url : "http://192.168.1.4/tabulata/test-json/exchangeRates.json"
                }
            ],
            singulars : [
                {
                    name : 'Valuation Currency',
                    value : 'CHF'
                }
                ,
                {
                    name : 'Total Worth',
                    value : 'Positions.AmountInBase.sum',
                    isFavorite: true
                }
            ],
            lists: [
                {
                    name: 'Positions',
                    numRows: 4,
                    columns: [
                        {
                            name: 'Currency',
                            values: ['CHF', 'USD', 'EUR', 'HKD']
                        },
                        {
                            name: 'Amount',
                            dataType: 'number',
                            values: [150, 100000, 500, 200]
                        },
                        {
                            name: 'Amount In Base',
                            valueFunction: 'Amount * ExchangeRate.CrossRate.selectFirst(Currency == ExchangeRate.Currency)'
                        }
                    ]
                }
                ,
                {
                    name: 'Exchange Rate',
                    columns: [
                        {
                            name: 'Currency',
                            valueFunction: 'OpenRates.rates[]'
                        },
                        {
                            name: 'Rate',
                            valueFunction: 'OpenRates.rates[Currency]'
                        },
                        {
                            name: 'Cross Rate',
                            valueFunction: 'Rate.selectFirst(Currency == ValuationCurrency) / Rate'
                        }
                    ]
                }
            ]
        }
        ,
        {
            prolog: {
                name: 'Fibonacci',
                id: generateUuid()
            },
            singulars : [
            ],
            lists: [
                {
                    name: 'Fibonacci One',
                    numRows: 15,
                    columns: [
                        {
                            name: 'Inductive',
                            dataType: 'number',
                            values: [0, 1, 0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0,  0]
                        },
                        {
                            name: 'Calculated',
                            valueFunction: 'Inductive + Calculated.above + Calculated.above(2)'
                        }
                    ]
                }
                ,
                {
                    name: 'Fibonacci Two',
                    numRows: 15,
                    columns: [
                        {
                            name: 'Index',
                            valueFunction: 'Sequence(15)'
                        },
                        {
                            name: 'Calculated',
                            valueFunction: 'If(Index==0, 0, If(Index==1, 1, Calculated.above + Calculated.above(2)))'
                        }
                    ]
                }
            ]
        }

    ];