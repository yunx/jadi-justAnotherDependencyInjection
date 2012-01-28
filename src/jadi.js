exports = exports || {};
exports.jadi = function Jadi(){

var define = (function createContainer(){
	var utils = {
		isModule : function(ending, contextType){
			return contextCreator.MODULE === contextType;
		},
		assertDeclaration : function (item, name){
			if(item !== undefined){
				throw new Error(name+" already declared!");
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
	var container = {jadi:{}};
	container.jadi.utils = utils;
	container.jadi.container = container;
	function Tbr(input){
		return {
			bind : function(target, name, property){
				if(target[name] !== undefined){
					throw new Error(target + "["+name+"] already exist! Cannot bind to this name space!");
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
			var result = fn(module, internal ? container.jadi: undefined);
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

define("jadi.architecture",define.MODULE,function(m,jadi){
	return {
		clazz : function(name,fn,internal){
			return define(name,define.CLAZZ,fn,internal);
		},
		module : function(name,fn,internal){
			return define(name,define.MODULE,fn,internal);
		}	
	}
}).bind(define);

define.module("jadi.utils", function utils(module){
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
		},
		compare : function doCompare(lhs, operator, rhs){
			switch(operator){
			case "==="	:
				return lhs === rhs;
			case "=="	:
				return lhs == rhs;
			case "<"	:
				return lhs < rhs;
			case "<="	:
				return lhs <= rhs;
			case ">"	:
				return lhs > rhs;
			case ">="	:
				return lhs >= rhs;
			case "!="	:
				return lhs != rhs;
			case "!=="	:
				return lhs !== rhs;
			default :
				throw operator + " not supported!"
			}
		}
	};
});

define.module("jadi.factory.beanDefinition", function BeanDefinition(m,jadi){
	var EMPTY_ARRAY = [];
	var EMPTY_PROPERTY = {};
	
	var utils = jadi.utils;
	function ParseProperty(prop){
		if(prop === undefined){
			return undefined;
		}
		if(utils.isArray(prop)){
			return prop;
		}
		if(utils.isObject(prop)){
			if("path" in prop){
				beanDef = jadi.factory.beanDefinition.normalize(prop);
				beanDef.scope = "prototype";
				return beanDef;
			}
			return prop;
		}
		if(utils.isString(prop)){
			var parsed = utils.parseColon(prop);
			if(parsed && parsed.prefix === "path"){
				beanDef = jadi.factory.beanDefinition.normalize({path:parsed.subfix});
				beanDef.scope = "prototype";
				return beanDef;
			}
			return prop;
		}
		if(utils.isPrimitive(prop)){
			return prop;
		}
	};	
	function Property(p){
		if(p === undefined){
			return EMPTY_PROPERTY;
		}
		for(var name in p){
			var prop = p[name];
			p[name] = ParseProperty(prop);
 		}
		return p;
	};
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
	};
	return {
		normalize : function(bd){
			if(bd === undefined){
				return undefined;
			}
			bd.extend = this.normalize(bd.extend);
			if(bd.extend !== undefined){
				bd.newit = true;
				bd.extend.newit = true;
			}
			var tbr = {
					path : bd.path,
					newit : Boolean(bd.newit),
					extend : this.normalize(bd.extend),
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
		},
		normalizeArg : function(args){
			return Arg(args);
		},
		normalizeProperty : function(property){
			return Property(property);
		},
		normalizeMixin : function(mixin){
			return Arg(mixin);
		}
	};
});

define.module("jadi.factory.mapping", function Mapping(module,jadi){
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
			var defNormalizer = jadi.factory.beanDefinition;
			for(var i=0; i < beanDefLength; i++){
				var beanDefinition = arguments[i];
				var id = beanDefinition.id;
				if(id === undefined){
					throw new Error(beanDefinition +" must specify an id.");
				}
				var exist = mapping[id];
				if(exist !== undefined){ throw new Error("bean : [" +id+"] already existed")};
				mapping[id] = defNormalizer.normalize(beanDefinition);
			}			
			return this;
		},
		get : function(id){
			return mapping[id];
		}
	};
});

define.module("jadi.factory.instantiation",function Instantiation(){
	
	function newitup(fn,args){
		switch(args.length){
			case 0: return new fn();
			case 1: return new fn(args[0]);
			case 2: return new fn(args[0],args[1]);
			case 3: return new fn(args[0],args[1],args[2]);
			case 4: return new fn(args[0],args[1],args[2],args[3]);
			case 5: return new fn(args[0],args[1],args[2],args[3],args[4]);
			case 6: return new fn(args[0],args[1],args[2],args[3],args[4],args[5]);
			default : throw new Error("jadi current doesnot support more than 6 args!");
		}		
	}
	
	return {
		construct : function(consturctor,args,bd){
			if(bd.newit){
				var instance = newitup(consturctor,args);
				Object.defineProperty(instance,"constructor",{
					value: consturctor,
				    enumerable: false,
				    writable: true,
				    configurable: true				
				});
				return instance;
			}
			return consturctor.apply({},args);
		},
		inherit : function(constructor,superInstance){
			if(superInstance === undefined){
				return;
			}
			var superConstructor = superInstance.constructor;
			if(superConstructor === undefined){
				throw Error("super clazz is undefined!");
			}
			if(constructor.super_ !== undefined && constructor.super_ !== superConstructor){
				throw Error(constructor + " already been extended");
			}
			if(constructor.super_ === superConstructor){
				return;
			}
			constructor.super_ = superConstructor;
			constructor.prototype = superInstance;
		}
	};	
});

define.module("jadi.factory.beanGenerator", function BeanGenerator(m,jadi){
	var factory = jadi.factory;
	return {
		getBean : function(argBd){
			if(typeof argBd === "string"){
				var parsed = jadi.utils.parseColon(argBd);
				if(parsed){
					if(parsed.prefix === "id"){
						return factory.getBean(parsed.subfix);
					}
					if(parsed.prefix === "path"){
						return factory.beanGenerator.createBean(parsed.subfix);
					}
				}					
			}
			if(jadi.utils.isPrimitive(argBd)){
				return argBd;
			}
			if("path" in argBd){
				return factory.beanGenerator.createBean(argBd);
			}
			if(jadi.utils.isArray(argBd)){
				var arrayTbr = [];
				for(var i=0; i<argBd.length; i++){
					arrayTbr.push(factory.beanGenerator.getBean(argBd[i]));
				}
				return arrayTbr;
			}
			if(jadi.utils.isObject(argBd)){
				return argBd;
			}
		},
		createBean : function(beanDefinition){
			var beanDefNormalizer = factory.beanDefinition;
			if(typeof beanDefinition === "string"){
				beanDefinition = beanDefNormalizer.normalize({path:beanDefinition});
			}
			else if(!beanDefinition._normalized){
				beanDefinition = beanDefNormalizer.normalize(beanDefinition);
			}
			var consturctor = jadi.utils.resolvePath(jadi.container, beanDefinition.path);
			if(consturctor === undefined){
				throw new Error(beanDefinition.path + " must be defined before referencing to it");
			}

			if(typeof consturctor === "function"){
				var args = [];
				var bdArgs = beanDefinition.args;
				for(var i=0; i< bdArgs.length; i++){
					var argBd = bdArgs[i];
					args.push(factory.beanGenerator.getBean(argBd));
				}
				if(beanDefinition.extend !== undefined){
					var super_ = jadi.factory.beanGenerator.getBean(beanDefinition.extend);
					factory.instantiation.inherit(consturctor,super_);
				}
				var obj = factory.instantiation.construct(consturctor,args,beanDefinition);
				if(obj === undefined){
					throw new Error("bean [" + beanDefinition.path + "] must not return null!");					
				}
				var injector = jadi.factory.injector;
				injector.inject(obj,beanDefinition.property);
				injector.mixin(obj,beanDefinition.mixin);
				return obj;
			}
			else if(typeof consturctor === "object"){
				return consturctor;
			}
		}
	};
});

define.module("jadi.factory.injector",function Injector(m,jadi){
	return{
		inject : function(obj,properties){
			var factory = jadi.factory;
			var beanDefNormalizer = jadi.factory.beanDefinition;
			properties = beanDefNormalizer.normalizeProperty(properties);
			
			for(var name in properties){
				var property = properties[name];
				var propBean = factory.beanGenerator.getBean(property);
				if(typeof obj[name] === "function"){
					propBean = propBean.length !== undefined? propBean : [propBean];
					obj[name].apply(obj,[propBean])
				}
				else{
					obj[name] = propBean;
				}
			}
			return obj;
		},
		mixin : function mixin(obj,mixins){
			var beanGenerator = jadi.factory.beanGenerator;
			var beanDefNormalizer = jadi.factory.beanDefinition;
			mixins = beanDefNormalizer.normalizeMixin(mixins);
			for(var name in mixins){
				var mixinee = beanGenerator.getBean(mixins[name]);
				jadi.utils.merge(mixinee,obj);
			}
			return obj;
		}
	};
});

define.module("jadi.aop", function Aop(m,jadi){
	var mapping = jadi.factory.mapping;
	var utils = jadi.utils;
	var postProductionProcedure = (function(){
		var procedures = [];		
		return {
			addProcedure : function(procedure){
				procedures.push(procedure);
			},			
			advice : function (generator, methodName){
				if(methodName === "createBean"){
					var fn = generator[methodName];
					return function p3Proxy(beanDefinition){
						var bean = fn.apply(generator,[beanDefinition]);			
						for(var i=0; i < procedures.length; i++){
							var modifiedBean = procedures[i](bean,beanDefinition);
							bean = modifiedBean || bean;
						}
						return bean;
					};
				}
				return undefined;
			}
		}; 
	})();
	
	return {
		Interceptor : function(){
			function makeProxy(advice,target,name){
				var fn = target[name];
				if(name === undefined){
					fn = target;
				}
				var adviced = advice(target,name);
				if(adviced === undefined || fn === adviced){
					return fn;
				}
				adviced.adviced = true;
				return adviced;
			}
			return {
				intercept : function(target, advice){
					if(target === undefined){
						throw new Error("cannot intercept undefined value!");
					}
					if(utils.isFunction(target)){
						return makeProxy(advice,target);
					}
					for(var name in target){
						if(utils.isFunction(target[name])){
							target[name] = makeProxy(advice,target,name);
						}
					}
					return target;
				}
			};
		},
		p3Advice : postProductionProcedure
	};
});

define.module("jadi.factory", function Factory(m, jadi){
	var interceptor = jadi.aop.Interceptor();
	var p3Advice = jadi.aop.p3Advice.advice;
	interceptor.intercept(jadi.factory.beanGenerator,p3Advice);
	
	var scope =  (function(){
		var prototype ={
			P : true,
			p : true,
			prototype : true
		}
		var prototypeFactory = {
			get : function(id){
				var bd = jadi.factory.mapping.get(id);
				return jadi.factory.beanGenerator.createBean(bd);
			}
		};
		
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
			var beanDefinition = jadi.factory.mapping.getBeanDefinition(id);
			if(beanDefinition === undefined){ throw new Error("bean : [" +id+"] has not been defined")};
			return this.scope(beanDefinition.scope).get(id);
		},
		scope : scope,
		registerP3 : function(fn){
			jadi.aop.p3Advice.addProcedure(fn);			
		}
	};
});

define.module("jadi.factory", function DefaultPostProductionProcedure(m, jadi){	
	var factory = jadi.factory;	
	factory.registerP3(function initMethod(bean, bd){
		var utils = jadi.utils;
		if(bd.init === undefined){
			return bean;
		}
		if(utils.isFunction(bean[bd.init])){
			bean[bd.init]();
			return;
		}
		throw new Error("object[" + utils.identity(bd) + "] does not have init method [" + bd.init +"]");
	});
	factory.registerP3(function factoryP3(bean, bd){
		if(bd.selfFactoryAware){
			bean.selfFactory = {
				make : function(){
					return factory.beanGenerator.createBean(bd);
				}	
			};
			return bean;
		}
		return bean;
	});
});

var jadi = {};
define.module("jadi.publicInterface", function PublicInterface(m, jadi){
	
	return{
		clazz : function(name, fn){
			define.clazz(name,fn,false);
		},
		module : function(name, fn){
			define.module(name,fn,false);
		},
		declareBeans : function(){
			var mapping = jadi.factory.mapping;
			var definitions = [];
			for(var i=0; i<arguments.length; i++){
				definitions.push(arguments[i]);
			}
			mapping.addBeanDefinition.apply(mapping, definitions);
			return definitions;
		},
		getBean : function(id){
			return jadi.factory.getBean(id);
		},
		newInstance : function(beanDefinition){
			return jadi.factory.beanGenerator.createBean(beanDefinition);
		},
		require : function(beanIds, fn){
			var beans = [];
			for(var i=0; i<beanIds.length; i++){
				beans.push(this.getBean(beanIds[i]));
			}
			fn.apply({},beans);
		},
		mixin : function(src, des){
			return jadi.utils.merge(src,des);
		},
		plugIn : function(fn){
			return fn.apply(jadi,[]);
		}
	};
}).bind(jadi,"newInstance");

return jadi.newInstance;
};