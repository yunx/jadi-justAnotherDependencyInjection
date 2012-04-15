"use strict";

var jadiTest = require("jaidTest").jadiTest();

jadiTest.declareBeans({
	id : "jadiUtils",
	path : "./jadiTest@SomeTest"
});

jadiTest.run({
	path : "./jadiTest@SomeTest",
	args : ["path:jadi.utils","strs"],
	property : {
		utils : "path:jadi.utils",
		str : "someStr",
		id : "id:jadiUtils"
	},
	init : "initMethod",
	scope : "p",
	test : {
		suite : "Bean definition test suite",
		injectMethods : {
			testJadiTestParameterPassing : ["path:jadi.utils"]
		}
	}	
},{
	path : "./jadiTest@This",
	extend:{
		path : "./jadiTest@Super"
	},
	test : {
		suite : "Bean definition test suite"
	}
},{
	beanFactoryAware : true,
	path : "./jadiTestBean@",
	test : {
		suite : "Bean definition test suite",
		injectMethods : {
			testBeanFactoryAwareBeanRetrival : ["id:jadiUtils"]
		}
	}
});