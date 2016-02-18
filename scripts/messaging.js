chrome.runtime.onMessageExternal.addListener(function (message, sender, sendResponse) {
	if (message.action == "testBPH") { 
		useMobileUA = false;
		bpTab = sender.tab;
		
		chrome.windows.get(bpTab.windowId, function (window) { // get the window that contains Bing Pong
			bpWindow = window;
		
			chrome.contentSettings.location.clear({scope: "regular"}, function () { // workaround for Chrome bug
				chrome.contentSettings.location.set({primaryPattern: "*://*.bing.com/*", setting: "block"}, function () {
					sendResponse({bphVersion: chrome.app.getDetails().version});
				});
			});
		});
	} else if (message.action == "checkForLicense") { 
		checkForLicense(sendResponse);
	} else if (message.action == "logIntoAccount") { 
		logIntoAccount(message.username, message.password, sendResponse);
	} else if (message.action == "logoutOfAccount") { 
		logoutOfAccount(sendResponse);
	} else if (message.action == "performGETRequest") { 
		performGETRequest(message.ajaxURL, message.responseIsJSON, sendResponse);
	} else if (message.action == "openDashboardForVerifying") {
		openDashboardForVerifying(sendResponse);
	} else if (message.action == "openSearchWindow") { 
		openSearchWindow(sendResponse);
	} else if (message.action == "closeSearchWindow") { 
		closeSearchWindow(sendResponse);
	} else if (message.action == "performSearch") { 
		performSearch(message.searchURL, message.minDelay, message.maxDelay, sendResponse);
	} else if (message.action == "performTasks") { 
		performTasks(message.taskList, sendResponse);
	} else if (message.action == "openOutlook") { 
		openOutlook(sendResponse);
	} else if (message.action == "openDashboard") { 
		openDashboard(sendResponse);
	} else if (message.action == "enableMobileMode") { 
		useMobileUA = true;
		sendResponse();
	} else if (message.action == "disableMobileMode") { 
		useMobileUA = false;
		sendResponse();
	} else if (message.action == "deleteMicrosoftCookies") {
		deleteMicrosoftCookies(sendResponse);
	} else if (message.action == "checkForSearchCaptcha") {
		checkForSearchCaptcha(function (tabIsDead, captchaDetected) { 
			sendResponse({tabIsDead: tabIsDead, captchaDetected: captchaDetected});
		});
	} else if (message.action == "bringSearchCaptchaIntoFocus") {
		bringSearchCaptchaIntoFocus(sendResponse);
	} else if (message.action == "moveSearchCaptchaBack") {
		moveSearchCaptchaBack(sendResponse);
	} else if (message.action == "openDashboardForCaptcha") {
		openDashboardForCaptcha(sendREsponse);
	} else if (message.action == "closeDashboardForCaptcha") {
		closeDashboardForCaptcha(sendResponse);
	} else if (message.action == "openBPHOptions") { 
		chrome.runtime.openOptionsPage();
	} else if (message.action == "obtainWakelock") { 
		obtainWakelock(sendResponse);
	} else if (message.action == "releaseWakelock") { 
		releaseWakelock(sendResponse);
	} else if (message.action == "getDictionaryWord") { 
		getDictionaryWord(function (word) { 
			sendResponse({word: word});
		});
	} else if (message.action == "getWikiArticles") { 
		getWikiArticles(function (queries) { 
			sendResponse({queries: queries});
		});
	} else if (message.action == "checkHumanBehavior") {
		getCookie("emulateHumanSearchingBehavior", function (emulateHumanSearchingBehaviorCookieValue) { 
			sendResponse({isEnabled: emulateHumanSearchingBehaviorCookieValue == "EMULATE_HUMAN_SEARCH_BEHAVIOR.ENABLED"});
		});
	} else if (message.action == "getSearchWindowContents") { 
		sendResponse({contents: searchWindowContents[0]});
	} else if (message.action == "closeBPWindow") { 
		chrome.windows.remove(bpWindow.id, sendResponse);
	} else {
		// more to come
	}
	
	return true;
});