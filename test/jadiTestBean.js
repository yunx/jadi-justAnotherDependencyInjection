module.exports = function exportClazz(){
	
	var factory = undefined;
	
	return {
		testClazzCreation : function(){
			this.compare(1, "===", 1);			
		},
		testBeanFactoryAware : function(){
			this.compare(factory, "!==", undefined);
		},
		testBeanFactoryAwareBeanRetrival : function(jadiUtils){
			this.compare(factory.getBean("jadiUtils"), "===", jadiUtils);
		},
		setBeanFactory : function(_factory){
			factory = _factory;
		}
	};
}