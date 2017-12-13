DTM = DTM || {};
DTM.controllers = DTM.controllers || {};
DTM.controllers.start = function($scope, sessionService){
    if(!sessionService.getValue("DTMSessionId")){
        $scope.$state.go("login");
    }
};