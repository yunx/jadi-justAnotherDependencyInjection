"use strict";

var jadiTest = require("../src/testPlugIn.js").jadiTest();

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
	scope : "p",
	test : {
		suite : "Bean definition test suit",
		injectMethods : {
			jadiTestParameterPassing : ["path:jadi.utils"]
		}
	}	
});