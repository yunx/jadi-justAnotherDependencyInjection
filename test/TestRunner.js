"use strict";

var jadiTest = require("../src/testPlugIn.js").jadiTest();

jadiTest.run({
	path : "./jadiTest@SomeTest",
	testSuit : "Sometest",
	scope : "p"
},
{
	path : "./jadiTest@SomeTest",
	testSuit : "Some test Else",
	scope : "p"
});