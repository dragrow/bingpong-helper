chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
	if (tab.url.indexOf("bing-pong.com") != -1 || tab.url.indexOf("bingpong.net") != -1 || tab.url.indexOf("bing.com") != -1 || tab.url.indexOf("live.com") != -1 || tab.url.indexOf("msn.com") != -1) { 
		chrome.pageAction.show(tabId);
	}
});