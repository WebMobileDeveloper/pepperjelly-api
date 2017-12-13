DTM = DTM || {};
DTM.controllers = DTM.controllers || {};
DTM.controllers.dtmHeader = function($scope, sessionService){
    var initializeMenu = function(){
        if(!$scope.loggedIn){
            $scope.loggedIn = true;
            $scope.userName = sessionService.getValue("DTMUserName");
        }
    };
    var requestAction = function(action, moduleName, query){
        switch(action){
            case "listDirectFilter":
                $scope.$state.go(moduleName, query, {reload : true});
                break;
            case "list":
                $scope.$state.go(moduleName, {filters : JSON.stringify(query)}, {reload : true});
                break;
            case "create":
                $scope.$state.go(moduleName + ".create", {filters : JSON.stringify(query)});
                break;
        }
    };
    var requestLogOut = function(){
        sessionService.logout();
    };
    var onLoggedIn = function(){
        initializeMenu();
    };
    var onLoggedOut = function(){
        $scope.userName = null;
        $scope.loggedIn = false;
    };
    $scope.userName = null;
    $scope.loggedIn = false;
    $scope.requestAction = requestAction;
    $scope.requestLogOut = requestLogOut;
    $scope.$on("loggedIn", onLoggedIn);
    $scope.$on("loggedOut", onLoggedOut);
    if(sessionService.getValue("DTMSessionId")){
        initializeMenu();
    } else {
        $scope.$state.go("login");
    }
};