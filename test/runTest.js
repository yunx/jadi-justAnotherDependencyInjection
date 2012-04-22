"use strict";
var jadiParent = require("./../src/nodePlugIn.js").newInstance(undefined,"./parent/");
jadiParent.load(["./parent/parentBean.js"]);
var jadiInstance = require("./../src/nodePlugIn.js").newInstance(jadiParent);
var jadiTest = require("jadiTest").jadiTest(jadiInstance);

jadiTest.declareBeans({
	id : "jadiUtils",
	path : "./jadiTest@SomeTest"
},{
	id : "externalConstrutorTest",
	func : function(){
		this.pass = true;
	},
	newit : true
},
{
	id : "eagerBean",
	path : "./beans@Eager",
	eager : true,
	scope : "p"
},{
	id : "equalityBean",
	path : "./beans@Equality",
	scope : "p"	
});

jadiTest.run({
	path : "./jadiTest@SomeTest",
	args : [ "path:jadi.utils", "strs" ],
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
			testJadiTestParameterPassing : [ "path:jadi.utils" ]
		},
		timeout : {
			testJadiTestTimeout : 10
		}
	}
}, {
	path : "./jadiTest@This",
	extend : {
		path : "./jadiTest@Super"
	},
	test : {
		suite : "Bean definition test suite"
	}
}, {
	beanFactoryAware : true,
	path : "./jadiBeanTest@",
	test : {
		suite : "Bean definition test suite",
		injectMethods : {
			testBeanFactoryAwareBeanRetrival : [ "id:jadiUtils" ],
			testExternalConsturtor : ["id:externalConstrutorTest"],
			testEagerBean : ["id:eagerBean"],
			testBeanScope : ["id:equalityBean","id:equalityBean"],
			testParentBean : ["id:parentBean"],
		}
	}
});