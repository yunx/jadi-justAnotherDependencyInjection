(function(){
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
		merge : function(src, des){
			if(src === undefined){
				return;
			}
			for(var property in src){
				this.assertDeclaration(des[property], name+"."+property);
				des[property] = src[property];
			}
			return des;
		},
		reflectedGet : function(obj,path,parent){
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
		var des = utils.reflectedGet(container,name,true);
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

define.module("utils", function(module){
	return {
		isString : function(val){
			return typeof val === "string";
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
		}
	};
});

define.clazz("factory.BeanDefinition", function BeanDefinition(bd,utils,base){
	var EMPTY_ARRAY = [];
	var EMPTY_PROPERTY = {};
	function Property(p){
		if(p === undefined){
			return EMPTY_PROPERTY;
		}
		function ParseProperty(prop){
			if(prop !== undefined && typeof prop === "object"){
				beanDef = BeanDefinition(prop,base);
				beanDef.scope = "prototype";
				return beanDef;
			}
			if(typeof prop === "string"){
				var parsed = utils.parseColon(prop);
				if(parsed && parsed.prefix === "path"){
					return parsed.prefix+":"+AddBase(parsed.subfix);
				}
				return prop;
			}
			if(utils.isPrimitive(prop)){
				return prop;
			}
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
		if(typeof args === "string"){
			var parsed = utils.parseColon(args);
			if(parsed && parsed.prefix === "path"){
				return [parsed.prefix+":"+AddBase(parsed.subfix)];
			}
			return [args];
		}
		if(typeof args === "object"){
			return Property(args);
		}
	}
	function AddBase(path){
		if(base === undefined || base.length === 0){
			return path;
		}
		return base + "." +path;
	}
	return{
		path : AddBase(bd.path),
		scope: bd.scope,
		args :  Arg(bd.args),
		property : Property(bd.property)
	};
});

define.module("factory.mapping", function(module,container){
	var mapping = {};
	return {
		getBeanDefinition : function(id){
			return mapping[id];
		},
		addBeanDefinition : function(){
			var beanDefinitions = [];
			var base = "";
			beanDefLength = arguments.length;
			if(typeof arguments[arguments.length-1] === "string"){
				base = arguments[arguments.length-1];
				beanDefLength--;
			}
			for(var i=0; i<beanDefLength; i++){
				var beanDefinition = arguments[i];
				var id = beanDefinition.id;
				if(id === undefined){
					throw beanDefinition +" must specify an id.";
				}
				var exist = mapping[id];
				if(exist !== undefined){ throw "bean : [" +id+"] already existed"};
				mapping[id] = container.factory.BeanDefinition(beanDefinition, container.utils, base);
			}			
			return this;
		},
	};
});

define.clazz("factory.BeanGenerator", function BeanGenerator(id, container){
	var mapping = container.factory.mapping;
	var factory = container.factory;
	function BeanNotDefined(innerId, parentId){
				return "bean ["+innerId + "] has not been defined, and referenced in bean ["+parentId+"]";
	}
	var parentBeanDefinition = mapping.getBeanDefinition(id);
	return {
		create : function(beanDefinition){
			if(beanDefinition === undefined){
				beanDefinition = parentBeanDefinition;
			}
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
			}
			var consturctor = container.utils.reflectedGet(container, beanDefinition.path);
			if(typeof consturctor === "function"){
				var args = [];
				var bdArgs = beanDefinition.args;
				for(var i=0; i< bdArgs.length; i++){
					var argBd = bdArgs[i];
					args.push(getBean(argBd));
				}
				obj = consturctor.apply(undefined,args);
				var properties = beanDefinition.property;
				for(var name in properties){
					var property = properties[name];
					obj[name] = getBean(property);
				}
				return obj;
			}
			else if(typeof consturctor === "object"){
				return consturctor;
			}
		}
	};
});

define.module("factory", function(m, container){
	var scope =  (function(){
		var singleton ={
			"1" : true,
			s : true,
			S : true,
			singleton : true
		}
		var prototypeFactory = {
			get : function(id){
				return container.factory.BeanGenerator(id,container).create();
			}
		};
		var singletonFactory = (function(){
			var store = {};
			return {
				get : function(id){
					var singleton = store[id];
					if(singleton !== undefined){
						return singleton;
					}
					store[id] = container.factory.BeanGenerator(id,container).create();
					return store[id];
				}
			};
		})();
		return function(s){
			return s in singleton ? singletonFactory : prototypeFactory;
		};
	})();	
	return {
		getBean : function(id){
			var beanDefinition = container.factory.mapping.getBeanDefinition(id);
			if(beanDefinition === undefined){ throw "bean : [" +id+"] has not been defined"};
			return scope(beanDefinition.scope).get(id);
		}
	};
});

define.module("publicInterface", function PublicInterface(m, container){
	return{
		clazz : function(name, fn){
			define.clazz("modules."+name,fn,false);
		},
		module : function(name, fn){
			define.module("modules."+name,fn,false);
		},
		declareBeans : function(){
			var mapping = container.factory.mapping;
			var definitions = [];
			for(var i=0; i<arguments.length; i++){
				definitions.push(arguments[i]);
			}
			definitions.push("modules");
			mapping.addBeanDefinition.apply(mapping, definitions);
		},
		getBean : function(id){
			return container.factory.getBean(id);
		},
		newInstance : function(beanDefinition){
			return container.factory.BeanGenerator(undefined, container).create(beanDefinition);
		},
		require : function(beanIds, fn){
			var beans = [];
			for(var i=0; i<beanIds.length; i++){
				beans.push(this.getBean(beanIds[i]));
			}
			fn.apply({},beans);
		}
	};
}).bind(this,"jadi");
})();
