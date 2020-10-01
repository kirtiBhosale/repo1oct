/* eslint-disable */

	$(document).ready(function(){
			var urlVal = window.location.pathname;
        	//split the value
        	var arr = urlVal.split('/');

	     $(".selectCountry").change(function(){
	     	
	     	$(".loader").show();
	     	$(".loader").css("z-index","1");
	     	$(".body-wrapper").css("opacity","0.2");
	     	$(".body-wrapper").css("z-index","-1");
	        var selctedDrpvalue = $( ".selectCountry option:selected").val();
	      $("#hdnSelectedCountry").val(selctedDrpvalue);
	      var ddllanguage = $(".selectLanguage");
	      ddllanguage.empty().append('<option value="">--Select Lanagauge--</option>');
	      if(selctedDrpvalue != "")
	      {
	         $.ajax({
	        url :"/getlangByCountry",
	        method:"GET",
	        data: {'countryCode': selctedDrpvalue},
	        success:function(response)
	        {
	        
	        	var langResponse = response.languageDetails;
	           for (var i = 0; i< langResponse.length; i++) {
	             $(ddllanguage.append($("<option data-appLocal="+langResponse[i].appLocal+"></option>").val(langResponse[i].code).html(langResponse[i].name)));
	           }

				if(arr[3] == 'login' || arr[3] == 'registration')
				{
					$(".selectLanguage").val("");
				}
				else
				{
					var cookie_lang = getCookie('Language');
		           	if(cookie_lang != null && cookie_lang!="")
					{
						$(".selectLanguage").val(cookie_lang);
					}
				}
				

				  $(".loader").hide();
				  $(".body-wrapper").css("opacity","1");
				  $(".body-wrapper").css("z-index","");
	        }
	        });
	      }
	      else{
	      	  $(".loader").hide();
			  $(".body-wrapper").css("opacity","1");
			  $(".body-wrapper").css("z-index","");
	      }
	     
	     });


		if(arr[1] == "" || arr[1] == 'index')
		{
			var cookie_country = getCookie('Country');
			if(cookie_country != null && cookie_country!="")
			{
				$(".selectCountry").val(cookie_country);
				$(".selectCountry").trigger("change");
			}
		}


 		$(".selectLanguage").change(function(){
	     	var selectApplocalVal = $(".selectLanguage option:selected").attr('data-appLocal');
	     	var selectedLanguageVal = $( ".selectLanguage option:selected").val();
	     	if(selectedLanguageVal != "")
	     	{
		     	$.ajax({
		     	cache: false,
		        url :"/localChange",
		        method:"GET",
		        data: {'appLocalVal': selectApplocalVal},
		        success:function(response)
		        {
		        	var selectedCountryName = $("#hdnSelectedCountry").val();
		        	//setCookie('appLocale',selectApplocalVal,10);
		        	setCookie('Country',selectedCountryName,10);
		        	setCookie('Language',selectedLanguageVal,10);

					if(arr[3] == 'login' || arr[3] == 'registration')
					{
			        	var counCode = $( ".selectCountry option:selected").val();
						var langCode =  $(".selectLanguage option:selected").val();
						var loginURL = "/"+counCode+"/"+langCode+ "/"+arr[3];
			        	window.location = loginURL;
					}
		        }
		        });
	     	}
	     });

	 });

	function setCookie(cname, cvalue, exdays) {
    	var d = new Date();
        d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
        var expires = "expires=" + d.toUTCString();
        document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
    }
    function getCookie(cname) {
                var name = cname + "=";
                var decodedCookie = decodeURIComponent(document.cookie);
                var ca = decodedCookie.split(';');
                for (var i = 0; i < ca.length; i++) {
                    var c = ca[i];
                    while (c.charAt(0) == ' ') {
                        c = c.substring(1);
                    }
                    if (c.indexOf(name) == 0) {
                        return c.substring(name.length, c.length);
                    }
                }
                return "";
    }

    function getUrlParameter(name) {
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
    var results = regex.exec(location.search);
    return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
}


