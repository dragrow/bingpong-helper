var BUTTON_CLICK_DELAY = 5000;

var links = document.getElementsByTagName('a');
var searchTerm = document.getElementById('sb_form_q').value;
var searchResultElements = new Array();

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

for (var i = 0; i < links.length; i++) { 
	if (links[i].innerHTML === "2") {
		// click it
		setTimeout(function () {
			links[i].click();
		}, BUTTON_CLICK_DELAY);
		break;
	}
}