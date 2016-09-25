var safe_tab_id;
var is_safe_tab_open=false;

chrome.tabs.onRemoved.addListener(function(tab_id, removeInfo) {
	if (is_safe_tab_open && tab_id == safe_tab_id) {
		is_safe_tab_open = false;
	}
});

chrome.runtime.onMessage.addListener(function (msg, sender) {
	if ((msg.from === 'content') && (msg.subject === 'open_safe_archive')) {
		if (is_safe_tab_open) {
			chrome.tabs.update(safe_tab_id, {selected: true});
		} else {
			chrome.tabs.create({'url': chrome.extension.getURL('safe_archive.html')}, function(tab) {
				safe_tab_id = tab.id;
				is_safe_tab_open = true;
			});
		}
	} else if ((msg.from === 'content') && (msg.subject === 'auto_local_save')) {
		var safenote_id = msg.url.hashCode();
		var record;

		if (localStorage[safenote_id]) {
			record = JSON.parse(localStorage[safenote_id]);
			record.content = msg.content;
			record.url = msg.url;
			record.update = new Date().toString();
			record.is_saved_on_safe = false;
			record.id = safenote_id;
		} else {
			record = {
			  "content":msg.content,
			  "url":msg.url,
			  "created":new Date().toString(),
			  "is_saved_on_safe":false,
			  "id":safenote_id
			}
		}
		localStorage[safenote_id] = JSON.stringify(record);
	}
});


chrome.tabs.onActivated.addListener(function(info){
	chrome.tabs.get(info.tabId, function(change){
		var safenote_id = change.url.hashCode();
		if (localStorage[safenote_id]) {
			var safenote = JSON.parse(localStorage[safenote_id]);
			chrome.browserAction.setBadgeBackgroundColor({color:[50, 52, 53, 255], tabId:info.tabId});
			chrome.browserAction.setBadgeText({text:"1", tabId:info.tabId});
		} else {
			chrome.browserAction.setBadgeText({text:"", tabId:info.tabId});
		}
    });
});

chrome.tabs.onUpdated.addListener(function (tabId, change, tab){
    if(change.url == undefined){
        return;
    }
	var safenote_id = change.url.hashCode();
	if (localStorage[safenote_id]) {
		var safenote = JSON.parse(localStorage[safenote_id]);
		chrome.browserAction.setBadgeBackgroundColor({color:[50, 52, 53, 255], tabId:tabId});
		chrome.browserAction.setBadgeText({text:"1", tabId:tabId});
	} else {
		chrome.browserAction.setBadgeText({text:"", tabId:tabId});
	}
});

chrome.webNavigation.onCompleted.addListener(function(details) {
	if(details.frameId === 0) {
		chrome.tabs.getSelected(null,function(tab) {
			var safenote_id = tab.url.hashCode();
			if (localStorage[safenote_id]) {
				var safenote = JSON.parse(localStorage[safenote_id]);
				chrome.tabs.getSelected(null, function(tab) {
					chrome.tabs.sendRequest(tab.id,
						{
							callFunction: "refresh",
							is_saved_on_safe:safenote.is_saved_on_safe
						}, function(response) {});
				});
			}
		});
	}
});

String.prototype.hashCode = function() {
	var hash = 0, i, chr, len;
	if (this.length === 0) return hash;
	for (i = 0, len = this.length; i < len; i++) {
		chr   = this.charCodeAt(i);
		hash  = ((hash << 5) - hash) + chr;
		hash |= 0; // Convert to 32bit integer
	}
	return hash;
};
