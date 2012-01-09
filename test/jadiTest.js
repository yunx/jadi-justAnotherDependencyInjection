"use strict";
exports.SomeTest = function(){	
	return {
		testOne : function(){
			var assertion = this;
			assertion.compare(1, "===", 1);
		},
		testTwo : function(){
			var assertion = this;
			var asynTest = assertion.proxy(function(){
				assertion.exception("error in asynTest");
				throw "error in asynTest";
			})
			setTimeout(asynTest,1000);
		},
		testThree: function(){
			var assertion = this;
			var asynTest = assertion.proxy(function(){
				for(var i=0; i<100; i++){
					i++;
				}
			})
			setTimeout(asynTest,2000);
		}
	};
}