window.bpConfirm = window.confirm;
window.bpAlert = window.alert;

window.confirm = function (msg) { 
	console.log('confirm alert blocked. msg: ' + msg);
	return false;
};

window.alert = function (msg) { 
	console.log('classic alert blocked. msg: ' + msg);
	return false;
};

// prevent the requests to lsp.aspx from aborting if the search result is blocked
XMLHttpRequest.prototype.abort = function () {
	alert('blocked an attempt to cancel a XMLHttpRequest.');
}