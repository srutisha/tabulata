
//var
block = {
	prolog: {
		name: 'Check List',
	},
	singulars : [ {
		name : 'Percentage Done',
		value : 'Tasks.Task.select(Tasks.Done == {true}).count / Tasks.count'
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
		value : 'Tasks.HoursSpentTotal.sum'
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
		numRows: 4,
		columns: [
		    {
		    	name: 'Task',
		    	values: ['Task 1', 'Task 2', 'Task 3', 'Task 4']
		    },
		    {
		    	name: 'Done',
		    	values: [true, true, false, false]
		    },
		    {
		    	name: 'Hours Spent Intern',
		    	values: [5, 4, 3, 2]
		    },
		    {
		    	name: 'Salary Intern',
		    	valueFunction: 'HoursSpentIntern * SalaryPerHourIntern'
		    },
		    {
		    	name: 'Hours Spent Extern',
		    	values: [6, 3, 2, 1]
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
		    	values: ['2012-03-12T14:39:30Z', '2011-03-12T14:39:30Z', '2012-03-12T14:39:30Z', '2011-03-12T14:39:30Z']
		    },
		    
		]
	}
	]
}
;

