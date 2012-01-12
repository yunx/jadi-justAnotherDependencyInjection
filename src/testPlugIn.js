exports.jadiTest = function(jadiInstance){
	var jadi = require("./nodePlugIn.js").jadi;
	jadi = jadiInstance || jadi();
	
	jadi.clazz("jadi.Test",function test(utils, injector, aop){
		var suits = {};
		
		var getCia = function getCreateIfAbsent(obj,name){
			var val = obj[name] || (obj[name]=[]);
			return val;
		}		
		
		var jadiTester = function(suitName, path){
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
			var testResult = {
				pass : undefined,
				error : undefined
			};
			var started = 0;
			var finished = 0;
			return {
				proxy : function proxy(fn){
					var that = this;
					started++;
					return function(){
						try{							
							fn.apply(that,arguments);
							testResult.pass = true;
						}
						catch(e){
							if(!that.expectException(e)){
								testResult.pass = false;
							}
							else{
								testResult.pass = true;
							}
						}
						finished++;
					};					
				},
				compare : function(expected, operator, result, message){
					var pass = doCompare(expected, operator, result);
					if(!pass){
						throw new Error(message || expected + " " + operator + " " + result + " is not true"); 
					}
				},
				exception : function(e){
					expectedException = e;
				},
				expectException : function(e){
					if(expectedException === undefined){
						testResult.error = e;
						return false;
					}
					if(utils.isString(e)){
						return e === expectedException;
					}
					if(utils.isObject(e)){
						return e instanceof expectedException;
					}
					testResult.error = e;
				},
				getResultHolder : function(){
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
			addCase : function(context, path, testCase){
				var suiteName = context.suite || "default";
				var methodParameters = injector.inject({},context.injectMethods);
				var testCase = aop.intercept(testCase,function(obj, methodName){
					var parameters = methodParameters[methodName];
					var method = obj[methodName];
					if(parameters !== undefined){
						return function(){
							return method.apply(this,parameters);
						}
					}
					return method;
				});

				getCia(suits, suiteName).push({
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
							if(name === undefined || name.indexOf("test") !== 0){
								continue;
							}
							var caseMethod = testCase[name];
							if(utils.isFunction(caseMethod)){
								var clazzName = path+"."+name;
								var tester = jadiTester(sname,clazzName);
								tester.proxy(caseMethod)();
								var holder = tester.getResultHolder();
								results.push({
									method : clazzName,
									getResult : holder
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
				args : [utils, "path:jadi.factory.injector", "path:jadi.aop.Interceptor"]
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
					if(beanDefinition.test !== undefined){
						var testCase = jadi.newInstance(beanDefinition);
						jadiTest.addCase(beanDefinition.test, beanDefinition.path, testCase);
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
						if(caseResult.getResult() === undefined){
							return;
						}
						var finalResult = caseResult.getResult();
						console.log(( finalResult.pass ? "  Pass" : "  Fail") + "   " + caseResult.method);
						if(finalResult.error){
							console.log(finalResult.error.stack);
						}
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