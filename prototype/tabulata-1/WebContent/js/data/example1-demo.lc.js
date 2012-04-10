
//var
block = {
	prolog: {
		name: 'Check List',
	},
	singulars : [ 
	{
		name : 'Sum Intern',
		value : 'Tasks.HoursSpentIntern.sum'
	}, {
		name : 'Sum Extern',
		value : 'Tasks.HoursSpentExtern.sum'
	}, {
		name : 'Total Sum Of Columns',
		value : 'Tasks.HoursSpentIntern.sum + Tasks.HoursSpentExtern.sum'
	}, {
		name : 'Total Sum of Singulars',
		value : 'SumExtern + SumIntern'
	}, {
		name : 'Percentage Done',
		value : 'Tasks.Task.select(Tasks.Done == {true}).count / Tasks.count'
	}, {
		name : 'Spent On Done Total',
		value : 'Tasks.HoursSpentTotal.select(Tasks.Done == {true}).sum'
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
		    	values: [true, true, false, false, true, false, false, true, false, false, true, false, false, true, false, false, true, false, false, true, false, false, true, false, false]
		    },
		    {
		    	name: 'Hours Spent Intern',
		    	values: [5, 4, 3, 2, 4, 3, 2, 4, 3, 2, 4, 3, 2, 4, 3, 2, 4, 3, 2, 4, 3, 2, 4, 3, 2]
		    },
		    {
		    	name: 'Salary Intern',
		    	valueFunction: 'HoursSpentIntern * SalaryPerHourIntern'
		    },
		    {
		    	name: 'Hours Spent Extern',
		    	values: [6, 3, 2, 1, 3, 2, 1, 3, 2, 1, 3, 2, 1, 3, 2, 1, 3, 2, 1, 3, 2, 1, 3, 2, 1]
		    },
		    {
		    	name: 'Sum Hours Spent',
		    	valueFunction: 'SumHoursSpent.above + HoursSpentIntern + HoursSpentExtern'
		    }
		    
		]
	}
	]
}
;

var taskEnum = function () {
	block.lists[0].columns[0].values.forEach(function (e, i) {
		block.lists[0].columns[0].values[i] = "Task "+(i+1);
		
	});
};

taskEnum();



