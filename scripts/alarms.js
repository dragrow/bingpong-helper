bph.alarms = (function () { 
	function createAutoRunAlarm() { 
		// set an alarm that'll open Dragrow Tools at the required time
		bph.cookies.get("autoRunTime", function (autoRunTimeCookieValue) { 
			var date = new Date();
			nextRunTime = date.getTime(); // start with the current time
			nextRunTime	-= date.getMilliseconds();
			nextRunTime -= 1000*date.getSeconds();
			nextRunTime -= 1000*60*date.getMinutes();
			nextRunTime -= 1000*60*60*date.getHours(); // normalize the time to midnight
			nextRunTime += 1000*60*60*autoRunTimeCookieValue; // set the next run time to the user requested value
			
			if (nextRunTime < date.getTime()) { // today's run would have been in the past
				// schedule the alarm for the next day
				nextRunTime += 1000*60*60*24;
			}
			
			// set the alarm at the requested time with a period of 24 hours
			chrome.alarms.create("bpAutoRun_notification", {when: nextRunTime - 1000*60*10, periodInMinutes: 24*60}); // notify the user 10 minutes in advance
			chrome.alarms.create("bpAutoRun", {when: nextRunTime, periodInMinutes: 24*60});
		});
	}

	function _alarmListener(alarm) { 
		if (alarm.name === "bpAutoRun_notification") { // notification alarm
			// notify the user that Dragrow Tools is about to run
			chrome.notifications.create("run_notification", {
				type: "basic", 
				iconUrl: "bp128.png", 
				title: "Dragrow Tools will automatically run in a moment.",
				message: ""
			});
		}
		
		if (alarm.name === "bpAutoRun") { // auto-run alarm
			// open up Dragrow Tools in a minimized window
			bph.openBrowserWindow("http://dragrow.net/index.php?runonpageload=1", function (window, tab) {});
		}
	}

	// check for the auto-run option on extension load, and set the alarms and listener if found
	bph.cookies.get("autoRunOption", function (autoRunOptionCookieValue) { 
		if (autoRunOptionCookieValue === "AUTO_RUN.ENABLED") { 
			chrome.alarms.onAlarm.addListener(alarmListener);
			chrome.alarms.clearAll(createAutoRunAlarm);
		}
	});

	chrome.storage.onChanged.addListener(function (changes, areaName) { 
		if (changes["autoRunOption"]) { 
			if (changes["autoRunOption"]["newValue"] === "AUTO_RUN.ENABLED") {
				// note: this shouldn't conflict with the above alarms and listener, since they would be removed below
				chrome.alarms.onAlarm.addListener(_alarmListener);
				chrome.alarms.clearAll(createAutoRunAlarm);
			} else {
				chrome.alarms.clearAll();
				chrome.alarms.onAlarm.removeListener(_alarmListener);
			}
		}
	});
	
	return {
		createAutoRunAlarm: createAutoRunAlarm
	};
})();
				
			