// block alerts
console.log('BPH: block alerts script injected.');
	
// source: http://stackoverflow.com/questions/12095924/is-it-possible-to-inject-a-javascript-code-that-overrides-the-one-existing-in-a
var s = document.createElement("script");
s.src = chrome.extension.getURL("scripts/blockalerts.js");
(document.head||document.documentElement).appendChild(s);


// jquery
console.log('jQuery injected.');

var t = document.createElement("script");
t.src = chrome.extension.getURL("scripts/jquery.js");
(document.head||document.documentElement).appendChild(t);
