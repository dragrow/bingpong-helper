// constants
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
var DASHBOARD_TASK_LOAD_TIME_LIMIT = 10000;
var DASHBOARD_LOAD_LIMIT = 10000;
var DASHBOARD_CLOSE_TIMEOUT = 10000;
var LOGIN_PAGE_LOAD_TIME_LIMIT = 10000;

var globalResponse, dashboardLoads, dashboardWindow, dashboardTab, searchWindow, searchTab, loginWindow, loginTab, loginTimeout, bpWindow, bpTab, captchaTab, minDelay, maxDelay, dashboardTimeout, searchTimeout;
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
var processNextTask;
var processNextTaskFlag = true;
var alarmListener;

function onTabLoad(tab, callbackAfterDelay, callback) { 
	var tabLoadlistener;
	var tabLoadTimeout;
	
	chrome.tabs.onUpdated.addListener(listener = function (tabId, changeInfo, tab) { 
		if (tabId === tab.id && changeInfo.status === "complete") { 
			chrome.tabs.onUpdated.removeListener(listener);
			clearTimeout(tabLoadTimeout);
			callback(false);
		}
	});
	
	if (callbackAfterDelay.callbackAfterDelay) { // requested to call back if tab hasn't loaded in a reasonable period of time
		tabLoadTimeout = setTimeout(function () { 
			chrome.tabs.onUpdated.removeListener(listener);
			callback(true);
		}, callbackAfterDelay.delay);
	}
		
}

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

function performGETRequest(URL, responseIsJSON, callback) { 
	$.ajax({
      	url: URL,
      	type: 'GET',
		dataType: (responseIsJSON ? 'json' : 'text'),
      	success: function (data) { 
      		// return to caller
      		callback(data);
      	},
      	error: function (data) { 
			// an error occurred, so try again
      		performGETRequest(URL, responseIsJSON, callback);
      	}
    });
}

function openDashboard(callback) { 
	chrome.tabs.create({url: "https://www.bing.com/rewards/dashboard", active: true}, function (tab) { 
		callback();
	});
}

function openDashboardForCaptcha(callback) {
	chrome.tabs.create({url: "https://www.bing.com/rewards/captcha", active: true}, function (tab) { 
		captchaTab = tab;
		callback();
	});
}

function closeDashboardForCaptcha(callback) {
	chrome.tabs.remove(captchaTab.id, callback);
}

function openOutlook(callback) {
	chrome.tabs.create({url: "https://mail.live.com", active: true}, function (tab) { 
		globalResponse(callback);
	});
}

function performTasks(taskList, callback) { 
	var clickOnTask;
	
	// open the Bing Rewards dashboard in a new window
	openBrowserWindow("https://bing.com/rewards/dashboard", function (dashboardWindow, dashboardTab) { 	
		onTabLoad(dashboardTab, {callbackAfterDelay: true, delay: DASHBOARD_TASK_LOAD_TIME_LIMIT}, function () { // dashboard tab loaded
			setTimeout(function () { // wait the FIRST_TASK_ATTEMPT_DELAY before attempting the first task
				// click on the first dashboard task
				(clickOnTask = function (url) { 
					// get the contents of scripts/emulation.js and use it
					performGETRequest(chrome.extension.getURL("scripts/emulation.js"), false, function (emulationCode) {
						// emulate a click on the corresponding dashboard task
						chrome.tabs.executeScript(dashboardTab.id, {code: emulationCode + "clickOnLinkWithUrl(\"" + url + "\", " + DASHBOARD_TASK_CLICK_DELAY + ", true);", runAt: "document_start"}, function (result) {
							setTimeout(function () {
								/** clicking on a dashboard task normally opens a tab with this url naturally
									we don't want this to occur since this causes the new tab to steal focus
									to work around this, clickOnLinkWithUrl() blocks the opening and we open it manually here
								*/
								chrome.tabs.create({windowId: dashboardWindow.id, index: 1, url: url}, function (taskTab) {
									var listener; // for the chrome.tabs.onUpdated listener
									
									chrome.tabs.update(taskTab.id, {muted: true}); // mute the tab (since some tasks have auto-playing videos)
									
									chrome.tabs.onUpdated.addListener(listener = function (tabId, changeInfo, tab) { // listen for activity in the dashboard task tab
										if (tabId === taskTab.id && (changeInfo.url.indexOf("bing.com") === -1 || changeInfo.url.indexOf("url=http") === -1)) { // a non-Bing URL was found in the tab, or an attempt to use a non-HTTP/S protocol was detected
											chrome.tabs.onUpdated.removeListener(listener);
											chrome.tabs.update(taskTab.id, {url: "http://brian-kieffer.com/dashboard_task_blocked.php"}); // block it from loading
										}
									});
									
									onTabLoad(taskTab, {callbackAfterDelay: true, delay: DASHBOARD_TASK_LOAD_TIME_LIMIT}, function () { // dashboard task loaded
										setTimeout(function () { 
											if (taskList.length > 0) { // if there are any tasks left, do the next task after a delay
												clickOnTask(taskList.pop());
											} else {
												chrome.windows.remove(dashboardWindow.id, callback);
											}
										}, DASHBOARD_TASK_CLICK_DELAY); // work on the next task after a delay
									});
								});
							}, DASHBOARD_TASK_CLICK_DELAY);
						});
					});
				})(taskList.pop());
			}, FIRST_TASK_ATTEMPT_DELAY);
		});
	});
}
		
function openDashboardForVerifying(callback) {
	// open the dashboard in a new window
	openBrowserWindow("https://bing.com/rewards/dashboard", function (dashboardWindow, dashboardTab) {
		onTabLoad(dashboardTab, {callbackAfterDelay: true, delay: DASHBOARD_LOAD_LIMIT}, function (tabLoadStalled) {
			onTabLoad(dashboardTab, {callbackAfterDelay: true, delay: DASHBOARD_LOAD_LIMIT}, function (tabLoadStalled) {
				setTimeout(function () { 
					closeDashboardForVerifying(dashboardWindow, callback);
				}, DASHBOARD_CLOSE_TIMEOUT);
			});
		});
	});
}

function closeDashboardForVerifying(dashboardWindow, callback) { 
	chrome.windows.remove(dashboardWindow.id);
	callback();		
}

function openSearchWindow(callback) { 
	openBrowserWindow("https://google.com", function (window, tab) {
		searchWindow = window;
		searchTab = tab;
		callback());
	});	
}

function closeSearchWindow(callback) { 
	chrome.windows.remove(searchWindow.id);
	callback();
}

function performSearch(searchURL, minDelay, maxDelay, callback) { 
	chrome.tabs.update(searchTab.id, {url: searchURL, active: false});
	
	onTabLoad(searchTab, {callbackAfterDelay: true, delay: SEARCH_FINISH_TIMEOUT}, function (tabLoadStalled) { 
		setTimeout(function () { 
			executeSearchCaptchaScript(callback);
		}, 200 + minDelay + (maxDelay - minDelay)*Math.random());
	});
}

function emulateHumanSearchingBehavior(callback) { 
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
						setTimeout(callback, DELAY_BEFORE_RETURNING_AFTER_SEARCHING);
					});
				});
			} else if (randomNumber > 0.15 && randomNumber < 0.90) { // click on a result with 75% probability
				chrome.tabs.executeScript(searchTab.id, {file: "scripts/jquery.js", runAt: "document_start"}, function (result) { 
					chrome.tabs.executeScript(searchTab.id, {file: "scripts/click-on-search-result.js", runAt: "document_start"}, function (result) {
						setTimeout(callback, DELAY_BEFORE_RETURNING_AFTER_SEARCHING);
					});
				});
			} else { // do nothing with 10% probability
				setTimeout(callback, DELAY_BEFORE_RETURNING_AFTER_SEARCHING);
			}
		}
	};
	
	setTimeout(scrollDown, MINIMUM_DELAY_BEFORE_SCROLLING_DOWN + (MAXIMUM_DELAY_BEFORE_SCROLLING_DOWN - MINIMUM_DELAY_BEFORE_SCROLLING_DOWN)*Math.random());
}

function executeSearchCaptchaScript(callback) { 
	checkForSearchCaptcha(function (tabIsDead, captchaDetected) {
		getCookie("emulateHumanSearchingBehavior", function (emulateHumanSearchingBehaviorCookieValue) { 
			if (captchaDetected || tabIsDead || emulateHumanSearchingBehaviorCookieValue == "EMULATE_HUMAN_SEARCH_BEHAVIOR.DISABLED") {
				callback({tabIsDead: tabIsDead, captchaDetected: captchaDetected});
			} else {
				chrome.tabs.executeScript(searchTab.id, {code: "document.getElementsByTagName('html')[0].innerHTML;", runAt: "document_start"}, function (source) {
					searchWindowContents = source;
					emulateHumanSearchingBehavior(callback);
				});
			}
		});
	});
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

function bringSearchCaptchaIntoFocus(callback) {
	// open up the new tab page in the search window to keep it from closing when the search tab changes windows
	chrome.tabs.create({windowId: searchWindow.id}, function (tab) { 
		// move the search tab to the BP window so that it can be noticed
		chrome.tabs.move(searchTab.id, {windowId: bpWindow.id, index: -1}, function (tabs) {
			// make it the active tab
			chrome.tabs.update(searchTab.id, {active: true}, function (tab) {
				callback();
			});
		});
	});
}

function moveSearchCaptchaBack(callback) {
	chrome.tabs.move(searchTab.id, {windowId: searchWindow.id, index: -1}, function (tabs) {
		callback();
	});
}

function obtainWakelock() { 
	chrome.power.requestKeepAwake("system");
	globalResponse();
}

function releaseWakelock(callback) { 
	chrome.power.releaseKeepAwake();
	callback();
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

checkForLicense();