// constants
var DASHBOARD_LOAD_LIMIT = 10000;
var DASHBOARD_CLOSE_TIMEOUT = 10000;

// search window and tab
var searchWindow, searchTab;

// window and tab that contains Bing Pong
var bpWindow, bpTab;

// tab that contains a search or dashboard captcha
var captchaTab;

// mobile user agent flag
var useMobileUA = false;

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

function obtainWakelock(callback) { 
	chrome.power.requestKeepAwake("system");
	callback();
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