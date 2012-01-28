"use strict";
exports.FilterTemplate = function(){
	
	return {
		invoke : function(request, response, invocationChain){
			this.doInvoke();
			filterChain.next(request, response);
		}
	};
}

function ScopedContext(app,session,action){
	var page = {};
	var prefixed = {
		"#app" : app,
		"#sess" : session,
		"#page" : page,
		"#action" : action
	};
	function determineScope(str){
		if(str in prefixed){
			return prefixed;
		}
		if(page[str] !== undefined){
			return page;
		}
		if(action[str] !== undefined){
			return action;
		}
		throw new Error(str+" not in any scope!");
	}
	
	return {
		get : function(str){
			var splited = str.split(".");
			var scopedObject = determineScope(splited[0]);
			for(var i=0; i < splited.length; i++){
				scopedObject = scopedObject[splited[i]];
				if(scopedObject === undefined){
					return undefined;
				}
			}
			return scopedObject;
		},
		set : function(val, to, type){
			type = type || '#page';
			if(type[0] !== '#'){
				type = '#'+type;
			}
			var scope = prefixed[type];
			var splited = to.split(".");
			for(var i=0; i<splited.length-1; i++){
				var obj = scope[splited[i]];
				if(obj === undefined){
					scope[splited[i]] = obj = {};
				}
				scope =  obj;
			}
			scope[splited[splited.length-1]] = val;
		}
	}	
}

function DefaultViewRenderer(utils){
	var sandbox = require("./../../common/sandbox.js").GlobalBinder();
	var tagLibs = require("./../mvc/view.js").TagLibs();
	var valueResolver = require("./../../common/attributes.js").Resolver();
	var viewEvaluator = require("./../mvc/view.js").Evaluator(utils,tagLibs,valueResolver);	
	
	function loadJadiView(view){
		return sandbox.loadView(view,tagLibs);
	}
	
	return {
		render : function(view, viewContext){
			//need to cache
			var jadiView = loadJadiView(view);
			viewContext.loadTemplate = loadJadiView;
			viewEvaluator.evaluate(jadiView, viewContext);
			viewContext.response.end();
		}
	};
}

exports.DefaultViewRenderer = DefaultViewRenderer; 

exports.Dispatcher = function(actionMapping, utils){
	
	function InvocationChain(actionPreparer, filters, request, response){
		var current = -1;
		var chainLength = filters.length;
		return {
			next : function(){
				if(current === chainLength-1){
					actionPreparer.prepare(request, response);
					actionPreparer.actionInvocation.invoke(request, response);
					return;
				}
				current++;
				filters[current].invoke(request, response, this);
			}
		};
	};
	
	var urlParser = require('url');
	var filters = [];
	var viewRenderer= undefined;
	var actionPreparer = ActionPreparer(actionMapping);
	
	function ActionPreparer(mapping){
	/*	var actionMapping2 = {
			"/something/dfd.html" : {
				id : "id",
				method : "",
				results : {
					success : "viewPath"
				}
			}
		}*/
		
		if(viewRenderer === undefined){
			viewRenderer = DefaultViewRenderer(utils);
		}
		
		return {
			prepare : function(request,response){
				var url = urlParser.parse(request.url).pathname;
				var map = mapping[url];
				var action = this.beanFactory.getBean(map.id);
				var actionInfo = {
					action : action,
					method : map.method
				};
				
				if(request.context !== undefined){
					throw new Error("request already has context defined! consider refactor.");
				}
				request.context = {
					actionInfo : actionInfo
				};
				response.context = {
					render : function(result){
						var view = map.results[result];
						if(view === undefined){
							throw new Error("action result[" + result + "] not defined!");
						}
						viewRenderer.render(view,{
							request : request,
							response : response,
							scopes : ScopedContext({},{},action)
						});
					}
				};
			}
		};
	}

	return {
		setFilters : function(_filters){
			filters = _filters;
		},
		setBeanFactory : function(beanFactory){
			actionPreparer.beanFactory = beanFactory;
		},
		setViewRenderer : function(_viewRenderer){
			viewRenderer = _viewRenderer;
		},
		setActionInvocation : function(actionInvocation){
			actionPreparer.actionInvocation = actionInvocation[0];
		},
		start : function(request, response){
			InvocationChain(actionPreparer, filters, request, response).next();
		}
	}	
}