DTM = DTM || {};
DTM.controllers = DTM.controllers || {};
DTM.controllers.login = function($scope, sessionService) {
    var loginProxy = function () {
        $scope.loading = true;
        $scope.sessionError = null;
        sessionService.login($scope.loginModel)
            .then(function (result) {
                $scope.loading = false;
                if (result) {
                    $scope.sessionError = (result.error && result.error[0] && result.error[0].msg) ? result.error[0].msg : result.error;
                } else {
                    $scope.show = false;
                    $scope.$state.go("start");
                }
            }).catch(function(error){
                $scope.loading = false;
                error = (error.data) ? error.data : error;
                if (error) {
                    $scope.sessionError = (error.error && error.error[0] && error.error[0].msg) ? error.error[0].msg : error.error;
                }
            });
    };
    $scope.show = false;
    $scope.sessionError = null;
    $scope.loading = false;
    $scope.loginModel = {
        userName: "",
        password: ""
    };
    $scope.loginProxy = loginProxy;
    if(sessionService.getValue("DTMSessionId")) {
        $scope.$state.go("start");
    } else {
        $scope.show = true;
    }
};