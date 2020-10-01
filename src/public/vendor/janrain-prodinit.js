/* eslint-disable */

/*
Janrain initializations and settings for JUMP.

For more information about these settings, see the following documents:

    http://developers.janrain.com/documentation/widgets/social-sign-in-widget/social-sign-in-widget-api/settings/
    http://developers.janrain.com/documentation/widgets/user-registration-widget/capture-widget-api/settings/
    http://developers.janrain.com/documentation/widgets/social-sharing-widget/sharing-widget-js-api/settings/
*/

(function() {
    if (typeof window.janrain !== 'object') window.janrain = {};
    window.janrain.settings = {};
    window.janrain.settings.capture = {};

    janrain.settings.packages = ['login', 'capture'];

    // --- Engage Widget -------------------------------------------------------

    janrain.settings.language = 'en-US';
    // janrain.settings.language = 'en-GB';
    janrain.settings.appUrl = 'https://elanco.rpxnow.com/';
    janrain.settings.tokenUrl = 'https://localhost/';
    janrain.settings.tokenAction = 'event';
    janrain.settings.borderColor = '#ffffff';
    janrain.settings.fontFamily = 'Helvetica, Lucida Grande, Verdana, sans-serif';
    janrain.settings.width = 300;
    janrain.settings.actionText = ' ';

    // --- Capture Widget ------------------------------------------------------

    janrain.settings.capture.appId = '8rkzc2cqrhagudvajrzut926wu';
    janrain.settings.capture.captureServer = 'https://elanco.janraincapture.com';
    janrain.settings.capture.redirectUri = 'http://localhost/';
    janrain.settings.capture.clientId = 't42sv4cs6r7pvys5fhw99vcqujkh92jz'; //us
    // janrain.settings.capture.clientId = '8u85guvdmcr4nqskb8vruxjqc95ayc7u'; //uk GB
    janrain.settings.capture.flowVersion = 'HEAD';
    janrain.settings.capture.registerFlow = 'socialRegistration';
    janrain.settings.capture.setProfileCookie = true;
    janrain.settings.capture.keepProfileCookieAfterLogout = true;
    janrain.settings.capture.modalCloseHtml = '<span class="janrain-icon-16 janrain-icon-ex2"></span>';
    janrain.settings.capture.noModalBorderInlineCss = true;
    janrain.settings.capture.responseType = 'token';
    janrain.settings.capture.stylesheets = ['/css/janrain.css'];
    janrain.settings.capture.mobileStylesheets = ['/css/janrain-mobile.css'];
    janrain.settings.capture.hasSettings = false;
    janrain.settings.capture.thinRegistration = true;
    janrain.settings.capture.recaptchaVersion = 2;
	janrain.settings.custom = true;

    // --- Mobile WebView ------------------------------------------------------

    //janrain.settings.capture.redirectFlow = true;
    //janrain.settings.popup = false;
    //janrain.settings.tokenAction = 'url';
    //janrain.settings.capture.registerFlow = 'socialMobileRegistration'

    // --- Federate  -----------------------------------------------------------

    //janrain.settings.capture.federate = true;
    //janrain.settings.capture.federateServer = '';
    //janrain.settings.capture.federateXdReceiver = '';
    //janrain.settings.capture.federateLogoutUri = '';
    //janrain.settings.capture.federateLogoutCalllback = function() {};
    //janrain.settings.capture.federateEnableSafari = false;

    // --- Backplane -----------------------------------------------------------

    //janrain.settings.capture.backplane = true;
    //janrain.settings.capture.backplaneBusName = '';
    //janrain.settings.capture.backplaneVersion = 2;
    //janrain.settings.capture.backplaneBlock = 20;

    // --- Share widget --------------------------------------------------------

    //janrain.settings.share = {};
    //janrain.settings.packages.push('share');
    //janrain.settings.share.message = "";
    //janrain.settings.share.title = "";
    //janrain.settings.share.url = "";
    //janrain.settings.share.description = "";

    // --- Load URLs -----------------------------------------------------------

    var httpsLoadUrl = "https://rpxnow.com/load/elililly-dev";
    var httpLoadUrl = "http://widget-cdn.rpxnow.com/load/elililly-dev";

    var httpsShareLoadUrl = "https://rpxnow.com/js/lib/elililly-dev/share_beta.js'";
    var httpShareLoadUrl = "http://widget-cdn.rpxnow.com/js/lib/elililly-dev/share_beta.js";

    // --- DO NOT EDIT BELOW THIS LINE -----------------------------------------

    function isReady() { janrain.ready = true; };
    if (document.addEventListener) {
        document.addEventListener("DOMContentLoaded", isReady, false);
    } else {
        window.attachEvent('onload', isReady);
    }

    var e = document.createElement('script');
    e.type = 'text/javascript';
    e.id = 'janrainAuthWidget';
    if (document.location.protocol === 'https:') {
        e.src = httpsLoadUrl;
    } else {
        e.src = httpLoadUrl;
    }
    var s = document.getElementsByTagName('script')[0];
    s.parentNode.insertBefore(e, s);

    if (typeof window.janrain.settings.share === 'object') {
        var e = document.createElement('script');
        e.type = 'text/javascript';
        e.id = 'janrainWidgets';
        if (document.location.protocol === 'https:') {
            e.src = httpsShareLoadUrl;
        } else {
            e.src = httpShareLoadUrl;
        }
        var s = document.getElementsByTagName('script')[0];
        s.parentNode.insertBefore(e, s);
    }
})();

/*
Custom regex for client-side password validation. Server side validation is also
enforced via Capture settings.
*/
function janrainCustomPasswordValidation(name, value) {
    return /^.*(?=.{8,})(?=.*[a-zA-Z])(?=.*\d).*$/.test(value);
}

function janrainCustomPostalCodeValidation(name, value) {
    return /^[a-zA-Z0-9 ]{5,8}$|^$/.test(value);
}
function janrainCustomProfessionalNumberValidation(name, value) {
    return true;
  //.test(value);
}

/*
Set areasOfInterest field to comma separated list from checkboxes
*/


function initAreasOfInterest(screenname) {
    var areasOfInterest = document.getElementById('capture_'+screenname+'_professionalData_areasOfInterest');
    var checkboxesDiv = document.getElementById('areasOfInterest_checkboxes');
    var updateAreasOfInterest = function() {
        var areasOfInterest = document.getElementById('capture_'+screenname+'_professionalData_areasOfInterest');
        var checkboxesDiv = document.getElementById('areasOfInterest_checkboxes');
        var val = '';
        if (areasOfInterest && checkboxesDiv) {
            var checkboxes = checkboxesDiv.getElementsByTagName('input');
            for (var i=0; i<checkboxes.length; i++) {
                if (checkboxes[i].checked) {
                    val += checkboxes[i].value + ',';
                }
            }
            areasOfInterest.value = val.replace(/(^,)|(,$)/g, '');
        }
    }
    if (areasOfInterest && checkboxesDiv) {
        var areas = areasOfInterest.value.split(',');
        var checkboxes = checkboxesDiv.getElementsByTagName('input');
        for (var i=0; i<checkboxes.length; i++) {
            if (areas.indexOf(checkboxes[i].value) >= 0) {
                checkboxes[i].checked = true;
            }
            checkboxes[i].onclick = updateAreasOfInterest;
        }
    }
    var label1 = $("<label>").attr('for', "capture_traditionalRegistration_termsAndCondition_termsAndConditions").text('I accept the registration terms and conditions and privacy policy.');
    $('#capture_traditionalRegistration_form_item_termsAndCondition_termsAndConditions').append(label1);
    $( "#capture_traditionalRegistration_form_item_termsAndCondition_termsAndConditions label" ).insertBefore( $( ".capture_termsAndCondition_termsAndConditions.capture_required.capture_input_checkbox" ) );
    
    $("#capture_traditionalRegistration_professionalContactData_professionalNumber").val("123456");

    var label2 = $("<label>").attr('for', "capture_traditionalRegistration_professionalData_workCenterName").text('Clinic Name');
    $('#capture_traditionalRegistration_form_item_professionalData_workCenterName').append(label2);

    // alert($("div#capture_traditionalRegistration_form_item_professionalData_workCenterName label").text("Clinic Name"); 
    // $("label[for = capture_traditionalRegistration_professionalData_workCenterName]").empty(); 
    // $("label[for = capture_traditionalRegistration_professionalData_workCenterName]").html("Clinic Name"); 
     // $("label[for = capture_traditionalRegistration_professionalData_workCenterName]").text("Clinic Name");

/*$("#capture_traditionalRegistration_form_item_professionalData_workCenterName").find("label").empty();
$("#capture_traditionalRegistration_form_item_professionalData_workCenterName").find("label").text("Clinic Name");*/
 
   /* var label2 = $("<label>").attr('for', "capture_editProfile_form_item_termsAndCondition_termsAndConditions").text('I accept the edit profile terms and conditions and privacy policy.');
    $('#capture_editProfile_form_item_termsAndCondition_termsAndConditions').append(label2);
    $( "#capture_editProfile_form_item_termsAndCondition_termsAndConditions label" ).insertBefore( $( ".capture_termsAndCondition_termsAndConditions.capture_required.capture_input_checkbox" ) );*/
}