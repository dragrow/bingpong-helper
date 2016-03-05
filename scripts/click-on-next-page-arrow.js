if (bph.humanEmulation) { 	
	var BUTTON_CLICK_DELAY = 5000;

	var links = document.getElementsByTagName('a');

	for (var i = 0; i < links.length; i++) { 
		if (links[i].innerHTML.indexOf("Next") != -1) {
			// click it
			setTimeout(function () {
				bph.humanEmulation.mouseOverElement(links[i], function () {
					bph.humanEmulation.mouseDownOnElement(links[i], function () {  
						bph.humanEmulation.clickOnElement(links[i]);
					});
				});
			}, BUTTON_CLICK_DELAY);
			break;
		}
	}
} else {
	throw "Exception: humanEmulation.js was not injected before calling bph.humanEmulation.*()";
}