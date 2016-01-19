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

function emulateMouseMovement(xFrom, yFrom, xTo, yTo, movementLength, movementDelay, callback) {
	 
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
			evt.initMouseEvent('mousemove', true, true, window, null, newX, newY, 0, 0, false, false, false, false, 0, null);
			$('body')[0].dispatchEvent(evt);
		};
		
		movePointer();
	}
}