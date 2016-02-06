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
	
	if (getCookie("autoRunOption") == "AUTO_RUN.ENABLED") { 
		document.getElementById('autoRunOption').checked = true;
		document.getElementById('autoRunTime').disabled = false;
		document.getElementById('autoRunTime').selectedIndex = getCookie("autoRunTime");
	}
}
	
function onSettingsChange() { 
	setCookie("useAlternateLoginMethod", (document.getElementById('useAlternateLoginMethod').checked ? "USE_ALTERNATE_LOGIN_METHOD.ENABLED" : "USE_ALTERNATE_LOGIN_METHOD.DISABLED"));
	setCookie("useAlternateLogoutMethod", (document.getElementById('useAlternateLogoutMethod').checked ? "USE_ALTERNATE_LOGOUT_METHOD.ENABLED" : "USE_ALTERNATE_LOGOUT_METHOD.DISABLED"));
	setCookie("emulateHumanSearchingBehavior", (document.getElementById('emulateHumanSearchingBehavior').checked ? "EMULATE_HUMAN_SEARCH_BEHAVIOR.ENABLED" : "EMULATE_HUMAN_SEARCH_BEHAVIOR.DISABLED"));
	setCookie("autoRunOption", (document.getElementById('autoRunOption').checked ? "AUTO_RUN.ENABLED" : "AUTO_RUN.DISABLED"));
	setCookie("autoRunTime", document.getElementById('autoRunTime').selectedIndex);
	
	if (document.getElementById('autoRunOption').checked) {
		document.getElementById('autoRunTime').disabled = false;
	}
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
			updateLicenseDisplay(false, false);
		} else { // not licensed via the Chrome web store
			// check if the user is licensed via their key
			checkLicenseKey(function (licensedViaKey) {
				if (licensedViaKey) { 
					updateLicenseDisplay(true, false);
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
								updateLicenseDisplay(false, isLicensed);
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
	

function updateLicenseDisplay(licensedViaKey, licensedViaIP) { 
	var statusText = document.getElementById('licenseStatus');
	var paymentOptions = document.getElementById('paymentOptions');
	
	paymentOptions.innerHTML = "";
	
	if (getCookie("isLicensed") === "true") { 
		statusText.innerHTML = "Licensed";
		statusText.style.color = "#00FF00";
		
		if (licensedViaKey) { 
			statusText.innerHTML += " (username: " + getCookie("username") + ", key: " + getCookie("key") + ")";
		}
		
		if (licensedViaIP) { 
			statusText.innerHTML += " (via IP)";
		}
		
		enableProFeatures();
	} else {
		statusText.innerHTML = "Unlicensed";
		statusText.style.color = "#FF0000";
		
		paymentOptions.innerHTML = "<button id=\"buyLicense\">Purchase license via Google Wallet ($9.99)</button>";
		paymentOptions.innerHTML += "  <br><button id=\"alternatePaymentMethod\">Use alternate payment method</button>";
		
		document.getElementById('buyLicense').addEventListener('click', onBuyButtonClick);
		document.getElementById('alternatePaymentMethod').addEventListener('click', function () {
			paymentOptions.innerHTML = "To pay with an alternate method, send an e-mail to <a href=\"mailto:brian@bing-pong.com\">brian@bing-pong.com</a> with your preferred choice of username and payment.";
			paymentOptions.innerHTML += " Enter in your username and key below.";
			paymentOptions.innerHTML += "<br><br>Username: <input id=\"username\" size=25>";
			paymentOptions.innerHTML += "<br>License key (18 digits): <input id=\"key\" size=25>";
			paymentOptions.innerHTML += "<br><br><center><button id=\"checkKey\">Check license information</button></center>";
			paymentOptions.innerHTML += "<br><center><span id=\"keyCheckStatus\">&nbsp;</span></center>";
			
			document.getElementById('checkKey').addEventListener('click', function () { 
				setCookie("username", document.getElementById('username').value);
				setCookie("key", document.getElementById('key').value);
			
				checkLicenseKey(function (licensedViaKey) { 
					if (licensedViaKey) { 
						updateLicenseDisplay(licensedViaKey, false);
					} else {
						document.getElementById('keyCheckStatus').innerHTML = "<b>Invalid username/key combination.</b>";
					}
				});
			});
		
			disableProFeatures();
		});
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
							var statusText = document.getElementById('licenseStatus');
							var paymentOptions = document.getElementById('paymentOptions');
							
							statusText.innerHTML = "Unlicensed";
							statusText.style.color = "#FF0000";
							
							paymentOptions.innerHTML = "<button id=\"buyLicense\" disabled>Google Wallet license check failed</button>";
							paymentOptions.innerHTML += "  <br><button id=\"alternatePaymentMethod\">Use alternate payment method</button>";
							
							document.getElementById('buyLicense').addEventListener('click', onBuyButtonClick);
							document.getElementById('alternatePaymentMethod').addEventListener('click', function () {
								paymentOptions.innerHTML = "To pay with an alternate method, send an e-mail to <a href=\"mailto:brian@bing-pong.com\">brian@bing-pong.com</a> with your preferred choice of username and payment.";
								paymentOptions.innerHTML += " Enter in your username and key below.";
								paymentOptions.innerHTML += "<br><br>Username: <input id=\"username\" size=25>";
								paymentOptions.innerHTML += "<br>License key (18 digits): <input id=\"key\" size=25>";
								paymentOptions.innerHTML += "<br><br><center><button id=\"checkKey\">Check license information</button></center>";
								paymentOptions.innerHTML += "<br><center><span id=\"keyCheckStatus\">&nbsp;</span></center>";
								
								document.getElementById('checkKey').addEventListener('click', function () { 
									setCookie("username", document.getElementById('username').value);
									setCookie("key", document.getElementById('key').value);
								
									checkLicenseKey(function (licensedViaKey) { 
										if (licensedViaKey) { 
											paymentOptions.innerHTML = "";
											updateLicenseDisplay(licensedViaKey, isLicensed);
										} else {
											document.getElementById('keyCheckStatus').innerHTML = "<b>Invalid username/key combination.</b>";
										}
									});
								});
							
								disableProFeatures();
							});
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
document.getElementById('autoRunOption').addEventListener('click', onSettingsChange);
document.getElementById('autoRunTime').addEventListener('click', onSettingsChange);

document.getElementById('version').innerHTML = chrome.app.getDetails().version;

parseCookieInfo();
checkForLicense();