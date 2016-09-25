var current_url;
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById("current_note").addEventListener("input", function(){
        document.getElementById("current_note").style.color = "#ffffff";
        chrome.runtime.sendMessage({
          from:    'content',
          subject: 'auto_local_save',
          content:document.getElementById("current_note").value,
          url:current_url
        });
    });

    document.getElementById("save_button").addEventListener("click", function(){
        getCurrentTabUrl(function(url) {
            chrome.runtime.sendMessage({
                from:    'content',
                subject: 'open_safe_archive'
            });
        });
    });

    getCurrentTabUrl(function(url) {
        current_url = url;
        document.getElementById('status').innerHTML = url;
        var id = url.hashCode();
        if (localStorage[id]) {
            var safenote = JSON.parse(localStorage[id]);
            document.getElementById('current_note').value = safenote.content;
            if (safenote.is_saved_on_safe) {
                document.getElementById("current_note").style.color = "#7FD0FF";
            } else {
                document.getElementById("current_note").style.color = "#ffffff";
            }
        }
    });
});

function getCurrentTabUrl(callback) {
    var queryInfo = {
        active: true,
        currentWindow: true
    };
    chrome.tabs.query(queryInfo, function(tabs) {
        var tab = tabs[0];
        var url = tab.url;
        console.assert(typeof url == 'string', 'tab.url should be a string');
        callback(url);
    });
}

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
