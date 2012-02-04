exports.template = function mainTemplate(tagLib){
	return {
		html :{
			attrs : "",
			head : [
				link("rel(stylesheet) type(text/css) href(/public/style.css)")
			],
			body : [     
			    form("method(post)", [
						If("#{mode}")['===']("tests")
							.Do(div,"id(coolDiv) class(coolClass ) style()","hello 1")
						.ElseIf("soething")["==="]("soething1")
							.Do(div,"id(coolDiv) class(coolClass) style()","hello 2")
						.Else()
							.Do(div,"id(coolDiv) class(#{test}) style()","hello 3")
						,template.insert("something")
						,set("hi").to("thing")
						,input("type(submit) value(Submit)")
					])
			]
		}
	};
}

exports.page = function page(tagLib){
	return {
		use : "./public/page@template",
		something : [
		    textField("id(someInput) class(someInputClass) name(name)")
		]
	};
}