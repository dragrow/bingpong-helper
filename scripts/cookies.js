function getCookie(cookieName, callback) { 
	chrome.storage.sync.get(cookieName, function (items) {
		var cookieValue = items[cookieName]; // value from chrome.storage
		
		if (cookieValue === undefined) { // item isn't in chrome.storage
			callback(window.localStorage.getItem(cookieName)); // use local storage instead
		} else { // item is in chrome.storage
			callback(cookieValue);
		}
	});
}
	
function setCookie(cookieName, cookieValue, callback) {
	var json = {};
	json[cookieName] = cookieValue;
	chrome.storage.sync.set(json, callback);
}

// set default Bing Pong Helper options if cookies aren't set
getCookie("emulateHumanSearchingBehavior", function (emulateHumanSearchingBehaviorCookieValue) { 
	if (emulateHumanSearchingBehaviorCookieValue === null) { 
		setCookie("emulateHumanSearchingBehavior", "EMULATE_HUMAN_SEARCH_BEHAVIOR.ENABLED");
	}
});

getCookie("useAlternateLogoutMethod", function (useAlternateLogoutMethodCookieValue) { 
	if (useAlternateLogoutMethodCookieValue === null) { 
		setCookie("useAlternateLogoutMethod", "USE_ALTERNATE_LOGOUT_METHOD.ENABLED");
	}
});

getCookie("useAlternateLoginMethod", function (useAlternateLoginMethodCookieValue) { 
	if (useAlternateLoginMethodCookieValue === null) { 
		setCookie("useAlternateLoginMethod", "USE_ALTERNATE_LOGIN_METHOD.ENABLED"); 
	}
});

function deleteMicrosoftCookies(callback) {
	// delete all *.bing.com cookies
	chrome.cookies.getAll({domain: "bing.com"}, function (cookies) { 
		for (var i = 0; i < cookies.length; i++) { 
			var tempDomain = cookies[i].domain;
			
			// sometimes tempDomain doesn't start with a period. if it does, strip the period
			if (tempDomain.charAt(0) === ".") { 
				tempDomain = tempDomain.substring(1, tempDomain.length);
			}
			
			chrome.cookies.remove({url: "http" + (cookies[i].secure ? "s" : "") + "://" + tempDomain + cookies[i].path, name: cookies[i].name});
		}
		
		// delete all *.live.com cookies
		chrome.cookies.getAll({domain: "live.com"}, function (cookies) { 
			for (var i = 0; i < cookies.length; i++) { 
				var tempDomain = cookies[i].domain;
			
				// sometimes tempDomain doesn't start with a period. if it does, strip the period
				if (tempDomain.charAt(0) === ".") { 
					tempDomain = tempDomain.substring(1, tempDomain.length);
				}
			
				chrome.cookies.remove({url: "http" + (cookies[i].secure ? "s" : "") + "://" + tempDomain + cookies[i].path, name: cookies[i].name});
			}
			
			// delete all *.microsoft.com cookies
			chrome.cookies.getAll({domain: "microsoft.com"}, function (cookies) { 
				for (var i = 0; i < cookies.length; i++) { 
					var tempDomain = cookies[i].domain;
				
					// sometimes tempDomain doesn't start with a period. if it does, strip the period
					if (tempDomain.charAt(0) === ".") { 
						tempDomain = tempDomain.substring(1, tempDomain.length);
					}
				
					chrome.cookies.remove({url: "http" + (cookies[i].secure ? "s" : "") + "://" + tempDomain + cookies[i].path, name: cookies[i].name});
				}			
			
				// return to caller
				callback();
			});
		});
	});
}