exports.TagLibs = function TagsLib() {
	function If(lhs) {
		var args = subArray(arguments, 1);
		var decisionFlow = [];
		var executionChoice = [];
		function subArray(array, start) {
			var result = [];
			for ( var i = start; i < array.length; i++) {
				result.push(array[i]);
			}
			return result;
		}
		function execute(context, result) {
			var tobeExecuted = undefined;
			var length = decisionFlow.length;
			var valueResolver = context.valueResolver;
			for ( var i = 0; i < length; i++) {
				var decision = decisionFlow[i];
				if (decision.condition(valueResolver, context.scopes,
						context.utils)) {
					tobeExecuted = i;
					break;
				}
			}
			if (tobeExecuted === undefined) {
				return;
			}
			var choice = executionChoice[tobeExecuted];
			var execution = choice.execution.apply({}, choice.args);
			execution.execute(context, result);
		}
		function Do(content) {
			var args = subArray(arguments, 1);
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
		function ElseIf(lhs) {
			return logicOperator(lhs);
		}

		function Else() {
			return ElseIf("else")["==="]("else");
		}

		function compare(lhs, operator, rhs) {
			decisionFlow.push({
				condition : function(valueResolver, scopes, utils) {
					var left = valueResolver.parseExpression(lhs).evaluate(
							scopes);
					var right = valueResolver.parseExpression(rhs).evaluate(
							scopes);
					return utils.compare(left, operator, right);
				}
			});
			return {
				Do : Do
			};
		}

		var validOperators = [ "==", "===", "<", "<=", ">", ">=", "!=", "!==" ];
		var logicOperator = function(lhs) {
			var logicOperators = {};
			for ( var i = 0; i < validOperators.length; i++) {
				var operator = validOperators[i];
				(function(operator) {
					logicOperators[operator] = function(rhs) {
						return compare(lhs, operator, rhs);
					}
				})(operator);
			}
			return logicOperators;
		}
		return logicOperator(lhs);
	}

	var set = function(tobeset) {

		return {
			to : function(to, scope) {

				return {
					execute : function(context, result) {
						var setVar = context.valueResolver.parseExpression(
								tobeset).evaluate(context.scopes);
						context.scopes.set(setVar, to, scope);
					}
				};
			}
		};
	}

	function getExecutionTemplate(tagName, attrs, children) {

		return {
			retrieveAttrs : function(attrs, context) {
				throw new Error("method not implemented!");
			},
			execute : function(context, result) {
				var combined = this.retrieveAttrs(attrs, context);
				result.push("<" + tagName + " " + combined + ">");
				this.handleChilren(children, context);
				result.push("</" + tagName + ">");
			},
			handleChilren : function(children, context, result) {
				if (children !== undefined) {
					if (typeof children === "object") {
						context.viewHandler(children);
					} else if (typeof children === "string") {
						result.push(children);
					}
				}
			}
		};
	}

	var textField = function(attrs, children) {

		function retrieveAttrs(attrs, context) {
			var parsed = context.valueResolver.parseAttrAndEval(attrs);
			var attributes = parsed.getAttributes();
			attributes['value'] = context.scopes.get(attributes['name']);
			attributes['type'] = "text";
			return parsed.toString();
		}

		var textFieldTag = getExecutionTemplate("input", attrs, children);
		textFieldTag.retrieveAttrs = retrieveAttrs;
		return textFieldTag;
	}

	var loop = function() {

	}

	var generic = function(tagName) {
		return function(attrs, children) {
			return {
				execute : function(context, result) {
					var parsed = context.valueResolver.parseAttrAndEval(attrs,
							context.scopes);
					result.push("<" + tagName + " " + parsed.toString() + ">");
					if (children !== undefined) {
						if (typeof children === "object") {
							context.viewHandler(children);
						} else if (typeof children === "string") {
							result.push(children);
						}
					}
					result.push("</" + tagName + ">");
				}
			};
		};
	}

	var tagLib = function() {
		var standardHtmlTags = [ "html", "head", "body", "div", "h1", "h2",
				"p", "input", "link", 'form' ];

		var jadiTags = {
			If : If,
			set : set,
			textField : textField,
			template : {
				insert : function(definition) {
					return {
						execute : function(context, result) {
							context.viewHandler(definition);
						}
					}
				}
			}
		};
		for ( var i = 0; i < standardHtmlTags.length; i++) {
			var standardTag = standardHtmlTags[i];
			jadiTags[standardTag] = generic(standardTag);
		}
		return jadiTags;
	};
	return tagLib();
}

exports.Evaluator = function(utils, tagLibs, valueResolver) {
	var handleArray = function(array, context, result) {
		for ( var i = 0; i < array.length; i++) {
			var val = array[i];
			if (utils.isFunction(val)) {
				handleFunction();
			} else if (utils.isObject(val)) {
				handleObj(val, context, result);
			}
		}
	}
	var handleObj = function(obj, context, result) {
		if (obj.execute !== undefined && utils.isFunction(obj.execute)) {
			// hacking : )
			context.utils = utils;
			obj.execute(context, result);
			return;
		}
		for ( var name in obj) {
			var tag = obj[name];
			if (utils.isArray(tag)) {
				result.push("<" + name + ">");
				handleArray(tag, context, result);
				result.push("</" + name + ">");
			} else if (utils.isObject(tag)) {
				result.push("<" + name + ">");
				handleObj(tag, context, result);
				result.push("</" + name + ">");
			}
		}
	}

	var handleView = function(view, context, result) {
		if (utils.isArray(view)) {
			handleArray(view, context, result);
		} else if (utils.isObject(view)) {
			handleObj(view, context, result);
		} else {
			throw new Error("no view handler for " + view);
		}
	}

	return {
		evaluate : function(view, context) {
			context.valueResolver = valueResolver;
			view = view(tagLibs);
			var result = {
				push : function(str) {
					context.response.write(str);
				}
			}
			context.viewHandler = function(subView) {
				if (utils.isString(subView)) {
					var definition = view[subView];
					subView = definition;
				}
				handleView(subView, context, result);
			}

			if (view.use !== undefined) {
				var template = context.loadTemplate(view.use);
				if (template === undefined) {
					throw new Error("template " + view.use + " is not defined");
				}
				template = template(tagLibs);
				handleView(template, context, result);
			} else {
				handleView(view, context, result);
			}
		}
	};
}