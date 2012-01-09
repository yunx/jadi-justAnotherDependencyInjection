"use strict";

var jadiTest = require("./src/testPlugIn.js").jadiTest();

jadiTest.run({
	id : "testPositive",
	path : "./test/jadiTest@SomeTest",
	testSuit : "Sometest",
	scope : "p"
},
{
	id : "testPositive2",
	path : "./test/jadiTest@SomeTest",
	testSuit : "Some test Else",
	scope : "p"
});