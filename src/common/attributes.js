"use strict";
exports.AttributeParser = function Parser() {

	function State(index) {
		return {
			num : index,
			process : function(node, token) {
				return node;
			}
		};
	}

	function charactor(index) {
		return {
			num : index,
			process : function(node, token) {
				node.add(token);
				return node;
			}
		};
	}

	function open(index) {
		return {
			num : index,
			process : function(node, token) {
				return node.createExpression();
			}
		};
	}

	function close(index) {
		return {
			num : index,
			process : function(node, token) {
				return node.getParent();
			}
		};
	}

	var stateSize = 0, BEGIN = State(stateSize++), OPEN = open(stateSize++), C_OPEN = open(stateSize++), CHAR = charactor(stateSize++), CHAR_END = charactor(stateSize++), C_CLOSE = close(stateSize++), CLOSE = close(stateSize++), SKIP = State(stateSize++), DONE = State(stateSize++);

	function lexser(token, peek) {
		switch (token) {
		case '#':
			if (peek(1) === '{') {
				return C_OPEN;
			}
			return OPEN;
		case '}':
			return C_CLOSE;
		case ' ':
			return CLOSE;
		case '{':
			return SKIP;
		default:
			var next = peek(1);
			if (next === '}' || next === ' ' || next === '#') {
				return CHAR_END;
			}
			return CHAR;
		}
	}

	// #fdf #{dfd}dfd
	// 
	// BEGIN -> OPEN, BEGIN, CLOSE, BEGIN
	// BEGIN -> C_OPEN, SKIP, BEGIN, C_CLOSE, BEGIN
	// BEGIN -> CHAR, CHAR_END, BEGIN
	// BEGIN -> CLOSE
	// BEGIN -> C_CLOSE
	// BEGIN -> DONE
	// CHAR_END -> CHAR, CHAR_END

	function Rules() {
		var rules = new Array(stateSize);
		for ( var j = 0; j < stateSize; j++) {
			rules[j] = new Array(stateSize);
		}
		rules[BEGIN.num][OPEN.num] = 0;
		rules[BEGIN.num][C_OPEN.num] = 1;
		rules[BEGIN.num][CHAR.num] = 2;
		rules[CHAR_END.num][CHAR.num] = 3;
		rules[BEGIN.num][CLOSE.num] = 4;
		rules[BEGIN.num][C_CLOSE.num] = 5;
		rules[BEGIN.num][CHAR_END.num] = 6;

		return function(topStack, lexToken) {
			return rules[topStack.num][lexToken.num];
		};
	}

	var getRule = Rules();

	function rewriteStack(topStack, stack, lexToken) {
		var rule = getRule(topStack, lexToken);
		switch (rule) {
		case 0:
			stack.push(BEGIN);
			stack.push(CLOSE);
			stack.push(BEGIN);
			stack.push(OPEN);
			break;
		case 1:
			stack.push(BEGIN);
			stack.push(C_CLOSE);
			stack.push(BEGIN);
			stack.push(SKIP);
			stack.push(C_OPEN);
			break;
		case 2:
			stack.push(BEGIN);
			stack.push(CHAR_END);
			stack.push(CHAR);
			break;
		case 3:
			stack.push(CHAR_END);
			stack.push(CHAR);
			break;
		case 4:
			break;
		case 5:
			break;
		case 6:
			stack.push(CHAR_END);
			break;
		default:
			throw new Error(topStack);
		}
		;
	}

	function empty(num) {
		var blanks = "          ";
		var sum = blanks;
		for ( var i = 0; i < (num / 10); i++) {
			sum += blanks;
		}
		return sum.substring(0, num);
	}

	function Node(parent, expression) {
		var children = [];
		return {
			evaluate : function(scope) {
				if (children.length === 0) {
					return "";
				}
				var result = "";
				for ( var i = 0; i < children.length; i++) {
					var child = children[i];
					if (typeof child === 'string') {
						result += child;
					} else {
						result += child.evaluate(scope);
					}
				}
				return expression ? scope.get(result) : result;
			},
			add : function(token) {
				children.push(token);
			},
			createExpression : function() {
				var child = Node(this, true);
				children.push(child);
				return child;
			},
			getParent : function() {
				return parent;
			}
		};
	}

	return {
		parseExpression : function(str) {
			// please read backward
			var stack = [ DONE, BEGIN ];
			var index = 0;
			var peek = function(size) {
				return str.substring(index + 1, index + size + 1);
			}
			var node = Node();
			for (; index < str.length; index++) {
				var token = str[index];
				var topStack = stack.pop();
				var lexical = lexser(token, peek);
				if (topStack === lexical) {
					node = lexical.process(node, token);
				} else {
					try {
						rewriteStack(topStack, stack, lexical);
						index--;
					} catch (e) {
						console.log(str + " at index: " + (index + 1));
						console.log(empty(index) + "^");
						throw e;
					}
				}
			}
			if (stack[0] !== DONE && stack[1] !== BEGIN) {
				console.log(str + " at index: " + (index + 1));
				console.log(empty(index) + "^");
			}
			return node;
		},
		parseAttributes : function(attrs) {
			var attrMatcher = /[\w]+[(][^()]*[)]/g;
			var attrs = attrs.match(attrMatcher);
			var normalized = {};
			for ( var i = 0; i < attrs.length; i++) {
				var attr = attrs[i];
				var index = attr.indexOf("(");
				normalized[attr.substring(0, index)] = attr.substring(
						index + 1, attr.length - 1);
			}
			return normalized;
		},
		parseAttrAndEval : function(attrs, scope) {
			var attributes = this.parseAttributes(attrs);
			for ( var name in attributes) {
				var attr = attributes[name];
				attributes[name] = this.parseExpression(attr).evaluate(scope);
			}
			return {
				toString : function() {
					var combined = "";
					for ( var name in attributes) {
						var attrVal = attributes[name];
						if (attrVal !== undefined && attrVal.length !== 0) {
							combined += name + '="' + attrVal + '"';
						}
					}
					return combined;
				},
				getAttributes : function() {
					return attributes;
				}
			};
		}
	};
}