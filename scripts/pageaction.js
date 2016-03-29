chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
	if (tab.url.indexOf("network-zone.org") != -1 || tab.url.indexOf("dragrow.net") != -1 || tab.url.indexOf("bing.com") != -1 || tab.url.indexOf("live.com") != -1 || tab.url.indexOf("msn.com") != -1) { 
		chrome.pageAction.show(tabId);
	}
});