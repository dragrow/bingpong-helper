// constants
var DASHBOARD_TASK_CLICK_DELAY = 2000;
var TASK_TO_DASHBOARD_DELAY = 6000;
var FIRST_TASK_ATTEMPT_DELAY = 10000;
var DASHBOARD_TASK_LOAD_TIME_LIMIT = 10000;

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
									
									chrome.tabs.onUpdated.addListener(listener = function (tabId, changeInfo, tab) { // listen for activity in the dashboard task tab
										if (tabId === taskTab.id && changeInfo.url.indexOf("bing.com") === -1) { // a non-Bing URL was found in the tab, or an attempt to use a non-HTTP/S protocol was detected
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