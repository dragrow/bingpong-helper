var bph = (bph || {}); // the options page is isolated from the other files, so we need to redefine bph

bph.options = (function () { 	
	function _parseCookieInfo() { 
		bph.cookies.get("useAlternateLoginMethod", function (useAlternateLoginMethodCookieValue) { 
			if (useAlternateLoginMethodCookieValue === "USE_ALTERNATE_LOGIN_METHOD.DISABLED") { 
				document.getElementById('useAlternateLoginMethod').checked = false;
			}
		});
		
		bph.cookies.get("useAlternateLogoutMethod", function (useAlternateLogoutMethodCookieValue) { 
			if (useAlternateLogoutMethodCookieValue === "USE_ALTERNATE_LOGOUT_METHOD.DISABLED") {
				document.getElementById('useAlternateLogoutMethod').checked = false;
			}
		});
		
		bph.cookies.get("emulateHumanSearchingBehavior", function (emulateHumanSearchingBehaviorCookieValue) { 
			if (emulateHumanSearchingBehaviorCookieValue === "EMULATE_HUMAN_SEARCH_BEHAVIOR.DISABLED") { 
				document.getElementById('emulateHumanSearchingBehavior').checked = false;
			}
		});
		
		bph.cookies.get("autoRunOption", function (autoRunOptionCookieValue) {	
			if (autoRunOptionCookieValue === "AUTO_RUN.ENABLED") { 
				document.getElementById('autoRunOption').checked = true;
				document.getElementById('autoRunTime').disabled = false;
				
				bph.cookies.get("autoRunTime", function (autoRunTimeCookieValue) { 
					document.getElementById('autoRunTime').selectedIndex = autoRunTimeCookieValue;
				});
			}
		});
	}
		
	function onSettingsChange() { 
		bph.cookies.set("useAlternateLoginMethod", (document.getElementById('useAlternateLoginMethod').checked ? "USE_ALTERNATE_LOGIN_METHOD.ENABLED" : "USE_ALTERNATE_LOGIN_METHOD.DISABLED"));
		bph.cookies.set("useAlternateLogoutMethod", (document.getElementById('useAlternateLogoutMethod').checked ? "USE_ALTERNATE_LOGOUT_METHOD.ENABLED" : "USE_ALTERNATE_LOGOUT_METHOD.DISABLED"));
		bph.cookies.set("emulateHumanSearchingBehavior", (document.getElementById('emulateHumanSearchingBehavior').checked ? "EMULATE_HUMAN_SEARCH_BEHAVIOR.ENABLED" : "EMULATE_HUMAN_SEARCH_BEHAVIOR.DISABLED"));
		bph.cookies.set("autoRunOption", (document.getElementById('autoRunOption').checked ? "AUTO_RUN.ENABLED" : "AUTO_RUN.DISABLED"));
		bph.cookies.set("autoRunTime", document.getElementById('autoRunTime').selectedIndex);
		
		if (document.getElementById('autoRunOption').checked) {
			// get "background" and "notifications" permissions
			chrome.permissions.request({permissions: ['background', 'notifications']}, function (granted) { 
				if (granted) { 
					document.getElementById('autoRunTime').disabled = false;
				} else {
					alert("We were unable to acquire the required permissions. Please try again later.");
					document.getElementById('autoRunOption').checked = false;
					document.getElementById('autoRunOption').disabled = true;
					bph.cookies.set("autoRunOption", "AUTO_RUN.DISABLED");
				}
			});
		} else {
			// release the "background" and "notifications" permissions
			chrome.permissions.remove({permissions: ['background', 'notifications']}, function (removed) {
				// disable auto-run time dropdown
				document.getElementById('autoRunTime').disabled = true;
			});
		}
	}

	function _checkForLicense(callback) { 
		var updateLicenseStatus = function (response) {
			var purchasedItems = response.response.details;
			var isLicensed = false;
			var checkLicenseViaIP;
			
			for (var i = 0; i < purchasedItems.length; i++) { 
				if (purchasedItems[i].sku == "bph_pro" && purchasedItems[i].state == "ACTIVE") { 
					isLicensed = true;
					break;
				}
			}
			
			if (isLicensed) { // licensed via the Chrome web store
				bph.cookies.set("isLicensed", isLicensed);
				_updateLicenseDisplay(false, false);
			} else { // not licensed via the Chrome web store
				// check if the user is licensed via their key
				_checkLicenseKey(function (licensedViaKey) {
					if (licensedViaKey) { 
						_updateLicenseDisplay(true, false);
					} else {	
						// as a final check, check if the user is licensed via their IP address
						(checkLicenseViaIP = function () {
							$.ajax({
								url: 'http://brian-kieffer.com/iplicensecheck.php',
								type: 'GET',
								cache: false,
								dataType: 'text',
								success: function (licensedViaIP) { 
									isLicensed = (licensedViaIP === "true");
									
									bph.cookies.set("isLicensed", isLicensed);
									_updateLicenseDisplay(false, isLicensed);
								},
								error: function (data) { 
									checkLicenseViaIP();
								}
							});
						})();
					}
				});
			}
		}
		
		google.payments.inapp.getPurchases({
			'parameters': {'env': 'prod'},
			'success': updateLicenseStatus,
			'failure': _getPurchasesFailed
		});
	}

	function _checkLicenseKey(callback) { 
		var isLicensed = false;
		var checkKey;
		
		bph.cookies.get("username", function (usernameCookieValue) { 
			bph.cookies.get("key", function (keyCookieValue) { 
				(checkKey = function () {
					$.ajax({
						url: 'http://brian-kieffer.com/keylicensecheck.php',
						type: 'GET',
						cache: false,
						dataType: 'text',
						data: {
							'username': usernameCookieValue,
							'key': keyCookieValue
						},
						success: function (licensedViaKey) { 
							isLicensed = (licensedViaKey.indexOf("true") !== -1);

							bph.cookies.set("isLicensed", isLicensed);
							callback(isLicensed);
						},
						error: function () { 
							checkKey(callback);
						}
					});
				})();
			});
		});
	}
		

	function _updateLicenseDisplay(licensedViaKey, licensedViaIP) { 
		var statusText = document.getElementById('licenseStatus');
		var paymentOptions = document.getElementById('paymentOptions');
		
		paymentOptions.innerHTML = "";
		bph.cookies.get("isLicensed", function (isLicensedCookieValue) {
			if (isLicensedCookieValue) { 
				statusText.innerHTML = "Licensed";
				statusText.style.color = "#00FF00";
				
				if (licensedViaKey) { 
					bph.cookies.get("username", function (usernameCookieValue) { 
						bph.cookies.get("key", function (keyCookieValue) { 
							statusText.innerHTML += " (username: " + usernameCookieValue + ", key: " + keyCookieValue + ")";
						});
					});
				}
				
				if (licensedViaIP) { 
					statusText.innerHTML += " (via IP)";
				}
				
				_enableProFeatures();
			} else {
				statusText.innerHTML = "Unlicensed";
				statusText.style.color = "#FF0000";
				
				paymentOptions.innerHTML = "<button id=\"buyLicense\">Purchase license via Google Wallet ($9.99)</button>";
				paymentOptions.innerHTML += "  <br><button id=\"alternatePaymentMethod\">Use alternate payment method</button>";
				
				document.getElementById('buyLicense').addEventListener('click', bph.options.onBuyButtonClick);
				document.getElementById('alternatePaymentMethod').addEventListener('click', function () {
					paymentOptions.innerHTML = "To pay with an alternate method, send an e-mail to <a href=\"mailto:brian@bing-pong.com\">brian@bing-pong.com</a> with your preferred choice of username and payment.";
					paymentOptions.innerHTML += " Enter in your username and key below.";
					paymentOptions.innerHTML += "<br><br>Username: <input id=\"username\" size=25>";
					paymentOptions.innerHTML += "<br>License key (18 digits): <input id=\"key\" size=25>";
					paymentOptions.innerHTML += "<br><br><center><button id=\"checkKey\">Check license information</button></center>";
					paymentOptions.innerHTML += "<br><center><span id=\"keyCheckStatus\">&nbsp;</span></center>";
					
					document.getElementById('checkKey').addEventListener('click', function () { 
						bph.cookies.set("username", document.getElementById('username').value);
						bph.cookies.set("key", document.getElementById('key').value);
					
						_checkLicenseKey(function (licensedViaKey) { 
							if (licensedViaKey) { 
								_updateLicenseDisplay(licensedViaKey, false);
							} else {
								document.getElementById('keyCheckStatus').innerHTML = "<b>Invalid username/key combination.</b>";
							}
						});
					});
				
					_disableProFeatures();
				});
			}
		});
	}

	function _getPurchasesFailed() { // Google's license check failed, but the user's key or IP may give them a license	
		_checkLicenseKey(function (licensedViaKey) {
			if (licensedViaKey) { 
				_updateLicenseDisplay(licensedViaKey);
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
							
							bph.cookies.set("isLicensed", isLicensed);
							
							if (isLicensed) { 
								_updateLicenseDisplay(false, licensedViaKey);
							} else {
								var statusText = document.getElementById('licenseStatus');
								var paymentOptions = document.getElementById('paymentOptions');
								
								statusText.innerHTML = "Unlicensed";
								statusText.style.color = "#FF0000";
								
								paymentOptions.innerHTML = "<button id=\"buyLicense\" disabled>Google Wallet license check failed</button>";
								paymentOptions.innerHTML += "  <br><button id=\"alternatePaymentMethod\">Use alternate payment method</button>";
								
								document.getElementById('buyLicense').addEventListener('click', bph.options.onBuyButtonClick);
								document.getElementById('alternatePaymentMethod').addEventListener('click', function () {
									paymentOptions.innerHTML = "To pay with an alternate method, send an e-mail to <a href=\"mailto:brian@bing-pong.com\">brian@bing-pong.com</a> with your preferred choice of username and payment.";
									paymentOptions.innerHTML += " Enter in your username and key below.";
									paymentOptions.innerHTML += "<br><br>Username: <input id=\"username\" size=25>";
									paymentOptions.innerHTML += "<br>License key (18 digits): <input id=\"key\" size=25>";
									paymentOptions.innerHTML += "<br><br><center><button id=\"checkKey\">Check license information</button></center>";
									paymentOptions.innerHTML += "<br><center><span id=\"keyCheckStatus\">&nbsp;</span></center>";
									
									document.getElementById('checkKey').addEventListener('click', function () { 
										bph.cookies.set("username", document.getElementById('username').value);
										bph.cookies.set("key", document.getElementById('key').value);
									
										_checkLicenseKey(function (licensedViaKey) { 
											if (licensedViaKey) { 
												paymentOptions.innerHTML = "";
												_updateLicenseDisplay(licensedViaKey, isLicensed);
											} else {
												document.getElementById('keyCheckStatus').innerHTML = "<b>Invalid username/key combination.</b>";
											}
										});
									});
								
									_disableProFeatures();
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
			'success': _onPurchase,
			'failure': _onPurchaseFail
		});
	}

	function _onPurchase() { 
		_checkForLicense();
	}

	function _onPurchaseFail() { 
		_checkForLicense();
	}

	function _disableProFeatures() {
		// I want people to use the alternate sign-in method by default, and they can only use the legacy methods with a license
		// document.getElementById('useAlternateLoginMethod').checked = true;
		// document.getElementById('useAlternateLoginMethod').disabled = true;
		// document.getElementById('useAlternateLogoutMethod').checked = true;
		// document.getElementById('useAlternateLogoutMethod').disabled = true;
		// document.getElementById('emulateHumanSearchingBehavior').checked = false; --- for now, emulating human behavior does not need a license
		// document.getElementById('emulateHumanSearchingBehavior').disabled = true;
		
		// bph.cookies.set("useAlternateLoginMethod", "USE_ALTERNATE_LOGIN_METHOD.ENABLED");
		// bph.cookies.set("useAlternateLogoutMethod", "USE_ALTERNATE_LOGOUT_METHOD.ENABLED");
		// bph.cookies.set("emulateHumanSearchingBehavior", "EMULATE_HUMAN_SEARCHING_BEHAVIOR.DISABLED");
	}

	function _enableProFeatures() {
		// document.getElementById('emulateHumanSearchingBehavior').disabled = false; --- this is already enabled
		// document.getElementById('useAlternateLoginMethod').disabled = false;
		// document.getElementById('useAlternateLogoutMethod').disabled = false;
	}
	
	// do an initial cookie and license check
	_parseCookieInfo();
	_checkForLicense();
	
	return {
		onSettingsChange: onSettingsChange,
		onBuyButtonClick: onBuyButtonClick,
	};
})();

document.getElementById('useAlternateLoginMethod').addEventListener('click', bph.options.onSettingsChange);
document.getElementById('useAlternateLogoutMethod').addEventListener('click', bph.options.onSettingsChange);
document.getElementById('emulateHumanSearchingBehavior').addEventListener('click', bph.options.onSettingsChange);
document.getElementById('autoRunOption').addEventListener('click', bph.options.onSettingsChange);
document.getElementById('autoRunTime').addEventListener('click', bph.options.onSettingsChange);

document.getElementById('version').innerHTML = chrome.app.getDetails().version;