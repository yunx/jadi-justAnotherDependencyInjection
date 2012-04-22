"use strict";
exports.SomeTest = function(utils, strs) {
	var inited = false;
	var self = {
		testOne : function() {
			this.compare(1, "===", 1);
		},
		testTwo : function() {
			var assertion = this;
			var asynTest = assertion.proxy(function() {
				assertion.exception(Error);
				throw new Error("error in asynTest");
			})
			setTimeout(asynTest, 200);
		},
		testJadiTestParameterPassing : function(val) {
			this.compare(val, "!==", undefined);
		},
		testConsturctorInjectionPath : function() {
			this.compare(utils, "!==", undefined);
		},
		testConsturctorInjectionStr : function() {
			this.compare(strs, "===", "strs");
		},
		testPropertyInjectionPath : function() {
			this.compare(self.utils, "===", utils);
		},
		testPropertyInjectionStr : function() {
			this.compare(self.str, "===", "someStr");
		},
		testPropertyInjectionId : function() {
			this.compare(self.id, "!==", undefined);
		},
		testInitMethod : function() {
			this.compare(inited, "===", true);
		},
		testJadiTestTimeout : function() {
			setTimeout(this.proxy(function() {
				
			}),100);
		},
		initMethod : function() {
			inited = true;
		}
	};
	return self;
}

exports.Super = function() {
	this.fromSuper = true;
}

exports.This = function() {
	var self = this;
	this.testInheritance = function() {
		this.compare(self.fromSuper, "===", true);
	}
}