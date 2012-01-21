"use strict";
var jadi = require("./jadi.js").jadi;
exports.jadi = function(jadiInstance){
	
	jadiInstance = jadiInstance || jadi();
	
	return jadiInstance.plugIn(function(){
		var container = this;
		var originalResolve = container.utils.resolvePath;
		var pathUtil = require('path');
		container.utils.resolvePath = function(obj,path,parent){
			var moduleClazz = path.split("@");
			if(moduleClazz.length === 2){
				var abPath = pathUtil.resolve(moduleClazz[0]);
				var hasJs = abPath.indexOf(".js") !== -1;
				if(!hasJs){
					abPath = abPath+".js";
				}
				if(pathUtil.existsSync(abPath)){
					var clazz = moduleClazz[1];
					return require(abPath)[clazz];
				}
				else{
					throw new Error(moduleClazz[0] + " not found");
				}
			}
			return originalResolve(obj,path,parent);
		};
		
		jadiInstance.nodeBeans = function(){
			var mapping = container.factory.mapping;
			var definitions = [];
			for(var i=0; i<arguments.length; i++){
				definitions.push(arguments[i]);
			}
			mapping.addBeanDefinition.apply(mapping, definitions);
		};		
		
		jadiInstance.createServer = function(configFiles){
			for(var i=0; i<configFiles.length; i++){
				var filePath = pathUtil.resolve(configFiles[i]);
				var beanDefinitions = require(filePath).beanDefinitions;
				jadiInstance.nodeBeans(beanDefinitions);
				for(var i=0; i<beanDefinitions.length; i++){
					if(beanDefinitions[i].dispatcher){
						if(beanDefinitions[i].id !==  undefined){
							var dispatcher = jadiInstance.getBean(beanDefinitions[i].id);
						}
						else{
							var dispatcher = jadiInstance.newInstance(beanDefinitions[i]);
						}
						break;
					}
				}
				if(dispatcher === undefined){
					throw "need to define a dispatcher";
				}
			}
			var server=  require("http").createServer(dispatcher.start);
			return server;
		}		
		return jadiInstance;
	});
}