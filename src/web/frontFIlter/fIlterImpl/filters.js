"use strict";
exports.SessionFilter = function(sessionManager){
	
	return {
		invoke : function(request, response, filterChain){
			sessionManager.maintainSession(request, response);
			filterChain.next();
		}
	};
}

exports.ErrorHandlingFilter = function(exceptionHandler){
	
	var defaultHandler = {
		handle : function(e, response){
			response.end("error occur!");
		}	
	};
	exceptionHandler = exceptionHandler || defaultHandler;		
	process.on("uncaughtException",function(e){
		if(e.response !== undefined){
			exceptionHandler.handle(e, e.response());
		}
		
		if(e.stack !== undefined){
			console.log(e.stack);
		}
		else{
			console.log(e);
		}
	});
	
	function format(e, request, response){
		var tbr = {
			name : e.name || "exception",
			message : e.message || (typeof e === "string"? e : "unknown"),
			stack : e.stack,
			request : function(){
				return request;
			},
			response : function(){
				return response;
			}
		};
		for(var name in e){
			if(tbr[name] !== undefined){
				tbr[name] = e[name];
			}
		}
		return tbr;
	}
	
	function wrap(request, response){
		return function exceptionTransform(fn){
			return function(){
				try{
					return fn.apply(this,arguments);
				}
				catch(e){
					throw format(e, request, response);
				}				
			}
		};
	}
	function responseTimeout(response, time){
		setTimeout(function(time){
			response.end("you been time outed! in "+time+" mils");
		},time, time);
	};
	return {		
		invoke : function(request, response, filterChain){
			var exceptionWrapper = wrap(request,response);
			response.exceptionWrapper = exceptionWrapper;
			responseTimeout(response, 3000);
			filterChain.next = exceptionWrapper(filterChain.next);
			filterChain.next();
		}
	};
}

exports.StaticContentFilter = function(pathMap, failureHandler){
	var urlParser = require('url');
	var pathUtil = require('path');
	var fs = require('fs');
	pathMap = pathMap || {};
	
	return {
		invoke : function(request, response, filterChain){
			var parsedUrl = urlParser.parse(request.url);
			var pathName = parsedUrl.pathname;
			for(var name in pathMap){
				if(pathName.indexOf(name) === 0){
					var fileName = pathName.substring(name.length);
					var filePath = pathUtil.resolve(pathMap[name],fileName);
					var exists = pathUtil.existsSync(filePath);
					if(exists){
						var readStream = fs.createReadStream(filePath);
						readStream.pipe(response);
						return;
					}
					throw new Error("file not found");
				}
			}
			filterChain.next();
		}
	};	
}

exports.AuthenticationFilter = function(authenticator, failureHandler){
	return {
		invoke : function(request, response, filterChain){
			var context = request.getContext();
			if(context !== undefined && context.authEntity !== undefined){
				nextFilter.intercept(request, response, nextFilter);
			}
			else{
				authenticator.authen(request, reponse, function(authenStatus){
					if(authenStatus.successful){
						filterChain.next(request, response);
					}
					else{
						
					}
				});
			}
		}
	}
}

exports.ActionInvocationFiler = function(){
	return {
		invoke : function(request, response, filterChain){			
			var action = request.context.actionInfo.action;
			var method = request.context.actionInfo.method;
			method = action[method];
			method.apply(action,[response.context.render]);
		}
	};
}