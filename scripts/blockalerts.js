var bph = (bph || {}); // this file is injected into tabs, so we need to redefine bph

bph.externalTools = (function () {
	var externalTools = {};

	externalTools.confirm = window.confirm;
	externalTools.alert = window.alert;
	
	// overwrite the standard confirm/alert methods
	window.confirm = function (msg) { 
		console.log('confirm alert blocked. msg: ' + msg);
		return false;
	};

	window.alert = function (msg) { 
		console.log('classic alert blocked. msg: ' + msg);
		return false;
	};
	
	return externalTools;
})();