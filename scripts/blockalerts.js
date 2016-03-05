bph.externalTools = (function () {
	var et = {};

	et.bpConfirm = window.confirm;
	et.bpAlert = window.alert;
	
	return et;
})();

// overwrite the standard confirm/alert methods
window.confirm = function (msg) { 
	console.log('confirm alert blocked. msg: ' + msg);
	return false;
};

window.alert = function (msg) { 
	console.log('classic alert blocked. msg: ' + msg);
	return false;
};