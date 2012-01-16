=================================================
Warning: some API changed, will update them sooon
=================================================
jadi Version : alpha

Any api will likely to be changed. It is still in a very early stage of its life : ), so there are lots of room to improve.

==========API=DOCs======================

//Defined a class:

	jadi.clazz("clazz.full.Name", function(arg1, arg2){
		//some fun details here
		return {
			collect : function(){
				if(this.sepcialName === "very sepcial"){
					//do some very sepcial thing
				}
			},
			sepcialName : undefined	
		};
	});

//Define a module:
//Example 1:
	jadi.module("clazz.full",function(module){
		module.SomeClazz = function(name,arg2){
			return {
				method1 : function(){
					//some method detail
				}
			};
		};
		
		module.SomeOtherClazz = function(someObject){
			//some fun details here
			return {
				method2: function(){
					someObject.method1();
				}
			}
		};
	});

//Example 2:
//equivalent to example 1
	jadi.module("clazz.full",function(){
		return {
			SomeClazz = function(name,arg2){
				return {
					method1 : function(){
						//some method detail
					}
				},
			SomeOtherClazz = function(someObject){
				//some fun details here
				return {
					method2: function(){
						someObject.method1();
					}
				}
		};	
	});

//declare beans, or wiring beans
	jadi.declareBeans({
		id : "nameCollector",
		path : "clazz.full.Name",
		scope : "s",
		args : ["id:someObject","path:clazz.full.SomeOtherClazz"],
		property : {sepcialName: "not very special"}
	},{
		id : "someObject",
		path : "clazz.full.SomeClazz",
		scope : "s",
		args : "path:clazz.full.SomeOtherClazz"
	});

//retrive bean in any scope
	var nameCollector = jadi.getBean("nameCollector");

//"new" up a object
	jadi.newInstance("clazz.full.SomeOtherClazz");

//scoped retrive
	jadi.require(["nameCollector", "someObject"],
	function(bean1, bean2){
		//bean1 is bean nameCollector
		//bean2 is bean someObjecct
	});