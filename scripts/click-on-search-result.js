if (bph.humanEmulation) { 	
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
		bph.humanEmulation.emulateMouseMovement(startingScreenX, startingScreenY, elBoundingRect.right, elBoundingRect.top, movementTime, MOVE_EVERY_MILLIS, function () { 
			// click on the element
			bph.humanEmulation.mouseOverElement(element, function () {
				bph.humanEmulation.mouseDownOnElement(element, function () {  
					// before clicking the search result, set it up so that clicking on it redirects to the BPH "search result blocked" page
					element.href = "http://dragrow.net/search_result_blocked.php";
					
					// click on it
					bph.humanEmulation.clickOnElement(element);
				});
			});
		});
	}, MINIMUM_CLICK_TIME + (MAXIMUM_CLICK_TIME - MINIMUM_CLICK_TIME)*Math.random());
} else {
	throw "Exception: humanEmulation.js was not injected before using bph.humanEmulation.*";
}