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
		bph.licensing.checkForLicense(sendResponse);
	} else if (message.action == "logIntoAccount") { 
		bph.accountHandling.logIntoAccount(message.username, message.password, sendResponse);
	} else if (message.action == "logoutOfAccount") { 
		bph.accountHandling.logoutOfAccount(sendResponse);
	} else if (message.action == "performGETRequest") { 
		bph.generalTools.performGETRequest(message.ajaxURL, message.responseIsJSON, sendResponse);
	} else if (message.action == "openDashboardForVerifying") {
		bph.generalTools.openDashboardForVerifying(sendResponse);
	} else if (message.action == "openSearchWindow") { 
		bph.generalTools.openSearchWindow(sendResponse);
	} else if (message.action == "closeSearchWindow") { 
		bph.generalTools.closeSearchWindow(sendResponse);
	} else if (message.action == "performSearch") { 
		bph.searching.performSearch(message.searchURL, message.minDelay, message.maxDelay, sendResponse);
	} else if (message.action == "performTasks") { 
		bph.dashboardTasks.performTasks(message.taskList, sendResponse);
	} else if (message.action == "openOutlook") { 
		bph.generalTools.openOutlook(sendResponse);
	} else if (message.action == "openDashboard") { 
		bph.generalTools.openDashboard(sendResponse);
	} else if (message.action == "enableMobileMode") { 
		bph.generalTools.enableMobileMode();
		sendResponse();
	} else if (message.action == "disableMobileMode") { 
		bph.generalTools.disableMobileMode();
		sendResponse();
	} else if (message.action == "deleteMicrosoftCookies") {
		bph.cookies.deleteMicrosoftCookies(sendResponse);
	} else if (message.action == "checkForSearchCaptcha") {
		bph.searching.checkForSearchCaptcha(function (tabIsDead, captchaDetected) { 
			sendResponse({tabIsDead: tabIsDead, captchaDetected: captchaDetected});
		});
	} else if (message.action == "bringSearchCaptchaIntoFocus") {
		bph.searching.bringSearchCaptchaIntoFocus(sendResponse);
	} else if (message.action == "moveSearchCaptchaBack") {
		bph.searching.moveSearchCaptchaBack(sendResponse);
	} else if (message.action == "openDashboardForCaptcha") {
		bph.generalTools.openDashboardForCaptcha(sendREsponse);
	} else if (message.action == "closeDashboardForCaptcha") {
		bph.generalTools.closeDashboardForCaptcha(sendResponse);
	} else if (message.action == "openBPHOptions") { 
		chrome.runtime.openOptionsPage();
	} else if (message.action == "obtainWakelock") { 
		bph.generalTools.obtainWakelock(sendResponse);
	} else if (message.action == "releaseWakelock") { 
		bph.generalTools.releaseWakelock(sendResponse);
	} else if (message.action == "getWikiArticles") { 
		bph.generalTools.getWikiArticles(function (queries) { 
			sendResponse({queries: queries});
		});
	} else if (message.action == "checkHumanBehavior") {
		bph.cookies.get("emulateHumanSearchingBehavior", function (emulateHumanSearchingBehaviorCookieValue) { 
			sendResponse({isEnabled: emulateHumanSearchingBehaviorCookieValue == "EMULATE_HUMAN_SEARCH_BEHAVIOR.ENABLED"});
		});
	} else if (message.action == "getSearchWindowContents") { 
		sendResponse({contents: bph.searching.getSearchWindowContents()});
	} else if (message.action == "closeBPWindow") { 
		chrome.windows.remove(bpWindow.id, sendResponse);
	} else {
		// more to come
	}
	
	return true;
});