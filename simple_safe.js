var APP_NAME = "Safenote";
var APP_VERSION = "1.0";
var APP_ID = APP_NAME + "_" + APP_VERSION;
var APP_VENDOR = "Dco"
var TOKEN_KEY = "token";
var PROXY_URL = "http://localhost:8100";
var STATUS_OK = 200;

// Methods
var POST = "post";
var GET = "get";
var HEAD = "head";
var DELETE = "delete";
var PUT = "put";

// Actions
var AUTH = "/auth";
var NFS_DIRECTORY = "/nfs/directory/app/";
var NFS_FILE = "/nfs/file/app/";

// Content type
var APPLICATION_JSON = "application/json"
var TEXT_PLAIN = "text/plain";

var print_readystatechange = false;

function requestFactory(method, action, contentType) {
    var request = new XMLHttpRequest();
    request.onreadystatechange = print_readystatechange ? onreadystatechange : {};
    request.open(method, PROXY_URL + action, true);
    request.setRequestHeader("Content-type", contentType);
    return request;
}

function onreadystatechange() {
	var readyState = "none";
	switch (this.readyState) {
		case 0: readyState = "request not initialized"; break;
		case 1: readyState = "server connection established"; break;
		case 2: readyState = "request received"; break;
		case 3: readyState = "processing request"; break;
		case 4: readyState = "request finished and response is ready"; break;
	}
	console.log("onreadystatechange:" + readyState + " status:" + this.status +
        " response:" + this.responseText);
}

//------------------------------------------------------------------------------
// Auth
//------------------------------------------------------------------------------
function auth(method) {
    return new Promise(function(resolve, reject){
        var request = requestFactory(method, AUTH, APPLICATION_JSON);
        request.onerror = function () { reject(this.responseText); };

        if (method == GET || method == DELETE) {
            request.onload = function() {
                this.status == STATUS_OK ? resolve(this.responseText) : reject(this.responseText);
            };
            request.setRequestHeader('Authorization', 'Bearer ' + localStorage[TOKEN_KEY]);
            request.send();
        } else if (method == POST){
            request.onload = function() {
                if (this.status == STATUS_OK) {
                    var response = JSON.parse(this.responseText);
            	    localStorage["token"] = response.token;
                    resolve(this.responseText);
                } else {
                    reject(this.responseText);
                }
            };
        	request.send(JSON.stringify(createAuthPostPayload()));
        }
    });
}

function createAuthPostPayload() {
    var payload = {
        app: {
            name: APP_NAME,
            version: APP_VERSION,
            vendor:  APP_VENDOR,
            id: APP_ID
        },
        permissions: ["SAFE_DRIVE_ACCESS"]
    };
    return payload;
}

//------------------------------------------------------------------------------
// nfs directory
//------------------------------------------------------------------------------
function nfsDirectory(method, dirPath, isPrivate) {
    return new Promise(function(resolve, reject){
        var url = NFS_DIRECTORY + encodeURIComponent(dirPath);
        var request = requestFactory(method, url, APPLICATION_JSON);
        request.onerror = function () {
            reject(this.responseText);
        };
        request.onload = function() {
            this.status == STATUS_OK ? resolve(this.responseText) : reject(this.responseText);
        };
        request.setRequestHeader('Authorization', 'Bearer ' + localStorage[TOKEN_KEY]);
        var payload = {};
        if (method == POST){
        	payload.metadata = "";
            payload.isPrivate = isPrivate;
        }
        request.send(JSON.stringify(payload));
    });
}

//------------------------------------------------------------------------------
// nfs file
//------------------------------------------------------------------------------
function nfsFile(method, filePath, content) {
    return new Promise(function(resolve, reject){
        var url = NFS_FILE + encodeURIComponent(filePath);
        var request = requestFactory(method, url, APPLICATION_JSON);
        request.onerror = function () {
            reject(this.responseText);
        };
        request.onload = function() {
            this.status == STATUS_OK ? resolve(this.responseText) : reject(this.responseText);
        };
        request.setRequestHeader('Authorization', 'Bearer ' + localStorage[TOKEN_KEY]);
        var payload = {};
        if (method == POST){
            payload.content = content;
        }
        request.send(JSON.stringify(payload));
    });
}
