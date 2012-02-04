exports.HomeAction = function(){
	
	return {
		input : function(render){			
			render("success");
		},
		test : "hell yeah!",
		mode : "view",
		name : "hi"
	}
}