// constants
var SEARCH_FINISH_TIMEOUT = 15000;
var MINIMUM_DELAY_BEFORE_SCROLLING_DOWN = 500;
var MAXIMUM_DELAY_BEFORE_SCROLLING_DOWN = 7000;
var MINIMUM_DELAY_BEFORE_SCROLLING_UP = 500;
var MAXIMUM_DELAY_BEFORE_SCROLLING_UP = 7000;
var DELAY_BEFORE_RETURNING_AFTER_SEARCHING = 8000;

function openSearchWindow(callback) { 
	openBrowserWindow("https://google.com", function (window, tab) {
		searchWindow = window;
		searchTab = tab;
		callback();
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