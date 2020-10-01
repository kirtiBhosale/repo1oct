

$("a[class='icon']").on("click", function () {
	if ($(".hide").length == 0) {
		$(".menu").addClass("hide")
		$(".data p").css("margin-top", "-5%")
		// $("footer").css("position", "absolute")
		$(".content .data").addClass("change")
	}
	else {
		$(".menu").removeClass("hide")
		$(".content .data").removeClass("change")
	}
})

$(window).bind("load", function () {
	$(".content .menu").css("height", $("html").height() - $("footer").height())
})
$("ul[class='item'] li a").each(function(item){
	if($(".data p").text()==this.text){
				$(this).parent().css({"padding":"25px 0 ","background":"rgba(255,255,255,.2)"})
				
	}
	})