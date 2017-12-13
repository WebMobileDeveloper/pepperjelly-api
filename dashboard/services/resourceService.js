var DTM = DTM || {};
DTM.services = DTM.services || {};
DTM.services.resourceService = function($resource, sessionService){
    var postProcessor = function(data){
        try {
            data = JSON.parse(data);
            if(data.error == "DTM - No valid session found") {
                sessionService.verify();
                return null;
            }
        } catch(err){
            return {"error" : "Problem getting valid JSON: " + err + " - " + data};
        }
        return data;
    };
    var getCurrentSessionId = function(){
        return sessionService.getValue("DTMSessionId");
    };
    var resourceElements = {};
    var actions = {
        "query" : {method : "GET", isArray:true, transformResponse : postProcessor, headers : {"Authorization" : getCurrentSessionId}},
        "get" : {method : "GET", transformResponse : postProcessor, headers : {"Authorization" : getCurrentSessionId}},
        "post" : {method : "POST", transformResponse : postProcessor, headers : {"Authorization" : getCurrentSessionId}},
        "delete" : {method : "DELETE", transformResponse : postProcessor, headers : {"Authorization" : getCurrentSessionId}}
    };
    var resource = $resource("." + "/admin/:moduleName/:resourceId/:secondaryId", resourceElements, actions);
    var publicResource = $resource("." + "/api/v1/:moduleName/:resourceId/:secondaryId", resourceElements, actions);
    var create = function(moduleName, resourceObject){
        var query = {
            moduleName : moduleName
        };
        return resource.post(query, resourceObject).$promise;
    };
    var query = function(moduleName, searchQuery, asObject) {
        searchQuery = searchQuery || {};
        for (var param in searchQuery) {
            if (searchQuery.hasOwnProperty(param) && !searchQuery[param]) {
                delete searchQuery[param];
            }
        }
        var query = searchQuery;
        query.moduleName = moduleName;
        if (asObject) {
            return resource.get(query, {}).$promise;
        } else {
            return resource.query(query, {}).$promise;
        }
    };
    var read = function(moduleName, resourceId){
        var query = {
            moduleName : moduleName,
            resourceId : resourceId
        };
        return resource.get(query, {}).$promise;
    };
    var update = function(moduleName, resourceId, resourceObject){
        var query = {
            moduleName : moduleName,
            resourceId : resourceId
        };
        return resource.post(query, resourceObject).$promise;
    };
    var remove = function(moduleName, resourceId){
        var query = {
            moduleName : moduleName,
            resourceId : resourceId
        };
        return resource.delete(query, {}).$promise;
    };
    var generic = function (method, moduleName, query, body){
        method = method || "query";
        query = query || {};
        query.moduleName = moduleName;
        body = body || {};
        return resource[method](query, body).$promise;
    };
    var genericPublic = function(method, moduleName, query, body){
        "use strict";
        method = method || "query";
        query = query || {};
        query.moduleName = moduleName;
        body = body || {};
        return publicResource[method](query, body).$promise;
    };
    return {
        create : create,
        query : query,
        read : read,
        update : update,
        remove : remove,
        generic : generic,
        genericPublic : genericPublic
    };
};