exports.template = function mainTemplate(tagLib){
	return {
		html :{
			attrs : "",
			head : [
				link("rel(stylesheet) type(text/css) href(/public/style.css)")
			],
			body : [
				If(function(){return false;})
				.Do(div,"id(coolDiv) class(coolClass) style()","hello")
				.ElseIf(function(){return false;})
				.Do(div,"id(coolDiv) class(coolClass) style()","hello")
				.Else(div,"id(coolDiv) class(#{test}) style()","hello")
				,div("class(#{test})", template.insert("something"))
			]			
		}
	};
}

exports.page = function page(tagLib){

	return {
		use : "./public/page@template",
		something : [
		    input("id(someInput) class(someInputClass) value(something)")
		]
	};
}