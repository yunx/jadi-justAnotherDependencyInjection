"use strict";
var jadi = require("./jadi.js").jadi;
exports.newInstance = function(jadiInstance){
	
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
					if(clazz === ""){
						return require(abPath);
					}
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
		
		jadiInstance.load = function(configFiles){
			for(var i=0; i<configFiles.length; i++){
				var filePath = pathUtil.resolve(configFiles[i]);
				var beanDefinitions = require(filePath).beanDefinitions;
				jadiInstance.nodeBeans(beanDefinitions);
				for(var j=0; j<beanDefinitions.length; j++){
					if(beanDefinitions[j].dispatcher){
						if(beanDefinitions[j].id !==  undefined){
							var dispatcher = jadiInstance.getBean(beanDefinitions[j].id);
						}
						else{
							var dispatcher = jadiInstance.newInstance(beanDefinitions[j]);
						}
						dispatcher.setBeanFactory(jadiInstance);
						break;
					}
				}
			}
			if(dispatcher === undefined){
				throw "need to define a dispatcher";
			}
			return dispatcher;
		}
		
		return jadiInstance;
	});
}