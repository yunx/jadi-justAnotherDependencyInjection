exports.TagLibs = function TagsLib(){
	function If(condition){
		var args = subArray(arguments,1);
		var decisionFlow = [{
			condition : condition,
			args : args || []
		}]	
		var executionChoice = [];
		function subArray(array,start){
			var result = [];
			for(var i=start;i<array.length;i++){
				result.push(array[i]);
			}
			return result;
		}
		function execute(context,result){
			var tobeExecuted = undefined;
			var length = decisionFlow.length;
			for(var i=0; i<length; i++){
				var decision = decisionFlow[i];
				if(decision.condition.apply({},decision.args)){
					tobeExecuted = i;
					break;
				}
			}
			var choice = executionChoice[tobeExecuted];
			var execution = choice.execution.apply({},choice.args);
			execution.execute(context,result);
		}	
		function Do(content){
			var args = subArray(arguments,1);
			executionChoice.push({
				execution : content,
				args : args
			});
			return {
				execute : execute,
				ElseIf : ElseIf,
				Else : Else
			};
		}	
		function ElseIf(elseIfcondition){
			var args = subArray(arguments,1);
			decisionFlow.push({
				condition : elseIfcondition,
				args : args
			});
			return {
				Do : Do
			};
		}	
		function Else(content, args){
			var args = subArray(arguments,1);
			decisionFlow.push({
				condition : function(){return true},
				args : []
			});
			executionChoice.push({
				execution : content,
				args : args
			});
			return {
				execute : execute
			};
		}
		return {
			Do : Do
		};
	}
	
	var generic = function(tagName){
		return function(attrs, children){
			return {
				execute : function(context,result){
					var refinedAttrs = context.attributeParser.interpolate(attrs,context.scopes);
					var combined = "";
					for(var name in refinedAttrs){
						combined += name+'="'+refinedAttrs[name]+'"'
					}
					result.push("<"+tagName+" "+combined+">");
					if(children !== undefined){
						if(typeof children === "object"){
							context.viewHandler(children);
						}
					}
					result.push("</"+tagName+">");
				}
			};
		};
	}
	
	var tagLib = function(){
		var standardHtmlTags = ["html","head","body","div","h1","h2","p","input","link"];
		
		var jadiTags = {
			If : If,
			template : {
				insert : function(definition){
					return {
						execute : function(context,result){
							context.viewHandler(definition);
						}
					}
				}			
			}
		};	
		for(var i=0; i<standardHtmlTags.length; i++){
			var standardTag = standardHtmlTags[i];
			jadiTags[standardTag] = generic(standardTag);
		}
		return jadiTags;
	};	
	return tagLib();
}

exports.Evaluator = function(utils,tagLibs,attributeParser){	
	var handleArray = function(array, context, result){
		for(var i=0; i<array.length; i++){
			var val = array[i];
			if(utils.isFunction(val)){
				handleFunction();
			}
			else if(utils.isObject(val)){
				handleObj(val, context,result);
			}
		}		
	}
	var handleObj = function(obj, context, result){
		if(obj.execute !== undefined && utils.isFunction(obj.execute)){
			obj.execute(context,result);
			return;
		}
		for(var name in obj){
			var tag = obj[name];
			if(utils.isArray(tag)){
				result.push("<"+name+">");
				handleArray(tag,context, result);
				result.push("</"+name+">");
			}
			else if(utils.isObject(tag)){
				result.push("<"+name+">");
				handleObj(tag,context, result);
				result.push("</"+name+">");
			}
		}
	}
	
	var handleView = function(view, context, result){
		if(utils.isArray(view)){
			handleArray(view,context,result);
		}
		else if(utils.isObject(view)){
			handleObj(view,context,result);
		}
		else{
			throw new Error("no view handler for " +  view);
		}				
	}

	return {
		evaluate : function(view, context){
			context.attributeParser = attributeParser;
			view = view(tagLibs);
			var result = {
				push : function(str){
					context.response.write(str);
				}
			}
			context.viewHandler = function(subView){
				if(utils.isString(subView)){
					var definition = view[subView];
					subView = definition;
				}
				handleView(subView, context, result);
			}
			
			if(view.use !== undefined){
				var template = context.loadTemplate(view.use);
				if(template === undefined){
					throw new Error("template " + view.use + " is not defined");
				}
				template = template(tagLibs);
				handleView(template,context,result);
			}
			else{
				handleView(view,context,result);
			}
		}
	};
}