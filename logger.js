var path = require("path");
var maindir = path.dirname(require.main.filename);

exports.logger = function(){	
	return {
		debug : function(str){
			var err = new Error;
			Error.captureStackTrace(err, arguments.callee);
			var splited = err.stack.split("\n")[1].split(" ");
			splited = splited[splited.length-1];
			splited = splited.replace("(","").replace(")","");
			splited = path.relative(maindir, splited);
			console.log(splited+" : "+str);
		}
	};
}