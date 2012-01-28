exports.template = function mainTemplate(tagLib){
	return {
		html :{
			attrs : "",
			head : [
				link("rel(stylesheet) type(text/css) href(/public/style.css)")
			],
			body : [
				If("#{mode}")['===']("tests")
					.Do(div,"id(coolDiv) class(coolClass) style()","hello2")
				.ElseIf(function(){return false;})
					.Do(div,"id(coolDiv) class(coolClass) style()","hello")
				.Else()
					.Do(div,"id(coolDiv) class(#{test}) style()","hello")
				,div("class(#{test})", template.insert("something"))
				,set("hi").to("thing")
				,input("type(button) value(#{thing})")
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