var MINIMUM_CLICK_TIME = 500;
var MAXIMUM_CLICK_TIME = 3000;

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

// pick a random element
element = searchResultElements[Math.floor(searchResultElements.length * Math.random())];

setTimeout(function () {
	var IG = html.substring(html.indexOf(",IG") + 5, html.indexOf(",EventID") - 1);
	var ID = element.getAttribute('h').substring(3, element.getAttribute('h').length);
	var url = element.getAttribute('href');
	var isMobileSearch = (html.indexOf("<meta name=\"mobileoptimized\"") != -1);
	var SUIH, redir, url;
	
	// if the url that is clicked on is on the bing.com domain, change the url to a relative one
	if (url.indexOf("bing.com") != -1) { 
		url = url.substring(url.indexOf("bing.com") + 8, url.length);
	}
	
	// compute the analytics ping URL
	if (isMobileSearch) { 
		// there are some extra variables to compute in the case of mobile searches
		var temp = btoa(element.getAttribute("href")).replace("+", "-").replace("/", "_");
		redir = temp.substring(0, temp.indexOf("="));
		SUIH = html.substring(html.indexOf("SUIH") + 6, html.indexOf("\",gpUrl"));
		url = "https://www.bing.com/fd/ls/GLinkPing.aspx?IG=" + IG + "&&ID=" + ID + "&SUIH=" + SUIH + "&redir=" + redir;
	} else {
		url = "https://www.bing.com/fd/ls/GLinkPing.aspx?IG=" + IG + "&&ID=" + ID + "&url=" + encodeURIComponent(url);
	}
	
	// before clicking the search result, set it up so that clicking on it redirects to the BPH "search result blocked" page
	element.href = "http://brian-kieffer.com/search_result_blocked.php";
	
	// emulate an analytics ping and click on the result
	$.ajax({
		url: url,
		success: function (data) { 
			console.log('ping sent successfully. clicking on result.');
			element.click();
		},
		error: function (data) { 
			// I guess click on the result anyway if the ping fails
			element.click();
		}
	});
}, MINIMUM_CLICK_TIME + (MAXIMUM_CLICK_TIME - MINIMUM_CLICK_TIME)*Math.random());