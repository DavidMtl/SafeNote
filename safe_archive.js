$( document ).ready(function() {
	document.getElementById("refresh_button").addEventListener("click", function(){
		refresh();
	});

	document.getElementById("sync_button").addEventListener("click", function(){
		sync_with_safe();
	});

	document.getElementById("reset_auth_button").addEventListener("click", function(){
		authorize(true);
	});

	function createPublicFolder() {
	}

	function authorize(force=false) {
		if (!localStorage["token"] || force) {
			enable_buttons(false);
			auth(POST).then(function(success_text) {
				enable_buttons(true);
				log("Authorized");
			}).catch(function(error_text) {
				enable_buttons(true);
				log("Authorization error:" + error_text);
			});
		}
	}

	function save_on_safe(id) {
		enable_buttons(false);
		$("#safenote_" + id).removeClass("saved_on_safe");
		document.getElementById("busy_" + id).style.display = 'block';

		log("["+id+"]" + "Deleting old file...");
		nfsFile(DELETE,id).then(function(success_text) {
			log("["+id+"]" + "Creating new file...");
			nfsFile(POST,id, localStorage[id]).then(function(success_text) {
				log("["+id+"]" + "File created");
				$("#safenote_" + id).addClass("saved_on_safe");
				set_saved_on_safe(id, true);
				document.getElementById("busy_" + id).style.display = 'none';
				enable_buttons(true);
			}).catch(function(error_text) {
				log("["+id+"]" + "File creation error:" + error_text);
				document.getElementById("busy_" + id).style.display = 'none';
				enable_buttons(true);
			});
		}).catch(function(error_text) {
			nfsFile(POST,id, localStorage[id]).then(function(success_text) {
				log("["+id+"]" + "File created");
				$("#safenote_" + id).addClass("saved_on_safe");
				set_saved_on_safe(id, true);
				document.getElementById("busy_" + id).style.display = 'none';
				enable_buttons(true);
			}).catch(function(error_text) {
				log("["+id+"]" + "File creation error:" + error_text);
				document.getElementById("busy_" + id).style.display = 'none';
				enable_buttons(true);
			});
		});
	}

	function delete_on_safe(id) {
	  	log("["+id+"]" + "Deleting file...");
	  	enable_buttons(false);
	  	document.getElementById("busy_" + id).style.display = 'block';
	  	nfsFile(DELETE,id).then(function(success_text) {
	  		log("["+id+"]" + "File deleted");
	  		enable_buttons(true);
	  		refresh();
	  	}).catch(function(error_text) {
	  		log("["+id+"]" + "File deletion error:" + error_text);
	  		enable_buttons(true);
	  		refresh();
	  	});
    }

	function refresh() {
		var safenotes = get_local_safenotes();
		var safenote_count = safenotes.length;
		var node = document.getElementById('safe_archive_table');
		if (node) {
			node.parentNode.removeChild(node);
		}

		$.get(chrome.extension.getURL('/safe_archive_table.html'), function(data) {
			$(data).appendTo('#safenote_list');

			var template = $('#hidden-template').html();
			for (var i = 0; i < safenote_count; i++) {
				var safenote = safenotes[i];
				var tbody = $("#safe_archive_table").find('tbody');
				var item = $(template).clone();
				$(item).find('.safenote_url').html(safenote.url);
				$(item).find('.safenote_url').attr("href", safenote.url);
				$(item).find('.safenote_url').attr("id","safenote_"+safenote.id);
				$(item).find('.safenote_busy').attr("id","busy_"+safenote.id);
				$(item).find('.safenote_content').html(safenote.content);
				$(item).find('.safenote_checkbox').prop("id",safenote.id);
				$(item).find('.save_button').attr("value",safenote.id);
				$(item).find('.save_button').click(function() {
			    	save_on_safe(this.value);
				});
				$(item).find('.delete_button').attr("value",safenote.id);
				$(item).find('.delete_button').click(function() {
					if (confirm('Are you sure you want to delete this note?')) {
						localStorage.removeItem(this.value);
						delete_on_safe(this.value);
					}
				});

				if (safenote.is_saved_on_safe) {
					(item).find('.safenote_url').addClass("saved_on_safe");
				}
				tbody.append(item);
			}
		});
	}

	function sync_with_safe() {
		enable_buttons(false);
		nfsDirectory(GET,"").then(function(success_text) {
			var files = JSON.parse(success_text).files;

			var file_count = files.length;
			var promises = [];
			for (var i = 0; i < file_count; i++) {
				var filename = files[i].name;
				promises.push(nfsFile(GET,filename));
			}

			Promise.all(promises).then(function(results) {
				files = JSON.parse("[" + results + "]");
				var file_count = files.length;
				for (var i = 0; i < file_count; i++) {
					var safenote = JSON.parse(files[i].content);
					safenote.is_saved_on_safe = true;
					localStorage[safenote.id] = JSON.stringify(safenote);
				}
				log("Sync completed: " + files.length + " file(s) updated")
				enable_buttons(true);
				refresh();
			})
			.catch(function(error) {
				enable_buttons(true);
				log("ERROR:" + error);
			});
	    }).catch(function(error_text) {
			enable_buttons(true);
	  		log("ERROR:" + error_text);
		});
	}

	function set_saved_on_safe(id, is_saved_on_safe) {
		if (localStorage[id]) {
			var record = JSON.parse(localStorage[id]);
			record.is_saved_on_safe = is_saved_on_safe;
	  		localStorage[id] = JSON.stringify(record);
		}
	}

	function get_local_safenotes() {
	    var safenotes = [],
	        keys = Object.keys(localStorage),
	        i = keys.length;

	    while ( i-- ) {
			if (keys[i] != "token") {
				var safenote = localStorage.getItem(keys[i]);
				safenotes.push(JSON.parse(safenote));
			}
	    }
	    return safenotes;
	}

	function enable_buttons(is_enable) {
		$(":button").each(function () {
			this.disabled = !is_enable;
		});
	}

	function log(message) {
		console.log(message);
		document.getElementById("log").innerHTML = message;
	}
	authorize();
	refresh();
});
