var path = require("path");
var maindir = path.dirname(require.main.filename);

exports.makeAvailable = function(scope, config) {
	scope = scope || global;
	config = config || {};
	config.fullPath = config.fullPath === undefined ? false : config.fullPath;

	var logger = {
		debug : function(str) {
			var err = new Error;
			Error.captureStackTrace(err, arguments.callee);
			var splited = err.stack.split("\n")[1].split(" ");
			splited = splited[splited.length - 1];
			splited = splited.replace("(", "").replace(")", "");
			splited = path.relative(maindir, splited);
			if (!config.fullPath) {
				splited = splited.substring(splited.lastIndexOf("/") + 1);
			}
			console.log(splited + " : " + str);
		}
	};
	if(scope.logger === undefined){
		scope.logger = logger;
	}	
}