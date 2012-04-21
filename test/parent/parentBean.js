exports.ParentBean = function ParentBean(){
	
	return {
		name : "parent"
	};
};

exports.beanDefinitions = [
{
	dispatcher : true,
	id : "parentBean",
	path : "./parentBean@ParentBean",
	scope : "p"	
}                         
];