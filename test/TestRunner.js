"use strict";

var jadiTest = require("../src/testPlugIn.js").jadiTest();

jadiTest.run({
	id : "testPositive",
	path : "./jadiTest@SomeTest",
	testSuit : "Sometest",
	scope : "p"
},
{
	id : "testPositive2",
	path : "./jadiTest@SomeTest",
	testSuit : "Some test Else",
	scope : "p"
});