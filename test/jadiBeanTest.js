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
		testExternalConsturtor : function(externalObj){
			this.compare(externalObj,"!==",undefined);
			this.compare(externalObj.pass,"===",true);
		},
		testEagerBean : function(eagerBean){
			this.compare(eagerBean.counter(), "===", 2);
		},
		testBeanScope : function(bean1, bean2){
			this.compare(bean1, "!==", bean2);
			this.compare(bean1.equals(bean2), "===", true);
		},
		testParentBean : function(beanFromParent){
			this.compare(beanFromParent.name, "===", "parent");
		},
		setBeanFactory : function(_factory){
			factory = _factory;
		}
	};
}