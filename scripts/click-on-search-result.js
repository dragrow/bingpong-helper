var MINIMUM_CLICK_TIME = 500;
var MAXIMUM_CLICK_TIME = 3000;
var MINIMUM_MOUSE_MOVEMENT_TIME = 100;
var MAXIMUM_MOUSE_MOVEMENT_TIME = 500;
var MOVE_EVERY_MILLIS = 10;

var html = document.getElementsByTagName('html')[0].innerHTML;
var links = document.getElementsByTagName('a');
var searchTerm = document.getElementById('sb_form_q').value;
var searchResultElements = new Array();
var element;

function clickOnElement(el) { 
	var r = el.getBoundingClientRect();
	var evt = document.createEvent("MouseEvents");

	evt.initMouseEvent('click', true, true, window, null, r.right, r.top, r.right, r.top - document.body.scrollTop, false, false, false, false, 0, null);

	$(el)[0].dispatchEvent(evt);
}

function mouseOverElement(el, callback) { 
	var r = el.getBoundingClientRect();
	var evt = document.createEvent("MouseEvents");

	evt.initMouseEvent('mouseover', true, true, window, null, r.right, r.top, r.right, r.top - document.body.scrollTop, false, false, false, false, 0, null);

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
				newX = Math.round(xFrom + percentComplete*(xTo - xFrom));
				newY = Math.round(yFrom + percentComplete*(yTo - yFrom));
				setTimeout(movePointer, movementDelay);
			}
			
			console.log('moved to (' + newX + ', ' + newY + ').');
			evt.initMouseEvent('mousemove', true, true, window, null, newX, newY, newX, 0, false, false, false, false, 0, null);
			document.body.dispatchEvent(evt);
		};
		
		movePointer();
	}
}

// get search result links
for (var i = 0; i < links.length; i++) { 
	if (links[i].innerHTML) {
		// take each link element, get its innerHTML, and split it into "words"
		var elementWords = links[i].innerHTML.toLowerCase().split(" ");

		// do the same with the search term
		var searchTermWords = searchTerm.toLowerCase().split(" ");

		// get rid of HTML tags in the elements of elementWords
		for (var j = 0; j < elementWords.length; j++) { 
			if (elementWords[j].indexOf("<") != -1 && elementWords[j].indexOf(">") != -1) { 
				var temp = elementWords[j];
				elementWords[j] = temp.substring(0, temp.indexOf("<")) + temp.substring(temp.indexOf(">") + 1, temp.length);
			}
		}

		// check these two sets of "words" and see if there is one in common --- if there is, it is most likely a search result
		for (var j = 0; j < elementWords.length; j++) { 
			if (searchTermWords.indexOf(elementWords[j]) != -1) { 
				searchResultElements.push(links[i]);
				break;
			}
		}
	}
}

// get search result links
for (var i = 0; i < links.length; i++) { 
	if (links[i].innerHTML) {
		// take each link element, get its innerHTML, and split it into "words"
		var elementWords = links[i].innerHTML.toLowerCase().split(" ");

		// do the same with the search term
		var searchTermWords = searchTerm.toLowerCase().split(" ");

		// get rid of HTML tags in the elements of elementWords
		for (var j = 0; j < elementWords.length; j++) { 
			if (elementWords[j].indexOf("<") != -1 && elementWords[j].indexOf(">") != -1) { 
				var temp = elementWords[j];
				elementWords[j] = temp.substring(0, temp.indexOf("<")) + temp.substring(temp.indexOf(">") + 1, temp.length);
			}
		}

		// check these two sets of "words" and see if there is one in common --- if there is, it is most likely a search result
		for (var j = 0; j < elementWords.length; j++) { 
			if (searchTermWords.indexOf(elementWords[j]) != -1) { 
				searchResultElements.push(links[i]);
				break;
			}
		}
	}
}

// pick a random element
element = searchResultElements[Math.floor(searchResultElements.length * Math.random())];

setTimeout(function () {	
	/** emulate mouse movement
	*** choose a random starting point and move in a linear fashion to the search result
	***/
	var startingScreenX = Math.round(screen.width*Math.random()); // choose a random x-coordinate from those possible
	var startingScreenY = Math.round(screen.height*Math.random()); // choose a random y-coordinate from those possible
	var startingClientX = startingClientX; // the same as startingScreenX since we won't scroll to the right
	var startingClientY = startingClientY - document.body.scrollTop; // subtract off the amount we scrolled
	var elBoundingRect = element.getBoundingClientRect(); // rectangle that contains the search element
	var movementTime = MINIMUM_MOUSE_MOVEMENT_TIME + (MAXIMUM_MOUSE_MOVEMENT_TIME - MINIMUM_MOUSE_MOVEMENT_TIME)*Math.random();
	
	// emulate mouse movement
	emulateMouseMovement(startingScreenX, startingScreenY, elBoundingRect.right, elBoundingRect.top, movementTime, MOVE_EVERY_MILLIS, function () { 
		// click on the element
		mouseOverElement(element, function () {
			mouseDownOnElement(element, function () {  
				// before clicking the search result, set it up so that clicking on it redirects to the BPH "search result blocked" page
				element.href = "http://brian-kieffer.com/search_result_blocked.php";
				
				// click on it
				clickOnElement(element);
			});
		});
	});
}, MINIMUM_CLICK_TIME + (MAXIMUM_CLICK_TIME - MINIMUM_CLICK_TIME)*Math.random());