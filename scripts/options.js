function getCookie(cookieName) { 
	return window.localStorage.getItem(cookieName);
}
	
function setCookie(cookieName, cookieValue) { 
	window.localStorage.setItem(cookieName, cookieValue);
}

function parseCookieInfo() { 
	// check if the cookie says to disable it since it is enabled by default
	if (getCookie("useAlternateLoginMethod") == "USE_ALTERNATE_LOGIN_METHOD.DISABLED") { 
		document.getElementById('useAlternateLoginMethod').checked = false;
	}
	
	if (getCookie("useAlternateLogoutMethod") == "USE_ALTERNATE_LOGOUT_METHOD.DISABLED") {
		document.getElementById('useAlternateLogoutMethod').checked = false;
	}
	
	if (getCookie("emulateHumanSearchingBehavior") == "EMULATE_HUMAN_SEARCH_BEHAVIOR.DISABLED") { 
		document.getElementById('emulateHumanSearchingBehavior').checked = false;
	}
}
	
function onSettingsChange() { 
	setCookie("useAlternateLoginMethod", (document.getElementById('useAlternateLoginMethod').checked ? "USE_ALTERNATE_LOGIN_METHOD.ENABLED" : "USE_ALTERNATE_LOGIN_METHOD.DISABLED"));
	setCookie("useAlternateLogoutMethod", (document.getElementById('useAlternateLogoutMethod').checked ? "USE_ALTERNATE_LOGOUT_METHOD.ENABLED" : "USE_ALTERNATE_LOGOUT_METHOD.DISABLED"));
	setCookie("emulateHumanSearchingBehavior", (document.getElementById('emulateHumanSearchingBehavior').checked ? "EMULATE_HUMAN_SEARCH_BEHAVIOR.ENABLED" : "EMULATE_HUMAN_SEARCH_BEHAVIOR.DISABLED"));
}

function checkForLicense(callback) { 
	var updateLicenseStatus = function (response) {
		var purchasedItems = response.response.details;
		var isLicensed = false;
		
		for (var i = 0; i < purchasedItems.length; i++) { 
			if (purchasedItems[i].sku == "bph_pro" && purchasedItems[i].state == "ACTIVE") { 
				isLicensed = true;
				break;
			}
		}
		
		if (isLicensed) { // licensed via the Chrome web store
			setCookie("isLicensed", isLicensed);
			updateLicenseDisplay();
		} else { // not licensed via the Chrome web store
			// check if the user is licensed via their key
			checkLicenseKey(function (licensedViaKey) {
				if (licensedViaKey) { 
					updateLicenseDisplay(licensedViaKey);
				} else {	
					// as a final check, check if the user is licensed via their IP address
					var checkLicenseViaIP = function () {
						$.ajax({
							url: 'http://brian-kieffer.com/iplicensecheck.php',
							type: 'GET',
							cache: false,
							dataType: 'text',
							success: function (licensedViaIP) { 
								isLicensed = (licensedViaIP === "true");
								
								setCookie("isLicensed", isLicensed);
								updateLicenseDisplay(licensedViaKey);
							},
							error: function (data) { 
								checkLicenseViaIP();
							}
						});
					}
					
					checkLicenseViaIP();
				}
			});
		}
	}
	
	google.payments.inapp.getPurchases({
		'parameters': {'env': 'prod'},
		'success': updateLicenseStatus,
		'failure': getPurchasesFailed
	});
}

function checkLicenseKey(callback) { 
	var isLicensed = false;
	
	var checkKey = function () {
		$.ajax({
			url: 'http://brian-kieffer.com/keylicensecheck.php',
			type: 'GET',
			cache: false,
			dataType: 'text',
			data: {
				'username': getCookie("username"),
				'key': getCookie("key")
			},
			success: function (licensedViaKey) { 
				isLicensed = (licensedViaKey.indexOf("true") != -1);

				setCookie("isLicensed", isLicensed);
				callback(isLicensed);
			},
			error: function () { 
				checkKey();
			}
		});
	}
	
	checkKey();
}
	

function updateLicenseDisplay(licensedViaKey, didCheckKey, getPurchasesFailed) { 
	var statusText = document.getElementById('statusText');
	
	if (getCookie("isLicensed") === "true") { 
		statusText.innerHTML = "<b>Your copy of Bing Pong Helper is fully licensed. Enjoy, and thanks for your support!</b>";
		
		if (licensedViaKey) { 
			statusText.innerHTML += "<br><br>For future reference, your license username is <b>" + getCookie("username") + "</b> and your key is <b>" + getCookie("key") + "</b>.";
		}
		
		enableProFeatures();
	} else {
		statusText.innerHTML = "<b>Your copy of Bing Pong Helper is not licensed. Please support my project by purchasing a license.</b><br><br>";
		statusText.innerHTML += "<table><tr><td><span id=\"gwHeader\"></span></td><td><span id=\"altHeader\"></span></td></tr><tr><td><span id=\"gwInfo\"></span></td><td><span id=\"altInfo\"></span></td></tr></table>";
		document.getElementById('gwHeader').innerHTML = "<center>Google Wallet:</center>";
		document.getElementById('altHeader').innerHTML = "<center>Anything else:</center>";
		document.getElementById('gwInfo').innerHTML = "<br><center><button id=\"buyLicense\">Purchase a Bing Pong Helper License ($9.99)</button></center>";
		document.getElementById('altInfo').innerHTML = "<center>Follow <a href=\"https://www.reddit.com/r/bingpong/comments/3dse32/cannot_buy_a_bing_pong_helper_license_through/\" target=\"_blank\">these instructions</a> to purchase a license key and enter your information below.</center>";
		document.getElementById('altInfo').innerHTML += "<br><center>Username: <input id=\"username\" size=25></center>";
		document.getElementById('altInfo').innerHTML += "<br><center>License key (18 digits): <input id=\"key\" size=25></center>";
		document.getElementById('altInfo').innerHTML += "<br><center><button id=\"checkKey\">Check license information</button></center>";
		document.getElementById('altInfo').innerHTML += "<br><center><span id=\"keyCheckStatus\">&nbsp;</span></center>";
		
		if (didCheckKey && !licensedViaKey) { 
			document.getElementById('keyCheckStatus').innerHTML = "<b>Invalid username/key combination.</b>";
		}
		
		/*
		statusText.innerHTML += "<br><br><button id=\"buyLicense\">Purchase a Bing Pong Helper license ($9.99)</button>";
		statusText.innerHTML += "<br><br>Cannot pay via Google Wallet? Follow <a href=\"https://www.reddit.com/r/bingpong/comments/3dse32/cannot_buy_a_bing_pong_helper_license_through/\" target=\"_blank\">these instructions</a> and enter your information below.";
		statusText.innerHTML += "<br><br>Username: <input id=\"username\" size=15>";
		statusText.innerHTML += "<br>License key (12 digits): <input id=\"key\" size=15>";
		statusText.innerHTML += "<br><button id=\"checkKey\">Check license information</button>";
		*/
		document.getElementById('buyLicense').addEventListener('click', onBuyButtonClick);
		document.getElementById('checkKey').addEventListener('click', function () {
			setCookie("username", document.getElementById('username').value);
			setCookie("key", document.getElementById('key').value);
			
			checkLicenseKey(function (licensedViaKey) { 
				updateLicenseDisplay(licensedViaKey, true);
			});
		});
		
		disableProFeatures();
	}
}

function getPurchasesFailed() { // Google's license check failed, but the user's key or IP may give them a license	
	checkLicenseKey(function (licensedViaKey) {
		if (licensedViaKey) { 
			updateLicenseDisplay(licensedViaKey);
		} else {	
			// as a final check, check if the user is licensed via their IP address
			var checkLicenseViaIP = function () {
				$.ajax({
					url: 'http://brian-kieffer.com/iplicensecheck.php',
					type: 'GET',
					cache: false,
					dataType: 'text',
					success: function (licensedViaIP) { 
						isLicensed = (licensedViaIP === "true");
						
						setCookie("isLicensed", isLicensed);
						
						if (isLicensed) { 
							updateLicenseDisplay(licensedViaKey);
						} else {
							statusText.innerHTML = "<b>Your copy of Bing Pong Helper is not licensed. Please support my project by purchasing a license.</b><br><br>";
							statusText.innerHTML += "<table><tr><td><span id=\"gwHeader\"></span></td><td><span id=\"altHeader\"></span></td></tr><tr><td><span id=\"gwInfo\"></span></td><td><span id=\"altInfo\"></span></td></tr></table>";
							document.getElementById('gwHeader').innerHTML = "<center>Google Wallet:</center>";
							document.getElementById('altHeader').innerHTML = "<center>Anything else:</center>";
							document.getElementById('gwInfo').innerHTML = "<center><b>There was an error verifying your license.<br>Please verify that Chrome is logged into your Google account and try again.</b></center>";
							document.getElementById('gwInfo').innerHTML += "<center><b>Click the button below to make another license check attempt.</b></center>";
							document.getElementById('gwInfo').innerHTML += "<br><br><center><br><br><button id=\"recheck\">Reattempt Bing Pong Helper license check</button></center>";
							document.getElementById('altInfo').innerHTML = "<center>Follow <a href=\"https://www.reddit.com/r/bingpong/comments/3dse32/cannot_buy_a_bing_pong_helper_license_through/\" target=\"_blank\">these instructions</a> to purchase a license key and enter your information below.</center>";
							document.getElementById('altInfo').innerHTML += "<br><center>Username: <input id=\"username\" size=15></center>";
							document.getElementById('altInfo').innerHTML += "<br><center>License key (18 digits): <input id=\"key\" size=15></center>";
							document.getElementById('altInfo').innerHTML += "<br><center><button id=\"checkKey\">Check license information</button></center>";
							document.getElementById('altInfo').innerHTML += "<br><center><span id=\"keyCheckStatus\">&nbsp;</span></center>";
							
							document.getElementById('recheck').addEventListener('click', checkForLicense);
							document.getElementById('checkKey').addEventListener('click', function () {
								setCookie("username", document.getElementById('username').value);
								setCookie("key", document.getElementById('key').value);
								
								checkLicenseKey(function (licensedViaKey) { 
									updateLicenseDisplay(licensedViaKey, true);
								});
							});
							
							disableProFeatures();
						}
					},
					error: function (data) { 
						checkLicenseViaIP();
					}
				});
			}
			
			checkLicenseViaIP();
		}
	});
}
	

function onBuyButtonClick() { 
	google.payments.inapp.buy({
		'parameters': {'env': 'prod'},
		'sku': 'bph_pro',
		'success': onPurchase,
		'failure': onPurchaseFail
	});
}

function onPurchase() { 
	checkForLicense();
}

function onPurchaseFail() { 
	checkForLicense();
}

function disableProFeatures() {
	// I want people to use the alternate sign-in method by default, and they can only use the legacy methods with a license
	// document.getElementById('useAlternateLoginMethod').checked = true;
	// document.getElementById('useAlternateLoginMethod').disabled = true;
	// document.getElementById('useAlternateLogoutMethod').checked = true;
	// document.getElementById('useAlternateLogoutMethod').disabled = true;
	// document.getElementById('emulateHumanSearchingBehavior').checked = false; --- for now, emulating human behavior does not need a license
	// document.getElementById('emulateHumanSearchingBehavior').disabled = true;
	
	// setCookie("useAlternateLoginMethod", "USE_ALTERNATE_LOGIN_METHOD.ENABLED");
	// setCookie("useAlternateLogoutMethod", "USE_ALTERNATE_LOGOUT_METHOD.ENABLED");
	// setCookie("emulateHumanSearchingBehavior", "EMULATE_HUMAN_SEARCHING_BEHAVIOR.DISABLED");
}

function enableProFeatures() {
	// document.getElementById('emulateHumanSearchingBehavior').disabled = false; --- this is already enabled
	// document.getElementById('useAlternateLoginMethod').disabled = false;
	// document.getElementById('useAlternateLogoutMethod').disabled = false;
}

document.getElementById('useAlternateLoginMethod').addEventListener('click', onSettingsChange);
document.getElementById('useAlternateLogoutMethod').addEventListener('click', onSettingsChange);
document.getElementById('emulateHumanSearchingBehavior').addEventListener('click', onSettingsChange);
document.getElementById('version').innerHTML = chrome.app.getDetails().version;

parseCookieInfo();
checkForLicense();