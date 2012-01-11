"use strict";
exports.SomeTest = function(utils,strs){	
	var self = {
		testOne : function(){
			this.compare(1, "===", 1);
		},
		testTwo : function(){
			var assertion = this;
			var asynTest = assertion.proxy(function(){
				assertion.exception(Error);
				throw new Error("error in asynTest");
			})
			setTimeout(asynTest,1000);
		},
		jadiTestParameterPassing : function(val){
			this.compare(val, "!==", undefined);
		},
		consturctorInjectionPath : function(){
			this.compare(utils, "!==", undefined);
		},
		consturctorInjectionStr : function(){
			this.compare(strs, "===" , "strs");
		},
		propertyInjectionPath : function(){
			this.compare(self.utils, "===", utils);
		},
		propertyInjectionStr : function(){
			this.compare(self.str, "===", "someStr");
		},
		propertyInjectionId : function(){
			this.compare(self.id, "!==", undefined);
		}
	};
	return self;
}