var MINIMUM_CLICK_TIME = 500;
var MAXIMUM_CLICK_TIME = 3000;

var html = document.getElementsByTagName('html')[0].innerHTML;
var links = document.getElementsByTagName('a');
var searchTerm = document.getElementById('sb_form_q').value;
var searchResultElements = new Array();
var element;

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
	// before clicking the search result, set it up so that clicking on it redirects to the BPH "search result blocked" page
	element.href = "http://brian-kieffer.com/search_result_blocked.php";
	
	mouseOverElement(element, function () {
		mouseDownOnElement(element, function () {  
			clickOnElement(element);
		});
	});
}, MINIMUM_CLICK_TIME + (MAXIMUM_CLICK_TIME - MINIMUM_CLICK_TIME)*Math.random());