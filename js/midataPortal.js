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
    

    import Midata from "./midata.js";

    var service = {};
    var height = 0;
    
    /**
     * automatically resize view in portal to fit plugin content
     */
    service.autoresize = function() {		
        window.setInterval(function() { service.resize(); return true; }, 300);
    };
    
    /**
     * manually resize view in portal to fit plugin content
     */
    service.resize = function() {		
        var newheight = window.document.documentElement.offsetHeight+"px";
        
        if (newheight !== height) {				  
          window.parent.postMessage({ type: "height", name:window.name, viewHeight : newheight }, "*");		
          height = newheight;
        }
    };
    
    /**
     * open link with URL of current plugin in new view in portal.
     */
    service.openLink = function(pos, url, params) {
        window.parent.postMessage({ type: "link", name:window.name, url:url, pos:pos, params:params }, "*");
    };
    
    /**
     * open link to different app in new view in portal.
     */
    service.openApp = function(pos, app, params) {
        window.parent.postMessage({ type: "link", name:window.name, app:app, pos:pos, params:params }, "*");
    };
    
    /**
     * change default button target of portal button
     */
    service.setLink = function(func, pos, url, params) {
        window.parent.postMessage({ type: "set", name:window.name, func:func , url:url, pos:pos, params:params }, "*");
    };
    
    /**
     * Notify portal that view can be closed
     */
    service.doneNotification = function() {
        window.parent.postMessage({ type: "close", name:window.name }, "*");
    };
    
    /**
     * Notify portal that data has changed
     */
    service.updateNotification = function() {
        window.parent.postMessage({ type: "update", name:window.name }, "*");
    };
            
    /**
     * Logged in user
     */
    service.owner = null;
    
    /**
     * Language chosen by user in portal
     */
    
    service.language = null;
    
    service.init = function($route) {       
       service.language = $route.query.lang;
       service.owner = $route.query.owner;
       Midata.authToken = $route.query.authToken;
       service.autoresize();
    };

    export default service;
