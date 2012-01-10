exports.jadiTest = function(jadiInstance){
	var jadi = require("./nodePlugIn.js").jadi;
	jadi = jadiInstance || jadi();
	
	jadi.clazz("jadi.Test",function test(utils){
		var suits = {};
		
		var getCia = function getCreateIfAbsent(obj,name){
			var val = obj[name] || (obj[name]=[]);
			return val;
		}		
		
		var assertion = function(suitName, path){
			function doCompare(expected, operator, result){
				switch(operator){
					case "==="	:
						return expected === result;
					case "=="	:
						return expected == result;
					case "<"	:
						return expected < result;
					case "<="	:
						return expected <= result;
					case ">"	:
						return expected > result;
					case ">="	:
						return expected >= result;
					case "!="	:
						return expected != result;
					case "!=="	:
						return expected !== result;
					default :
						throw operator + " not supported!"
				}
			}
			var expectedException = undefined;			
			var testResult = undefined;
			var started = 0;
			var finished = 0;
			return {
				proxy : function proxy(fn){
					var that = this;
					started++;
					return function(){
						try{							
							fn.apply(that,arguments);
							testResult = true;
						}
						catch(e){
							if(!that.expectException(e)){
								testResult = false;
							}
							else{
								testResult = true;
							}
						}
						finished++;
					};					
				},
				compare : function(expected, operator, result, message){
					var pass = doCompare(expected, operator, result);
					if(!pass){
						throw message || expected + " " + operator + " " + result + " is not true"; 
					}
				},
				exception : function(e){
					expectedException = e;
				},
				expectException : function(e){
					if(utils.isString(e)){
						return e === expectedException;
					}
					if(utils.isObject(e)){
						return e instanceof expectedException;
					}
				},
				getTestResult : function(){
					return function(){
						if(started === finished){
							return testResult;
						}
						return undefined;
					}
				}
			};
		};
		
		return {
			addCase : function(suitName, path, testCase){
				
				suitName = suitName || "default";
				getCia(suits,suitName).push({
					path : path,
					"case" : testCase
				});
			},
			run : function(){
				var testResults = {};
				for(var sname in suits){
					var results = testResults[sname] = [];
					var suit = suits[sname];
					for(var i=0; i < suit.length; i++){
						var testCase = suit[i]["case"];
						var path = suit[i]["path"]
						for(var name in testCase){
							var caseMethod = testCase[name];
							if(utils.isFunction(caseMethod)){
								var clazzName = path+"."+name;
								var asserts = assertion(sname,clazzName);
								asserts.proxy(caseMethod)();
								var pass = asserts.getTestResult();
								results.push({
									method : clazzName,
									pass : pass
								});
							}
						}
					}
				}
				return testResults;
			}
		};
	});
	
	return jadi.plugIn(function(){
		var utils = this.utils;
		var container = this;
		jadi.run = function(){
			var jadiTest = jadi.newInstance({
				path : "jadi.Test",
				args : [utils]
			});
			var contextFiles = arguments;
			for(var i=0; i < contextFiles.length; i++){
				var contextFile = contextFiles[i];
				if(utils.isString(contextFile)){
					var filePath = require('path').resolve(contextFiles[i]);
					var beanDefinitions = require(filePath).beanDefinitions;
				}
				else if(contextFile.path !== undefined){
					var beanDefinitions = [contextFile];
				}				
				for(var j=0; j < beanDefinitions.length; j++){
					var beanDefinition = beanDefinitions[j];
					if(beanDefinition.testSuit !== undefined){
						var testCase = jadi.newInstance(beanDefinition);
						jadiTest.addCase(beanDefinition.testSuit, beanDefinition.path, testCase);
					}					
				}
			}
			
			var label = "Total Test Run Time";
			console.time(label);
			var results = jadiTest.run();
			var intervalId = setInterval(function(){
				for(var name in results){
					var result = results[name];
					if(result === undefined){
						continue;
					}
					if(!result.isPrinted){
						console.log(name);
						result.isPrinted = true;
					}					
					for(var i=0; i<result.length; i++){
						var caseResult = result[i];
						if(caseResult === undefined){
							continue;
						}
						if(caseResult.pass() === undefined){
							return;
						}
						console.log((caseResult.pass() ? "  Pass" : "  Fail") + "   " + caseResult.method);
						delete result[i];
					}
					delete results[name];
				}
				clearInterval(intervalId);
				console.log("===============================================");
				console.timeEnd(label);
			},100);
			
		};
		
		return jadi;
	});
}