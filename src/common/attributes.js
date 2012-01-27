exports.Parser = function Parser(){
	
	//id(dfd)
	var attrMatcher = /[\w]+[(][\w\d\s#{}.\[\]_:;]*[)]/g;
	
	var interpolation = /[#][{][^#{}]*[}]/g;
	
	function scoped(point){
		point = point.substring(2,point.length-1);
		return function(scopedContext){
			return scopedContext.get(point);
		};
	}
	
	return {
		parse : function(attrs){
			var attrs = attrs.match(attrMatcher);
			var normalized = {};
			for(var i=0; i<attrs.length; i++){
				var attr = attrs[i];
				var index = attr.indexOf("(");
				normalized[attr.substring(0,index)] = attr.substring(index+1,attr.length-1);
			}
			return normalized;
		},
		prepareInterpolation : function(str){
			var interpolatePoints = str.match(interpolation);
			if(interpolatePoints === null){
				return function(){
					return str;
				};
			}
			var preparedPoints = {};
			for(var i=0; i<interpolatePoints.length; i++){
				var point = interpolatePoints[i];
				if(preparedPoints[point] === undefined){
					preparedPoints[point] = scoped(point);
				}
			}
			var that = this;
			return function(scopedContext){
				var interpolated= str;
				for(var name in preparedPoints){
					try{
						interpolated = interpolated.split(name).join(preparedPoints[name](scopedContext));
					}
					catch(e){
						return interpolated;
					}
				}
				var further = interpolated.match(interpolation);
				if(further !== null){
					interpolated = that.prepareInterpolation(interpolated)(scopedContext);
				}
				return interpolated;
			};
		},
		interpolate : function(attrs,scopedContext){
			attrs = this.parse(attrs);
			for(var name in attrs){
				attrs[name] = this.prepareInterpolation(attrs[name])(scopedContext);
			}
			return attrs;
		}
	}
}