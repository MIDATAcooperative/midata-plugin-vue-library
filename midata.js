/*
 * Copyright 2020 Midata Genossenschaft
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import Axios from 'axios';

let service = {};

var apiParamsSerializer = function (params) {
    var parts = [];
    for (var key in params) {
      if (params.hasOwnProperty(key)) {
        var obj = params[key];
        if (Array.isArray(obj)) {
          for (var idx = 0; idx < obj.length; idx++) {
            parts.push(key + '=' + encodeURIComponent(obj[idx]));
          }
        } else {
          parts.push(key + '=' + encodeURIComponent(obj));
        }
      }
    }
    return parts.join('&');
};


var actionChain = Promise.resolve();

var domain = function (url) {
    if (!url || url == "localhost") return "localhost";
    return url.split("/")[2].split(":")[0];
}
var fhirVersion = "4.0";

let baseurl = null;
let isDebug = true;

service.setBaseurl = function(url) {
  if (baseurl == null) {
    baseurl = url;
    if (baseurl == "https://localhost") baseurl = "https://localhost:9000";
    service.baseurl = url;
    isDebug = isDebug && url !== "http://localhost:9001";
    if (isDebug) makeDebug();
  }
};

if (typeof window !== "undefined" && window && window.location && window.location.hostname) {
    let host = window.location.hostname;
    isDebug = false;
    service.setBaseurl("https://" + ((host == "localhost") ? domain(document.referrer) : host));
} 

var debug = function (name, fkt) {
    return function () {
        console.log("call", name, [].slice.apply(arguments));
        var result = fkt.apply(this, arguments);
        if (result && result.then) {
            result.then(function (r) {
                console.log("success[" + r.status + "]", name, r.data);
            }, function (r) {
                console.log("fail[" + r.status + "]", name, r.data);
            });
        }
        return result;
    };
};
var single = false;

service.setSingleRequestMode = function (enable) {
    single = enable;
};

var exec = function (func, alwayssingle) {
    if (single || alwayssingle) {
        actionChain = actionChain.then(func, func);
        return actionChain;
    } else {
        return func();
    }
};

var unpackBundle = function (promise) {
    return promise.then(function (result) {
        if (result.data && result.data.entry) {
            var resultArray = [];
            result.data.entry.forEach(function (item) {
                resultArray.push(item.resource);
            });
            return resultArray;
        } else {
            return [];
        }
    });
};

var mimeType = function () {
    return "application/fhir+json; fhirVersion=" + fhirVersion;
}

service.setFhirVersion = function (version) {
    fhirVersion = version;
};


/**
 * Get summary of records. See developer guide
 */
service.getSummary = function (level, properties, fields) {
    var data = { "authToken": service.authToken, "properties": (properties || {}), "summarize": level.toUpperCase(), "fields": (fields || []) };
    return exec(function () { return Axios.post(baseurl + "/v1/plugin_api/records/summary", data); });
};

/**
 * Get configuration stored for current plugin
 */
service.getConfig = function () {
    var data = { "authToken": service.authToken };
    return exec(function () { return Axios.post(baseurl + "/v1/plugin_api/config/get", data); });
};

/**
 * Get surplus parameters returned from OAuth authentication
 */
service.getOAuthParams = function () {
    var data = { "authToken": service.authToken };
    return exec(function () { return Axios.post(baseurl + "/v1/plugin_api/oauth/get", data); });
};

/**
 * Store configuration for current plugin
 */
service.setConfig = function (config, autoimport) {
    var data = { "authToken": service.authToken, "config": config };
    if (autoimport !== undefined) data.autoimport = autoimport;
    return exec(function () { return Axios.post(baseurl + "/v1/plugin_api/config/set", data); });
};

/**
 * Clone this plugin instance with changed configuration and name
 */
service.cloneAs = function (name, config) {
    var data = { "authToken": service.authToken, "name": name, "config": config };
    return exec(function () { return Axios.post(baseurl + "/v1/plugin_api/clone", data); });
};

/**
 * Lookup coding information on server
 */
service.searchCoding = function (properties, fields) {
    var data = { "authToken": service.authToken, "properties": properties, "fields": fields };
    return Axios.post(baseurl + "/v1/plugin_api/coding/search", data);
};

/**
 * Lookup content type information on server
 */
service.searchContent = function (properties, fields) {
    var data = { "authToken": service.authToken, "properties": properties, "fields": fields };
    return Axios.post(baseurl + "/v1/plugin_api/content/search", data);
};

/**
 * Execute OAuth2 GET request on target server using MIDATA authorization
 */
service.oauth2Request = function (url, method, body) {
    var data = { "authToken": service.authToken, "url": url, "method": (method || "get") };
    if (body) data.body = body;

    return exec(function () { return Axios.post(baseurl + "/v1/plugin_api/request/oauth2", data); });
};

/**
 * Execute OAuth1 GET request on target server using MIDATA authorization
 */
service.oauth1Request = function (url) {
    var data = { "authToken": service.authToken, "url": url };

    return exec(function () { return Axios.post(baseurl + "/v1/plugin_api/request/oauth1", data); });
};

/**
 * Uses FHIR API to create a resource
 */
service.fhirCreate = function (resource) {
    return exec(function () {
        console.log("XX");
         console.log(resource);
         //return Promise.resolve();
        return Axios({
            method: "POST",
            url: baseurl + "/fhir/" + resource.resourceType,
            headers: { "Authorization": "Bearer " + service.authToken, "Prefer": "return=representation", "Content-Type": mimeType(), "Accept": mimeType() },
            data: resource
        });
    });
};

/**
 * Uses FHIR API to update a resource
 */
service.fhirUpdate = function (resource) {
    return exec(function () {
        return Axios({
            method: "PUT",
            url: baseurl + "/fhir/" + resource.resourceType + "/" + resource.id,
            headers: { "Authorization": "Bearer " + service.authToken, "Prefer": "return=representation", "Content-Type": mimeType(), "Accept": mimeType() },
            data: resource
        });
    });
};

/**
 * Uses FHIR READ or VREAD (if version given)
 */
service.fhirRead = function (resourceType, id, version) {
    return exec(function () {
        return Axios({
            method: "GET",
            url: baseurl + "/fhir/" + resourceType + "/" + id + (version !== undefined ? "/_history/" + version : ""),
            headers: { "Authorization": "Bearer " + service.authToken, "Accept": mimeType() }
        });
    });
};

/**
 * Uses FHIR SEARCH
 */
service.fhirSearch = function (resourceType, params, unbundle) {    
    var result = exec(function () {
        return Axios({
            method: "GET",
            url: baseurl + "/fhir/" + resourceType,
            headers: { "Authorization": "Bearer " + service.authToken, "Accept": mimeType() }, 
            params : params,
            paramsSerializer : apiParamsSerializer           
        });
    });
    return unbundle ? unpackBundle(result) : result;
};

service.lastn = function (params, unbundle) {
    var result = exec(function () {
        return Axios({
            method: "GET",
            url: baseurl + "/fhir/Observation/$lastn",
            headers: { "Authorization": "Bearer " + service.authToken, "Accept": mimeType() },
            params: params
        });
    });
    return unbundle ? unpackBundle(result) : result;
};

/**
 * Use FHIR batch or transaction
 */
service.fhirTransaction = function (bundle) {
    return exec(function () {
        return Axios({
            method: "POST",
            url: baseurl + "/fhir",
            headers: { "Authorization": "Bearer " + service.authToken, "Content-Type": mimeType(), "Accept": mimeType() },
            data: bundle
        });
    }, true);
};

service.errorMsg = function(err) {
   let r = err.response;
   if (r) {
      if (r.data && r.data.issue && r.data.issue.length) return r.data.issue[0].diagnostics;
   } else return ""+err;
};

function makeDebug() {
    service.getSummary = debug("getSummary", service.getSummary);
    service.getConfig = debug("getConfig", service.getConfig);
    service.getOAuthParams = debug("getOAuthParams", service.getOAuthParams);
    service.setConfig = debug("setConfig", service.setConfig);
    service.cloneAs = debug("cloneAs", service.cloneAs);
    service.searchCoding = debug("searchCoding", service.searchCoding);
    service.searchContent = debug("searchContent", service.searchContent);
    service.oauth2Request = debug("oauth2Request", service.oauth2Request);
    service.oauth1Request = debug("oauth1Request", service.oauth1Request);
    service.fhirCreate = debug("fhirCreate", service.fhirCreate);
    service.fhirRead = debug("fhirRead", service.fhirRead);
    service.fhirUpdate = debug("fhirUpdate", service.fhirUpdate);
    service.fhirSearch = debug("fhirSearch", service.fhirSearch);
    service.lastn = debug("lastn", service.lastn);
    service.fhirTransaction = debug("fhirTransaction", service.fhirTransaction);    
}

export default service;
