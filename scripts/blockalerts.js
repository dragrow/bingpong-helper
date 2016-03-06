bph.externalTools = (function () {
	var et = {};

	et.confirm = window.confirm;
	et.alert = window.alert;
	
	// overwrite the standard confirm/alert methods
	window.confirm = function (msg) { 
		console.log('confirm alert blocked. msg: ' + msg);
		return false;
	};

	window.alert = function (msg) { 
		console.log('classic alert blocked. msg: ' + msg);
		return false;
	};
	
	return et;
})();