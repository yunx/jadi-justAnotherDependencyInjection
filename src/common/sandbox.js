var vm = require("vm");
var path = require("path");
var Module = require("module");

function ModuleBuilder(){	
	function buildRequire(bindingModule){
		function require(path) {
			return bindingModule.require(path);
		}
		require.resolve = function(request) {
			return Module._resolveFilename(request, self)[1];
		};		
		require.main = process.mainModule;

		require.extensions = Module._extensions;
		require.cache = Module._cache;
		return require;
	}
	
	return {
		buildParamets : function(filePath, parentModule){
			var bindingModule = new Module(filePath,parentModule);
			var exports = {};
			bindingModule.exports = exports;
			bindingModule.filename = filePath;	
			return {
				exports : exports,
				require : buildRequire(bindingModule), 
				module : bindingModule,
				__filename : filePath,
				__dirname : path.dirname(filePath)
			};
		},
		wrapCode : function(filePath){
			var content = require("fs").readFileSync(filePath,"utf8");
			return Module.wrap(content);
		}
	};
}

exports.ModuleBuilder = ModuleBuilder;

exports.GlobalBinder = function(utils){
	function createNewContext(context){
		for(var name in global){
			context[name] = global[name];
		}
		return vm.createContext(context);
	}
	
	var moduleBuilder = ModuleBuilder();
	
	return {
		loadView : function(viewPath, context){
			//refactor, due to similarity with utils.resolvePath
			moduleClazz = viewPath.split("@");
			if(moduleClazz.length === 2){
				var abPath = path.resolve(moduleClazz[0]);
				var hasJs = abPath.indexOf(".js") !== -1;
				if(!hasJs){
					abPath = abPath+".js";
				}
				if(path.existsSync(abPath)){
					var clazz = moduleClazz[1];
					return this.load(abPath,context)[clazz];
				}
				else{
					throw new Error(moduleClazz[0] + " not found");
				}
			}
		},
		load : function(file,context){
			context = context || {};
			var fullPath = path.resolve(file);
			var context = createNewContext(context);
			var parameters = moduleBuilder.buildParamets(fullPath,module);			
			var compiled = vm.runInNewContext(moduleBuilder.wrapCode(fullPath),context,fullPath);
			var params = [];
			for(var name in parameters){
				params.push(parameters[name]);
			}			
			compiled.apply(parameters.exports,params);
			return parameters.exports;
		}
	};
}