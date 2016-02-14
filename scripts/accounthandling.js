// constants
var DELAY_BEFORE_ENTERING_USERNAME = 1000;
var DELAY_AFTER_ENTERING_USERNAME = 1000;
var DELAY_AFTER_ENTERING_PASSWORD = 1000;
var DELAY_AFTER_HITTING_LOGIN_BUTTON = 5000;
var LOGOUT_PAGE_LOAD_DELAY = 3000;
var LOGIN_PAGE_LOAD_DELAY = 3000;
var LOGIN_PAGE_LOAD_TIME_LIMIT = 10000;

function logIntoAccount(username, password, callback) { 
	getCookie("useAlternateLoginMethod", function (useAlternateLoginMethodCookieValue) { 
		if (useAlternateLoginMethodCookieValue === "USE_ALTERNATE_LOGIN_METHOD.ENABLED") { 
			openBrowserWindow("https://login.live.com", function (loginWindow, loginTab) {
				onTabLoad(loginTab, {callbackAfterDelay: true, delay: LOGIN_PAGE_LOAD_TIME_LIMIT}, function (tabLoadStalled) {
					setTimeout(function () { 
						inputLoginDetails(username, password, loginWindow, loginTab, callback);
					}, LOGIN_PAGE_LOAD_DELAY);
				});
			});
		} else {
			// get the challenge solution from the log-in page, which will be passed onto Bing via the PPFT parameter
			$.ajax({
				url: 'https://login.live.com/ppsecure/post.srf?wa=wsignin1.0&wreply=http:%2F%2Fwww.bing.com%2FPassport.aspx%3Frequrl%3Dhttp%253a%252f%252fwww.bing.com%252frewards%252fdashboard',
				type: 'GET',
				cache: 'false',
				success: function (data1) {
					// log into Bing using the challenge solution obtained with the first AJAX request 
					$.ajax({
						url: 'https://login.live.com/ppsecure/post.srf?wa=wsignin1.0&wreply=http:%2F%2Fwww.bing.com%2FPassport.aspx%3Frequrl%3Dhttp%253a%252f%252fwww.bing.com%252frewards%252fdashboard',
						type: 'POST',
						cache: 'true',
						data: {
							'login' : username,
							'passwd' : password,
							'type' : '11',
							'PPFT' : data1.substring(data1.indexOf("name=\"PPFT\" id=\"i0327\" value=\"") + 30, data1.indexOf("\"/>\'")),
							'PPSX' : 'Passport'
						},
						success: function (data2) { 
							// return to caller
							globalResponse();
						},
						error: function (data2) { 
							logIntoAccount();
						}
					});
				},
				error: function (data1) { 
					logIntoAccount();
				}
			});
		}
	});
}

function getUsernameCode(username) { 
	return "document.getElementById(\"i0116\").value = \"" + username + "\";";
}

function getPasswordCode(password) { 
	return "document.getElementById(\"i0118\").value = \"" + password + "\";";
}

function getPressLoginButtonCode() { 
	return "document.getElementById(\"idSIButton9\").click();";
}

function inputLoginDetails(username, password, loginWindow, loginTab, callback) { 
	var usernameTimeout, passwordTimeout, buttonClickTimeout;

	var inputUsername = function () {
		chrome.tabs.executeScript(loginTab.id, {code: getUsernameCode(username), runAt: "document_idle"}, function (input) {
			clearTimeout(usernameTimeout);
				
			var inputPassword = function () {
				chrome.tabs.executeScript(loginTab.id, {code: getPasswordCode(password), runAt: "document_idle"}, function (input) { 
					clearTimeout(passwordTimeout);
						
					var pressLoginButton = function () {
						chrome.tabs.executeScript(loginTab.id, {code: getPressLoginButtonCode(), runAt: "document_idle"}, function (input) {
							setTimeout(function () {
								// close the log-in window and return to caller
								chrome.windows.remove(loginWindow.id, function () {
									callback();
								});
							}, DELAY_AFTER_HITTING_LOGIN_BUTTON);
						});
					};
							
					setTimeout(pressLoginButton, DELAY_AFTER_ENTERING_PASSWORD);
				});
			};
				
			setTimeout(inputPassword, DELAY_AFTER_ENTERING_USERNAME);
		});
	}
	
	setTimeout(inputUsername, DELAY_BEFORE_ENTERING_USERNAME);
}

function logoutOfAccount(callback) { 
	var backgroundFrame = document.getElementById('backgroundFrame');
	
	getCookie("useAlternateLogoutMethod", function (useAlternateLogoutMethodCookieValue) { 
		if (useAlternateLogoutMethodCookieValue === "USE_ALTERNATE_LOGOUT_METHOD.ENABLED") {
			deleteMicrosoftCookies(callback);
		} else {
			backgroundFrame.src = "https://login.live.com/logout.srf";
			backgroundFrame.onload = function () {
				// clear the onload handler
					backgroundFrame.onload = function () {};
						
				// return to caller
				setTimeout(callback, LOGOUT_PAGE_LOAD_DELAY);
			};
		}
	});
}	