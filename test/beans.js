var eagerCounter = 0;
exports.Eager = function(){
	eagerCounter++;
	
	return {
		counter : function(){
			return eagerCounter;
		}		
	};
}

var equality = {};
exports.Equality = function(){
	var name = equality;
	return {
		equals : function(other){
			return this.getEquality() === other.getEquality();
		},
		getEquality : function(){
			return name;
		}
	};
}