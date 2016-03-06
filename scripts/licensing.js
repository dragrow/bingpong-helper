bph.licensing = (function () { 
	var l = {};
	
	l.checkForLicense = function (callback) { 
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
				bph.cookies.set("isLicensed", isLicensed);
				
				if (callback) { 
					callback(isLicensed);
				}
			} else { // not licensed via the Chrome web store
				// check if the user has a license key
				l.checkLicenseKey(function (licensedViaKey) { 
					if (licensedViaKey) { 
						bph.cookies.set("isLicensed", licensedViaKey);
						
						if (callback) { 
							callback(licensedViaKey);
						}
					} else { // no valid license key, so check if the user is licensed via IP
						var checkLicenseViaIP = function () {
							$.ajax({
								url: 'http://brian-kieffer.com/iplicensecheck.php',
								type: 'GET',
								cache: false,
								dataType: 'text',
								success: function (licensedViaIP) { 
									isLicensed = (licensedViaIP === "true");
									
									bph.cookies.set("isLicensed", isLicensed);
									
									if (callback) { 
										callback(isLicensed);
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
		}
		
		google.payments.inapp.getPurchases({
			'parameters': {'env': 'prod'},
			'success': updateLicenseStatus,
			'failure': function () { // license check failed, but the user may have a key or his IP is whitelisted for a license
				// check if the user has a license key
				l.checkLicenseKey(function (licensedViaKey) { 
					if (licensedViaKey) { 
						bph.cookies.set("isLicensed", licensedViaKey);
						
						if (callback) { 
							callback(licensedViaKey);
						}
					} else { // no valid license key, so check if the user is licensed via IP
						var checkLicenseViaIP = function () {
							$.ajax({
								url: 'http://brian-kieffer.com/iplicensecheck.php',
								type: 'GET',
								cache: false,
								dataType: 'text',
								success: function (licensedViaIP) { 
									isLicensed = (licensedViaIP === "true");
									
									bp.cookies.set("isLicensed", isLicensed);
									
									if (callback) { 
										callback(isLicensed);
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
		});
	}

	l.checkLicenseKey = function (callback) { 
		var isLicensed = false;
		
		bp.cookies.get("username", function (usernameCookieValue) { 
			bp.cookies.get("key", function (keyCookieValue) {
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
							isLicensed = (licensedViaKey.indexOf("true") != -1);

							bp.cookies.set("isLicensed", isLicensed);
							callback(isLicensed);
						},
						error: function () { 
							checkKey();
						}
					});
				})();
			});
		});
	}
	
	return l;
})();

bph.licensing.checkForLicense();