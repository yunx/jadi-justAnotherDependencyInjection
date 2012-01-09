exports = exports || {};
exports.jadi = function jadi(){
/**
* NO more new keyword! All {}! NO more inheritance! All mixin!
* Object constructor and function are the same! all are invokables.
**/
var define = (function createContainer(){
	var utils = {
		isModule : function(ending, contextType){
			return contextCreator.MODULE === contextType;
		},
		assertDeclaration : function (item, name){
			if(item !== undefined){
				throw name+" already declared!"
			}
		},
		merge : function(src, des, soft){
			if(src === undefined){
				return;
			}
			for(var property in src){
				this.assertDeclaration(des[property], property);
				des[property] = src[property];
			}
			return des;
		},
		resolvePath : function(obj,path,parent){
			var fullPath = path.split(".");
			var des = obj;
			for(var i=0; i < fullPath.length - 1; i++){
				var exist = des[fullPath[i]];
				if(!exist){
					des[fullPath[i]] = {};
				}
				des = des[fullPath[i]];
			}
			if(parent){
				return des;
			}
			return des[fullPath[fullPath.length-1]];
		}
	};
	var container = {};
	container.utils = utils;
	function Tbr(input){
		return {
			bind : function(target, name, property){
				if(target[name] !== undefined){
					throw target + "["+name+"] already exist! Cannot bind to this name space!";
				}
				if(name !== undefined && property !== undefined){
					target[name] = input[property];
				}
				else if(name !== undefined){
					target[name] = input;
				}
				else if(typeof input === "object"){
					utils.merge(input,target);
				}
			}
		};
	}
	var contextCreator = function Context(name,contextType,fn,internal){
		internal = internal === undefined? true : internal;
		var fullPath = name.split(".");
		var des = utils.resolvePath(container,name,true);
		var ending = fullPath[fullPath.length-1];
		if(utils.isModule(ending,contextType)){
			var existingModule = des[ending] || (des[ending] = {});
			var module = {};
			var result = fn(module, internal ? container: undefined);
			utils.merge(module, existingModule);
			utils.merge(result, existingModule);
			return Tbr(existingModule);
		}
		utils.assertDeclaration(des[ending], name);
		des[ending] = fn;
		return Tbr(fn);
	};
	
	return utils.merge({
		CLAZZ : "clazz",
		MODULE : "module"
	}, contextCreator);
})();

define("architecture",define.MODULE,function(m,container){
	return {
		clazz : function(name,fn,internal){
			return define(name,define.CLAZZ,fn,internal);
		},
		module : function(name,fn,internal){
			return define(name,define.MODULE,fn,internal);
		}	
	}
}).bind(define);

define.module("utils", function utils(module){
	return {
		isString : function(val){
			return typeof val === "string";
		},
		isArray : function(val){
			return typeof val === "object" && val.length !== undefined;
		},
		isObject : function(val){
			return typeof val === "object";
		},
		parseColon : function(str){
			if(str === undefined){
				return false;
			}
			var val = str.split(":");
			return val.length !== 2? false : {
				prefix : val[0],
				subfix : val[1]
			}
		},
		isPrimitive : function(val){
			var primitives = {
				number : true,
				boolean : true,
				string : true
			};
			return typeof val in primitives;
		},
		isFunction : function(val){
			return typeof val === "function";
		},
		identity : function(bd){
			if(bd.id !== undefined){
				return "id:" + bd.id;
			}
			if(bd.path !== undefined){
				return "path:" + bd.path;
			}
			return "anonymous bean";
		}
	};
});

define.clazz("factory.BeanDefinition", function BeanDefinition(bd,utils){
	var EMPTY_ARRAY = [];
	var EMPTY_PROPERTY = {};
	
	function ParseProperty(prop){
		if(prop === undefined){
			return undefined;
		}
		if(utils.isArray(prop)){
			return prop;
		}
		if(utils.isObject(prop)){
			if("path" in prop){
				beanDef = BeanDefinition(prop,utils);
				beanDef.scope = "prototype";
				return beanDef;
			}
			return prop;
		}
		if(utils.isString(prop)){
			var parsed = utils.parseColon(prop);
			if(parsed && parsed.prefix === "path"){
				return parsed.subfix;
			}
			return prop;
		}
		if(utils.isPrimitive(prop)){
			return prop;
		}
	}
	
	function Property(p){
		if(p === undefined){
			return EMPTY_PROPERTY;
		}
		for(var name in p){
			var prop = p[name];
			p[name] = ParseProperty(prop);
 		}
		return p;
	}
	function Arg(args){
		if(args === undefined){
			return EMPTY_ARRAY;
		}
		if(utils.isString(args)){
			var parsed = utils.parseColon(args);
			if(parsed && parsed.prefix === "path"){
				return [parsed.subfix];
			}
			return [args];
		}
		if(utils.isArray(args)){
			var tbr = [];
			for(var i=0; i<args.length; i++){
				tbr.push(ParseProperty(args[i]));
			}
			return tbr;
		}
	}
	var tbr = {
		path : bd.path,
		scope: bd.scope,
		args :  Arg(bd.args),
		property : Property(bd.property),
		mixin : Arg(bd.mixin)
	};

	for(var name in bd){
		if(!(name in tbr)){			
			tbr[name] = bd[name];
		}
	}
	return tbr;
});

define.module("factory.mapping", function mapping(module,container){
	var mapping = {};
	return {
		getBeanDefinition : function(id){
			return mapping[id];
		},
		addBeanDefinition : function(){
			if(arguments[0].length !== undefined){
				arguments = arguments[0]
			}			
			var beanDefLength = arguments.length;
			for(var i=0; i < beanDefLength; i++){
				var beanDefinition = arguments[i];
				var id = beanDefinition.id;
				if(id === undefined){
					throw beanDefinition +" must specify an id.";
				}
				var exist = mapping[id];
				if(exist !== undefined){ throw "bean : [" +id+"] already existed"};
				mapping[id] = container.factory.BeanDefinition(beanDefinition, container.utils);
			}			
			return this;
		},
		get : function(id){
			return mapping[id];
		}
	};
});

define.clazz("factory.BeanGenerator", function BeanGenerator(container){
	var factory = container.factory;
	return {
		create : function(beanDefinition){
			if(typeof beanDefinition === "string"){
				beanDefinition = factory.BeanDefinition({path:beanDefinition});
			}
			var obj;
			var thisCreate = this.create;
			function getBean(argBd){
				if(typeof argBd === "string"){
					var parsed = container.utils.parseColon(argBd);
					if(parsed){
						if(parsed.prefix === "id"){
							return factory.getBean(parsed.subfix);
						}
						if(parsed.prefix === "path"){
							return thisCreate(parsed.subfix);
						}
					}					
				}
				if(container.utils.isPrimitive(argBd)){
					return argBd;
				}
				if("path" in argBd){
					return thisCreate(argBd);
				}
				if(container.utils.isArray(argBd)){
					var arrayTbr = [];
					for(var i=0; i<argBd.length; i++){
						arrayTbr.push(getBean(argBd[i]));
					}
					return arrayTbr;
				}
				if(container.utils.isObject(argBd)){
					return argBd;
				}
			}
			var consturctor = container.utils.resolvePath(container, beanDefinition.path);
			if(consturctor === undefined){
				throw beanDefinition.path + " must be defined before referencing to it";
			}
			if(typeof consturctor === "function"){
				var args = [];
				var bdArgs = beanDefinition.args;
				for(var i=0; i< bdArgs.length; i++){
					var argBd = bdArgs[i];
					args.push(getBean(argBd));
				}
				obj = consturctor.apply({},args);
				if(obj === undefined){
					throw "bean [" + beanDefinition.path + "] must not return null!";					
				}
				var properties = beanDefinition.property;
				for(var name in properties){
					var property = properties[name];
					var propBean = getBean(property);
					if(typeof obj[name] === "function"){
						propBean = propBean.length !== undefined? propBean : [propBean];
						obj[name].apply(obj,[propBean])
					}
					else{
						obj[name] = propBean;
					}
				}
				var mixins = beanDefinition.mixin;
				for(var name in mixins){
					var mixinee = getBean(mixins[name]);
					container.utils.merge(mixinee,obj);
				}
				return obj;
			}
			else if(typeof consturctor === "object"){
				return consturctor;
			}
		}
	};
});

define.module("aop", function aop(m,container){
	var mapping = container.factory.mapping;
	var postProductionProcedure = (function(){
		
		var procedures = [];		
		return {			
			addProcedure : function(procedure){
				procedures.push(procedure);
			},			
			advice : function (fnName, fn){
				if(fnName === "get"){
					return function p3Proxy(id){
						var bean = fn(id);
						var bd = mapping.getBeanDefinition(id);
						for(var i=0; i < procedures.length; i++){
							var modifiedBean = procedures[i](bean,bd);
							bean = modifiedBean || bean;
						}
						return bean;
					};
				}				
			}
		}; 
	})();
	
	return {
		Interceptor : function(){
			function makeProxy(fnName, fn, advice){
				var adviced = advice(fnName, fn);
				if(adviced === undefined || fn === adviced){
					return fn;
				}
				adviced.adviced = true;
				return adviced;
			}
			return {
				intercept : function(obj, advice){
					for(var name in obj){
						if(typeof obj[name] === 'function'){
							var proxied = makeProxy(name, obj[name], advice);
							obj[name] = proxied;
						}
					}
				}
			};
		},
		p3Advice : postProductionProcedure
	};
});

define.module("factory", function factory(m, container){
	var scope =  (function(){
		var prototype ={
			P : true,
			p : true,
			prototype : true
		}
		var prototypeFactory = {
			get : function(id){
				var bd = container.factory.mapping.get(id);
				return container.factory.BeanGenerator(container).create(bd);
			}
		};
		var interceptor = container.aop.Interceptor();
		var p3Advice = container.aop.p3Advice.advice;
		interceptor.intercept(prototypeFactory,p3Advice);
		
		var singletonFactory = (function(){
			var store = {};
			return {
				get : function(id){
					if(id in store){
						return store[id];
					}
					store[id] = prototypeFactory.get(id);
					return store[id];
				}
			};
		})();
		return function(scope){
			return scope in prototype ? prototypeFactory : singletonFactory;
		};
	})();

	return {
		getBean : function(id){
			var beanDefinition = container.factory.mapping.getBeanDefinition(id);
			if(beanDefinition === undefined){ throw "bean : [" +id+"] has not been defined"};
			return this.scope(beanDefinition.scope).get(id);
		},
		scope : scope,
		registerP3 : function(fn){
			container.aop.p3Advice.addProcedure(fn);			
		}
	};
});

define.module("factory", function DefaultPostProductionProcedure(m, container){	
	var factory = container.factory;	
	factory.registerP3(function initMethod(bean, bd){
		var utils = container.utils;
		if(bd.init === undefined){
			return bean;
		}
		if(utils.isFunction(bean[bd.init])){
			bean[bd.init]();
			return;
		}
		throw new Error("object[" + utils.identity(bd) + "] does not have init method [" + bd.init +"]");
	});
});

var jadi = {};
define.module("publicInterface", function PublicInterface(m, container){
	
	return{
		clazz : function(name, fn){
			define.clazz(name,fn,false);
		},
		module : function(name, fn){
			define.module(name,fn,false);
		},
		declareBeans : function(){
			var mapping = container.factory.mapping;
			var definitions = [];
			for(var i=0; i<arguments.length; i++){
				definitions.push(arguments[i]);
			}
			mapping.addBeanDefinition.apply(mapping, definitions);
			return definitions;
		},
		getBean : function(id){
			return container.factory.getBean(id);
		},
		newInstance : function(beanDefinition){
			return container.factory.BeanGenerator(container).create(beanDefinition);
		},
		require : function(beanIds, fn){
			var beans = [];
			for(var i=0; i<beanIds.length; i++){
				beans.push(this.getBean(beanIds[i]));
			}
			fn.apply({},beans);
		},
		mixin : function(src, des){
			return container.utils.merge(src,des);
		},
		plugIn : function(fn){
			return fn.apply(container,[]);
		}
	};
}).bind(jadi,"newInstance");

return jadi.newInstance;
};