var BUTTON_CLICK_DELAY = 5000;

var links = document.getElementsByTagName('a');

function clickOnElement(el) { 
	var r = el.getBoundingClientRect();
	var evt = document.createEvent("MouseEvents");

	evt.initMouseEvent('click', true, true, window, null, r.right, r.top, 0, 0, false, false, false, false, 0, null);

	$(el)[0].dispatchEvent(evt);
}

function mouseOverElement(el, callback) { 
	var r = el.getBoundingClientRect();
	var evt = document.createEvent("MouseEvents");

	evt.initMouseEvent('mouseover', true, true, window, null, r.right, r.top, 0, 0, false, false, false, false, 0, null);

	$(el)[0].dispatchEvent(evt);
	callback();
}

function mouseDownOnElement(el, callback) {
	var r = el.getBoundingClientRect();
	var evt = document.createEvent("MouseEvents");

	evt.initMouseEvent('mousedown', true, true, window, null, r.right, r.top, 0, 0, false, false, false, false, 0, null);

	$(el)[0].dispatchEvent(evt);
	callback();
}

for (var i = 0; i < links.length; i++) { 
	if (links[i].innerHTML.indexOf("Next") != -1) {
		// click it
		setTimeout(function () {
			mouseOverElement(links[i], function () {
				mouseDownOnElement(links[i], function () {  
					clickOnElement(links[i]);
				});
			});
		}, BUTTON_CLICK_DELAY);
		break;
	}
}