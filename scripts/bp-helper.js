// constants
var DASHBOARD_CLOSE_TIMEOUT = 15000;
var SEARCH_FINISH_TIMEOUT = 15000;
var DELAY_BEFORE_ENTERING_USERNAME = 1000;
var DELAY_AFTER_ENTERING_USERNAME = 1000;
var DELAY_AFTER_ENTERING_PASSWORD = 1000;
var DELAY_AFTER_HITTING_LOGIN_BUTTON = 5000;
var LOGOUT_PAGE_LOAD_DELAY = 3000;
var LOGIN_PAGE_LOAD_DELAY = 3000;
var NUMBER_OF_DICTIONARIES = 15;
var MINIMUM_DELAY_BEFORE_SCROLLING_DOWN = 500;
var MAXIMUM_DELAY_BEFORE_SCROLLING_DOWN = 7000;
var MINIMUM_DELAY_BEFORE_SCROLLING_UP = 500;
var MAXIMUM_DELAY_BEFORE_SCROLLING_UP = 7000;
var DELAY_BEFORE_RETURNING_AFTER_SEARCHING = 8000;
var DASHBOARD_TASK_CLICK_DELAY = 2000;
var TASK_TO_DASHBOARD_DELAY = 6000;
var FIRST_TASK_ATTEMPT_DELAY = 10000;

var globalResponse, dashboardLoads, logoutLoads, dashboardWindow, dashboardTab, searchWindow, searchTab, loginWindow, loginTab, loginTimeout, dashboardFunctionLoads, bpWindow, captchaTab, minDelay, maxDelay, dashboardTimeout, searchTimeout;
var username, password;
var backgroundFrame = document.getElementById('backgroundFrame');
var searchFrame = document.getElementById('searchFrame');
var noSandboxFrame = document.getElementById('noSandboxFrame');
var taskTabs = new Array();
var useMobileUA = 0;
var bypassLicensing = false;
var hasParsedDictionaries = false;
var alreadyOpened;
var dictionary = new Array();
var dictionaryIndex = 1;
var isCanary = true;

/*
chrome.management.onInstalled.addListener(function (installedExtensionInfo) { 
	checkExtensions();
});

chrome.management.onEnabled.addListener(function (installedExtensionInfo) { 
	checkExtensions();
});


function checkExtensions() { 
	chrome.management.getAll(function (info) { 
		var conflictingExtensionName = (isCanary ? "Bing Pong Helper" : "Bing Pong Helper Canary");
		
		for (var i = 0; i < info.length; i++) { 
			// disable the other Bing Pong Helper extension if it is installed
			if (info[i].name == conflictingExtensionName) { 
				chrome.management.setEnabled(info[i].id, false);
			}
			
			// also, disable the Bing Rewards extension, which could go rogue
			if (info[i].name == "Bing Rewards" && info[i].enabled) { 
				chrome.management.setEnabled(info[i].id, false);
				alert("Bing Pong Helper has disabled the Bing Rewards extension for your own protection. Having Microsoft's extension enabled will give them elevated permissions, allowing them to potentially phone home your botting behavior (as an example, their extension could tell them that you have Bing Pong Helper installed). Their extension is also quite useless anyway. :)");				
			}
		}
	});
}
*/

function getWikiArticles(callback) { 
	$.ajax({
		url: "https://en.wikipedia.org/w/api.php?format=json&action=query&list=random&rnlimit=10&rnnamespace=0",
		json: true,
		beforeSend: function (request) { 
			request.setRequestHeader('Api-User-Agent', 'Bing Pong Helper v' + chrome.app.getDetails().version + ' (developer: brian@bing-pong.com)');
		},
		success: function (data) { 
			var queries = new Array();
			var temp = data.query.random;
			
			for (var i = 0; i < temp.length; i++) { 
				queries.push((temp[i].title).split(" (disambiguation)").join(""));
			}
			
			callback(queries);
		},
		error: function (data) { 
			getWikiArticles(callback);
		}
	});
}

function openBrowserWindow(url, callback) { 
	// obtain the integer part of the Chrome version
	// the method of doing it was obtained from this link: http://stackoverflow.com/questions/4900436/detect-version-of-chrome-installed
	var chromeVersion = parseInt((navigator.userAgent.match(/Chrom(e|ium)\/([0-9]+)\./))[2], 10);
	var openInMinimizedWindow = (chromeVersion >= 44); // chrome.windows API only allows this on Chrome 44+
	
	if (openInMinimizedWindow) { // using Chrome 44+, so show the dashboard minimized instead of tucking it in a corner
		chrome.windows.create({url: url, state: "minimized"}, function (window) {
			// return a reference of the window and its tab to the caller
			callback(window, window.tabs[0]);
		});
	} else { // browser version is < 44, so use the legacy window-opening method
		chrome.windows.create({url: url, focused: false, top: 9999, left: 9999, height: 1, width: 1}, function (window) {
			// return a reference of the window and its tab to the caller
			callback(window, window.tabs[0]);
		});
	}	
}

function enableLicensingBypass() { 
	bypassLicensing = true;
	globalResponse({bypassGranted: true});
}

function disableLicensingBypass() { 
	bypassLicensing = false;
	globalResponse();
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
			
			if (callback) { 
				callback(isLicensed);
			}
		} else { // not licensed via the Chrome web store
			// check if the user has a license key
			checkLicenseKey(function (licensedViaKey) { 
				if (licensedViaKey) { 
					setCookie("isLicensed", licensedViaKey);
					
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
								
								setCookie("isLicensed", isLicensed);
								
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
			checkLicenseKey(function (licensedViaKey) { 
				if (licensedViaKey) { 
					setCookie("isLicensed", licensedViaKey);
					
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
								
								setCookie("isLicensed", isLicensed);
								
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

function getCookie(cookieName) { 
	return window.localStorage.getItem(cookieName);
}
	
function setCookie(cookieName, cookieValue) { 
	window.localStorage.setItem(cookieName, cookieValue);
}

// set default Bing Pong Helper options if cookies aren't set
if (!getCookie("emulateHumanSearchingBehavior")) { 
	setCookie("emulateHumanSearchingBehavior", "EMULATE_HUMAN_SEARCH_BEHAVIOR.ENABLED");
}

if (!getCookie("useAlternateLogoutMethod")) { 
	setCookie("useAlternateLogoutMethod", "USE_ALTERNATE_LOGOUT_METHOD.ENABLED");
}

if (!getCookie("useAlternateLoginMethod")) { 
	setCookie("useAlternateLoginMethod", "USE_ALTERNATE_LOGIN_METHOD.ENABLED"); 
}

function logIntoAccount() { 
	if (getCookie("useAlternateLoginMethod") == "USE_ALTERNATE_LOGIN_METHOD.ENABLED") { 
		openBrowserWindow("https://login.live.com", function (window, tab) {
			loginWindow = window;
			loginTab = tab;
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
}

function getUsernameCode() { 
	return "document.getElementById(\"i0116\").value = \"" + username + "\";";
}

function getPasswordCode() { 
	return "document.getElementById(\"i0118\").value = \"" + password + "\";";
}

function getPressLoginButtonCode() { 
	return "document.getElementById(\"idSIButton9\").click();";
}

function inputLoginDetails() { 
	var usernameTimeout, passwordTimeout, buttonClickTimeout;
	
	var inputUsername = function () {
		chrome.tabs.executeScript(loginTab.id, {code: getUsernameCode(), runAt: "document_idle"}, function (input) {
			if (chrome.runtime.lastError) {
				return;
			}
			
			clearTimeout(usernameTimeout);
				
			var inputPassword = function () {
				chrome.tabs.executeScript(loginTab.id, {code: getPasswordCode(), runAt: "document_idle"}, function (input) { 
					clearTimeout(passwordTimeout);
						
					var pressLoginButton = function () {
						chrome.tabs.executeScript(loginTab.id, {code: getPressLoginButtonCode(), runAt: "document_idle"}, function (input) {
							setTimeout(function () {
								// close the log-in window and return to caller
								chrome.windows.remove(loginWindow.id, function () {
									// temp band-aid
									if (globalResponse) { 
										globalResponse();
										globalResponse = null;
									}
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

function logoutOfAccount() { 
	if (getCookie("useAlternateLogoutMethod") == "USE_ALTERNATE_LOGOUT_METHOD.ENABLED") {
		// no need to worry about calling globalResponse --- deleteMicrosoftCookies does that for us
		deleteMicrosoftCookies();
	} else {
		backgroundFrame.src = "https://login.live.com/logout.srf";
		backgroundFrame.onload = function () {
			// clear the onload handler
				backgroundFrame.onload = function () {};
					
			// return to caller
			setTimeout(globalResponse, LOGOUT_PAGE_LOAD_DELAY);
		};
	}
}	

function deleteMicrosoftCookies() {
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
			
			// return to caller
			globalResponse();
		});
	});
}
	

function performGETRequest(URL, responseIsJSON) { 
	$.ajax({
      	url: URL,
      	type: 'GET',
		dataType: (responseIsJSON ? 'json' : 'text'),
      	success: function (data) { 
      		// return to caller
      		setTimeout(function () { globalResponse({contents: data}); }, 200);
      	},
      	error: function (data) { 
      		performGETRequest(URL);
      	}
    });
}

function openDashboard() { 
	chrome.tabs.create({url: "https://www.bing.com/rewards/dashboard", active: true}, function (tab) { 
		globalResponse();
	});
}

function openDashboardForCaptcha() {
	chrome.tabs.create({url: "https://www.bing.com/rewards/captcha", active: true}, function (tab) { 
		captchaTab = tab;
		globalResponse();
	});
}

function closeDashboardForCaptcha() {
	chrome.tabs.remove(captchaTab.id, globalResponse);
}

function openOutlook() {
	chrome.tabs.create({url: "https://mail.live.com", active: true}, function (tab) { 
		globalResponse();
	});
}

function performTasks(taskList) { 
	// open the Bing Rewards dashboard in a new window
	openBrowserWindow("https://bing.com/rewards/dashboard", function (window, tab) { 
		var processNextTask = function () {
			var taskURL = taskList.pop();
			
			// get the contents of emulation.js
			$.ajax({
				url: chrome.extension.getURL("scripts/emulation.js"),
				type: 'GET',
				dataType: 'text',
				success: function (emulationCode) { 
					// click on the the task on the dashboard that corresponds to this task's URL
					chrome.tabs.executeScript(tab.id, {code: emulationCode + "clickOnLinkWithUrl(\"" + taskURL + "\", " + DASHBOARD_TASK_CLICK_DELAY + ");", runAt: "document_start"}, function (result) { 
						setTimeout(function () { 
							if (taskList.length > 0) {
								processNextTask();
							} else {
								chrome.windows.remove(window.id, globalResponse);
							}
						}, TASK_TO_DASHBOARD_DELAY + DASHBOARD_TASK_CLICK_DELAY);
					});
				}
			});
		}
		
		setTimeout(processNextTask, FIRST_TASK_ATTEMPT_DELAY);
	});
}
		
function openDashboardForVerifying() {
	// open the dashboard in a new window
	openBrowserWindow("https://bing.com/rewards/dashboard", function (window, tab) {
		dashboardWindow = window;
		dashboardTab = tab;
		dashboardTimeout = setTimeout(closeDashboardForVerifying, DASHBOARD_CLOSE_TIMEOUT);
	});
}

function closeDashboardForVerifying() { 
	if (dashboardWindow) { 
		chrome.windows.remove(dashboardWindow.id);
		dashboardWindow = null;
	}		

	globalResponse();		
}

function openSearchWindow() { 
	openBrowserWindow("https://google.com", function (window, tab) {
		searchWindow = window;
		searchTab = tab;
		globalResponse();
	});	
}

function closeSearchWindow() { 
	// temporary bsnd-aid
	if (searchWindow) { 
		chrome.windows.remove(searchWindow.id, function () {
			searchTimeout = null;
			searchWindow = null;
			searchTab = null;
			globalResponse();
		});
	} else {
		globalResponse();
	}
}

function performSearch(searchURL) { 
	chrome.tabs.update(searchTab.id, {url: searchURL, active: false});
	searchTimeout = setTimeout(executeSearchCaptchaScript, SEARCH_FINISH_TIMEOUT);
}

function emulateHumanSearchingBehavior() { 
	var numberOfScrollsUpRemaining = 5 + Math.floor(20 * Math.random());
	var numberOfScrollsDownRemaining = 5 + Math.floor(20 * Math.random());
	
	if (numberOfScrollsUpRemaining > numberOfScrollsDownRemaining) {
		numberOfScrollsUpRemaining = numberOfScrollsDownRemaining;
	}
	
	var scrollDown = function () {
		if (numberOfScrollsDownRemaining) { 
			numberOfScrollsDownRemaining--;
			
			chrome.tabs.executeScript(searchTab.id, {code: "window.scroll(0, document.body.scrollTop + 40);", runAt: "document_start"}, function (result) {
				console.log('scrolled to ' + document.body.scrollTop + 'px.');
				setTimeout(scrollDown, 25);
			});
		} else {
			setTimeout(scrollUp, MINIMUM_DELAY_BEFORE_SCROLLING_UP + (MAXIMUM_DELAY_BEFORE_SCROLLING_UP - MINIMUM_DELAY_BEFORE_SCROLLING_UP)*Math.random());
		}
	};

	var scrollUp = function () {
		if (numberOfScrollsUpRemaining) { 
			numberOfScrollsUpRemaining--;
			chrome.tabs.executeScript(searchTab.id, {code: "window.scroll(0, document.body.scrollTop - 40);", runAt: "document_start"}, function (result) {
				console.log('scrolled to ' + document.body.scrollTop + 'px.');
				setTimeout(scrollUp, 25);
			});
		} else {
			// done scrolling
			var randomNumber = Math.random();
			
			// scroll down to the bottom and go the second page with 15% probability
			if (randomNumber < 0.15) { 
				// scroll to the bottom
				chrome.tabs.executeScript(searchTab.id, {code: "window.scroll(0, 9999);", runAt: "document_start"}, function (result) {
					chrome.tabs.executeScript(searchTab.id, {file: "scripts/click-on-next-page-arrow.js", runAt: "document_start"}, function (result) {
						// prevent some searches from "loading" twice
						if (globalResponse) { 
							setTimeout(globalResponse, DELAY_BEFORE_RETURNING_AFTER_SEARCHING);
							globalResponse = null;
						}
					});
				});
			} else if (randomNumber > 0.15 && randomNumber < 0.90) { // click on a result with 75% probability
				chrome.tabs.executeScript(searchTab.id, {file: "scripts/jquery.js", runAt: "document_start"}, function (result) { 
					chrome.tabs.executeScript(searchTab.id, {file: "scripts/click-on-search-result.js", runAt: "document_start"}, function (result) {
						// prevent some searches from "loading" twice
						if (globalResponse) { 
							setTimeout(globalResponse, DELAY_BEFORE_RETURNING_AFTER_SEARCHING);
							globalResponse = null;
						}
					});
				});
			} else { // do nothing with 10% probability
				// prevent some searches from "loading" twice
				if (globalResponse) { 
					setTimeout(globalResponse, DELAY_BEFORE_RETURNING_AFTER_SEARCHING);
					globalResponse = null;
				}
			}
		}
	};
	
	setTimeout(scrollDown, MINIMUM_DELAY_BEFORE_SCROLLING_DOWN + (MAXIMUM_DELAY_BEFORE_SCROLLING_DOWN - MINIMUM_DELAY_BEFORE_SCROLLING_DOWN)*Math.random());
}

function executeSearchCaptchaScript() { 
	clearTimeout(searchTimeout);
	searchTimeout = null;
	
	setTimeout(function () {
		checkForSearchCaptcha(function (tabIsDead, captchaDetected) {
			if (captchaDetected || tabIsDead || getCookie("emulateHumanSearchingBehavior") == "EMULATE_HUMAN_SEARCH_BEHAVIOR.DISABLED") {
				// prevent some searches from "loading" twice
				if (globalResponse) { 
					globalResponse({tabIsDead: tabIsDead, captchaDetected: captchaDetected});
					globalResponse = null;
				}
			} else {
				chrome.tabs.executeScript(searchTab.id, {code: "document.getElementsByTagName('html')[0].innerHTML;", runAt: "document_start"}, function (source) {
					searchWindowContents = source;
					emulateHumanSearchingBehavior();
				});
			}
		});
	}, 200 + minDelay + (maxDelay - minDelay - 200)*Math.random());
}

function checkForSearchCaptcha(callback) {
	// checks for tab crash. if a crash has occurred, return to caller
	var tabCrashTimeout = setTimeout(function () {
		callback(true, false);
	}, 500);
	
	chrome.tabs.executeScript(searchTab.id, {code: "document.getElementsByTagName('html')[0].innerHTML;", runAt: "document_start"}, function (source) {	
		callback(false, (!chrome.runtime.lastError && source && JSON.stringify(source).indexOf("Pardon the interruption") != -1));
		clearTimeout(tabCrashTimeout);
	});
}

function bringSearchCaptchaIntoFocus() {
	// open up the new tab page in the search window to keep it from closing when the search tab changes windows
	chrome.tabs.create({windowId: searchWindow.id}, function (tab) { 
		// move the search tab to the BP window so that it can be noticed
		chrome.tabs.move(searchTab.id, {windowId: bpWindow.id, index: -1}, function (tabs) {
			// make it the active tab
			chrome.tabs.update(searchTab.id, {active: true}, function (tab) {
				globalResponse();
			});
		});
	});
}

function moveSearchCaptchaBack() {
	chrome.tabs.move(searchTab.id, {windowId: searchWindow.id, index: -1}, function (tabs) {
		globalResponse();
	});
}

function openBPHOptions() { 
	chrome.tabs.create({url: chrome.extension.getURL("options.html"), active: true}, function (tab) { 
		globalResponse();
	});
}

function obtainWakelock() { 
	chrome.power.requestKeepAwake("system");
	globalResponse();
}

function releaseWakelock() { 
	chrome.power.releaseKeepAwake();
	globalResponse();
}

chrome.webRequest.onBeforeSendHeaders.addListener(function (details) {
	var headers = details.requestHeaders;
	
	// check for the "mbp" keyword or if the useMobileUA flag is set, and emulate a mobile browser when found
	if (details.url.indexOf("search?q=mbp") != -1 || (useMobileUA && searchTab && details.tabId == searchTab.id)) { 
		// modify the user-agent string to emulate a mobile browser
		for (var i = 0; i < headers.length; i++) {
			if (headers[i].name == 'User-Agent') {
				headers[i].value = 'Mozilla/5.0 (iPhone; CPU iPhone OS 9_2_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13D15 Safari/601.1';
				break;
			}
		}
	}
	
	return {requestHeaders: headers};
}, {urls: ["<all_urls>"]}, ['requestHeaders', 'blocking']);

/*
chrome.webRequest.onBeforeRequest.addListener(function (details) { 
	var goodDomains = ["bing.com", "bing.net", "live.com", "msn.com", "microsoft.com", chrome.runtime.id];
	
	// block requests in the searching tab that aren't from a "good website"
	if (getCookie("emulateHumanSearchingBehavior") == "EMULATE_HUMAN_SEARCH_BEHAVIOR.ENABLED" && searchTab && details.tabId == searchTab.id && details.url.indexOf("bing.com") == -1 && details.url.indexOf("bing.net") == -1 && details.url.indexOf("live.com") == -1 && details.url.indexOf("msn.com") == -1 && details.url.indexOf("microsoft.com") == -1 && details.url.indexOf(chrome.runtime.id) == -1) { 
		return {redirectUrl: chrome.extension.getURL("search_result_blocked.html")};
	}
	
	return {cancel: false};
}, {urls: ["<all_urls>"]}, ['blocking']);
*/

chrome.webRequest.onHeadersReceived.addListener(function (details) {
	var headers = details.responseHeaders;
	var urlOfRequest = details.url;

	if (dashboardWindow && urlOfRequest.indexOf("secure/Passport.aspx") != -1) { 
		clearTimeout(dashboardTimeout);
		dashboardTimeout = null;
		closeDashboardForVerifying();
	}

	return {responseHeaders: headers};
}, {urls: ["<all_urls>"]}, ['responseHeaders', 'blocking']);

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tabs) {
	if (tabs.url.indexOf("bing-pong.com") != -1 || tabs.url.indexOf("bingpong.net") != -1 || tabs.url.indexOf("bing.com") != -1 || tabs.url.indexOf("live.com") != -1 || tabs.url.indexOf("msn.com") != -1) { 
		chrome.pageAction.show(tabId);
	}
	
	if (dashboardTab && tabId == dashboardTab.id && changeInfo.status == "complete") {
		// stub?
	}
	
	if (searchTab && tabId == searchTab.id && changeInfo.status == "complete") { 
		if (searchTimeout) { 
			executeSearchCaptchaScript();
		}
	}
	
	if (loginTab && tabId == loginTab.id && changeInfo.status == "complete") { 
		setTimeout(inputLoginDetails, LOGIN_PAGE_LOAD_DELAY);
	}
});

chrome.runtime.onMessageExternal.addListener(function (message, sender, sendResponse) {
	globalResponse = sendResponse;
	
	if (message.action == "testBPH") { 
		// make sure that the dashboard pop-ups only occur in the main BP window (less annoying)
		chrome.windows.getCurrent(function (window) {
			useMobileUA = 0;
			bpWindow = window;
			
			chrome.contentSettings.location.clear({scope: "regular"}, function () { // workaround for Chrome bug
				chrome.contentSettings.popups.clear({scope: "regular"}, function () {
					chrome.contentSettings.location.set({primaryPattern: "*://*.bing.com/*", setting: "block"}, function () {
						chrome.contentSettings.popups.set({primaryPattern: "*://*.bing.com/*", setting: "allow"}, function () {
							globalResponse({bphVersion: chrome.app.getDetails().version});
						});
					});
				});
			});
		});
	} else if (message.action == "checkForLicense") { 
		checkForLicense(globalResponse);
	} else if (message.action == "enableLicensingBypass") { 
		enableLicensingBypass();
	} else if (message.action == "disableLicensingBypass") { 
		disableLicensingBypass();
	} else if (message.action == "logIntoAccount") { 
		if (message.username == "bph-test-username" && message.password == "bph-test-password") { 
			sendResponse();
		} else {
			username = message.username;
			password = message.password;
			logIntoAccount();
		}
	} else if (message.action == "logoutOfAccount") { 
		logoutLoads = 0;
		logoutOfAccount();
	} else if (message.action == "performGETRequest") { 
		performGETRequest(message.ajaxURL, message.responseIsJSON);
	} else if (message.action == "openDashboardForVerifying") {
		dashboardLoads = 0;
		dashboardFunctionLoads = 1;
		openDashboardForVerifying();
	} else if (message.action == "closeDashboardForVerifying") { 
		try {
			closeDashboardForVerifying();
		} catch (e) { 
			globalResponse();
		}
	} else if (message.action == "openSearchWindow") { 
		openSearchWindow();
	} else if (message.action == "closeSearchWindow") { 
		closeSearchWindow();
	} else if (message.action == "performSearch") { 
		minDelay = message.minDelay;
		maxDelay = message.maxDelay;
		performSearch(message.searchURL);
	} else if (message.action == "performTasks") { 
		performTasks(message.taskList);
	} else if (message.action == "openOutlook") { 
		openOutlook();
	} else if (message.action == "openDashboard") { 
		openDashboard();
	} else if (message.action == "enableMobileMode") { 
		useMobileUA = 1;
		globalResponse();
	} else if (message.action == "disableMobileMode") { 
		useMobileUA = 0;
		globalResponse();
	} else if (message.action == "deleteMicrosoftCookies") {
		deleteMicrosoftCookies();
	} else if (message.action == "checkForSearchCaptcha") {
		checkForSearchCaptcha(function (tabIsDead, captchaDetected) { 
			globalResponse({tabIsDead: tabIsDead, captchaDetected: captchaDetected});
		});
	} else if (message.action == "bringSearchCaptchaIntoFocus") {
		bringSearchCaptchaIntoFocus();
	} else if (message.action == "moveSearchCaptchaBack") {
		moveSearchCaptchaBack();
	} else if (message.action == "openDashboardForCaptcha") {
		openDashboardForCaptcha();
	} else if (message.action == "closeDashboardForCaptcha") {
		closeDashboardForCaptcha();
	} else if (message.action == "openBPHOptions") { 
		openBPHOptions();
	} else if (message.action == "obtainWakelock") { 
		obtainWakelock();
	} else if (message.action == "releaseWakelock") { 
		releaseWakelock();
	} else if (message.action == "getDictionaryWord") { 
		getDictionaryWord(function (word) { 
			globalResponse({word: word});
		});
	} else if (message.action == "getWikiArticles") { 
		getWikiArticles(function (queries) { 
			globalResponse({queries: queries});
		});
	} else if (message.action == "checkHumanBehavior") {
		globalResponse({isEnabled: getCookie("emulateHumanSearchingBehavior") == "EMULATE_HUMAN_SEARCH_BEHAVIOR.ENABLED"});
	} else if (message.action == "getSearchWindowContents") { 
		globalResponse({contents: searchWindowContents[0]});
	} else {
		// more to come
	}
	
	return true;
});

checkForLicense();
// checkExtensions();