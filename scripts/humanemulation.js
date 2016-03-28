var bph = (bph || {}); // this file is injected into tabs, so we need to redefine bph

bph.humanEmulation = (function () { 
	var humanEmulation = {};
	
	humanEmulation.clickOnElement = function (el) { 
		var r = el.getBoundingClientRect();
		var evt = document.createEvent("MouseEvents");

		evt.initMouseEvent('click', true, true, window, null, r.right, r.top, r.right, r.top, false, false, false, false, 0, null);

		el.dispatchEvent(evt);
	}

	humanEmulation.mouseOverElement = function (el, callback) { 
		var r = el.getBoundingClientRect();
		var evt = document.createEvent("MouseEvents");

		evt.initMouseEvent('mouseover', true, true, window, null, r.right, r.top, r.right, r.top, false, false, false, false, 0, null);

		el.dispatchEvent(evt);
		callback();
	}

	humanEmulation.mouseDownOnElement = function (el, callback) {
		var r = el.getBoundingClientRect();
		var evt = document.createEvent("MouseEvents");

		evt.initMouseEvent('mousedown', true, true, window, null, r.right, r.top, 0, 0, false, false, false, false, 0, null);

		el.dispatchEvent(evt);
		callback();
	}

	humanEmulation.clickOnLinkWithUrl = function (url, delay, blockLoad) { 
		var links = document.getElementsByTagName('a');
		
		for (var i = 0; i < links.length; i++) { 
			if (links[i].href == url) { 
				bph.humanEmulation.mouseOverElement(links[i], function () { 
					bph.humanEmulation.mouseDownOnElement(links[i], function () { 
						setTimeout(function () { 
							if (blockLoad) { 
								links[i].href = "javascript:void(0);";
							}
							
							bph.humanEmulation.clickOnElement(links[i]);
						}, delay);
					});
				});
				break;
			}
		}
	}

	humanEmulation.emulateMouseMovement = function (xFrom, yFrom, xTo, yTo, movementLength, movementDelay, callback) {
		if ((xFrom == xTo && yFrom == yTo) || movementLength < movementDelay) { 
			callback();
		} else {
			var evt = document.createEvent("MouseEvents");
			var percentComplete = 0;
			var movePointer;

			// move in a linear fashion from (xFrom, yFrom) to (xTo, yTo)
			movePointer = function () { 
				percentComplete += movementDelay/movementLength;

				if (percentComplete >= 1) {
					newX = xTo;
					newY = yTo;
					callback();
					console.log('done moving mouse.');
				} else {
					newX = xFrom + percentComplete*(xTo - xFrom);
					newY = yFrom + percentComplete*(yTo - yFrom);
					setTimeout(movePointer, movementDelay);
				}
				
				console.log('moved to (' + newX + ', ' + newY + ').');
				evt.initMouseEvent('mousemove', true, true, window, null, newX, newY, newX, 0, false, false, false, false, 0, null);
				document.body.dispatchEvent(evt);
			};
			
			movePointer();
		}
	}
	
	return humanEmulation;
})();