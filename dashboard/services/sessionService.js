var DTM = DTM || {};
DTM.services = DTM.services || {};
DTM.services.sessionService = function($resource, $cookieStore, $rootScope){
    var postProcessor = function(data){
        try {
            data = JSON.parse(data);
        } catch(err){
            return {"error" : "Problem getting valid JSON: " + err + " - " + data};
        }
        return data;
    };
    var getCurrentSessionId = function(){
        return $cookieStore.get("DTMSessionId");
    };
    var resourceElements = {};
    var actions = {
        "post" : {method : "POST", transformResponse : postProcessor, headers : {"Authorization" : getCurrentSessionId}}
    };
    var resource = $resource("." + "/admin/:action", resourceElements, actions);
    var login = function(loginModel){
        var query = {
            action : "login"
        };
        var body = {
            userName : loginModel.userName,
            password : loginModel.password
        };
        return resource.post(query, body).$promise
            .then(function(newSession){
                if(newSession.authToken){
                    $cookieStore.put("DTMUserName", loginModel.userName);
                    $cookieStore.put("DTMUserId", newSession.user._id);
                    $cookieStore.put("DTMSessionId", newSession.authToken);
                    $rootScope.$broadcast("loggedIn");
                } else {
                    $cookieStore.remove("DTMUserName");
                    $cookieStore.remove("DTMUserId");
                    $cookieStore.remove("DTMSessionId");
                    return newSession.error;
                }
            });
    };
    var logout = function(){
        var query = {
            action : "logout"
        };
        return resource.post(query, {}).$promise
            .then(function(){
                $cookieStore.remove("DTMUserName");
                $cookieStore.remove("DTMUserId");
                $cookieStore.remove("DTMSessionId");
                $rootScope.$broadcast("loggedOut");
                $rootScope.$state.go("login");
            });
    };
    var getValue = function(valueName){
        var value = $cookieStore.get(valueName);
        if((valueName != "DTMSessionId") || (value && valueName == "DTMSessionId")){
            return value;
        } else {
            return null;
        }
    };
    return {
        login : login,
        logout : logout,
        getValue : getValue
    };
};