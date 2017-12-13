DTM = DTM || {};
DTM.controllers = DTM.controllers || {};
DTM.controllers.userDetail = function($scope, sessionService, resourceService, $state, $stateParams){
    if(!sessionService.getValue("DTMSessionId")){
        $scope.$state.go("login");
    }
    var moduleName = "user";
    var loadResource = function(resourceId){
        $scope.loading = true;
        $scope.loadingError = null;
        resourceService.read(moduleName, resourceId).then(function(result){
            result.password = "noPass";
            $scope.loading = false;
            $scope.user = result;
        }).catch(function(err){
            $scope.loading = false;
            $scope.loadingError = err;
        });
    };
    var groupName = function(group){
        switch(+group){
            case 1: return "User"; break;
            case 2: return "Admin"; break;
        }
    };
    var displayAction = function(action){
        return action.charAt(0).toUpperCase() + action.slice(1);
    };
    var requestAction = function(action, resourceId, overrideModule){
        overrideModule = overrideModule || moduleName;
        switch(action){
            case "detail":
                $scope.$state.go(overrideModule + ".detail", {resourceId : resourceId});
                break;
            case "edit":
                $scope.$state.go(overrideModule + ".edit", {resourceId : resourceId});
                break;
            case "delete":
                if(confirm("Are you sure you want to remove PERMANENTLY this " + overrideModule + "?")){
                    $scope.loading = true;
                    resourceService.remove(overrideModule, resourceId).then(function(){
                        $scope.$state.go(overrideModule);
                    }).catch(function(err){
                        $scope.loading = false;
                        $scope.loadingError = err;
                    });
                }
                break;
            case "passwordReset":
                if(confirm("Are you sure you want to reset this user's password?")){
                    $scope.loading = true;
                    resourceService.generic("post", "passwordReset", {_id : resourceId}).then(function(){
                        $scope.$state.go(overrideModule);
                    }).catch(function(err){
                        $scope.loading = false;
                        $scope.loadingError = err;
                    });
                }
                break;
            case "solveIssue":
                if(confirm("Are you sure you want to mark this report as SOLVED?")){
                    $scope.loading = true;
                    resourceService.update(overrideModule, resourceId).then(function(){
                        loadResource($stateParams.resourceId);
                    }).catch(function(err){
                        $scope.loading = false;
                        $scope.loadingError = err;
                    });
                }
                break;
        }
    };
    var save = function(){
        var op;
        if($scope.user.password == $scope.passwordCheck){
            $scope.loading = true;
            $scope.loadingError = null;
            if($scope.currentAction == "create"){
                op = resourceService.create(moduleName, $scope[moduleName]);
            } else if($scope.currentAction == "edit"){
                var resourceId = $scope[moduleName]._id;
                delete $scope[moduleName]._id;
                op = resourceService.update(moduleName, resourceId, $scope[moduleName]);
            }
            op.then(function(result){
                $scope.loading = false;
                if($scope.currentAction == "create"){
                    $scope.$state.go(moduleName + ".detail", {resourceId : result._id});
                } else if($scope.currentAction == "edit"){
                    window.history.back();
                }
            }).catch(function(err){
                $scope.loading = false;
                $scope.loadingError = err;
            });
        } else {
            alert("Password and it's verification must be the same.");
        }
    };
    var cancelSave = function(){
        if(confirm("Any unsaved data will be lost, are you sure?")){
            window.history.back();
        }
    };
    var displayFlag = function(flag){
        return (flag === true) ? "Yes" : "No";
    };
    var checkContent = function(content){
        return (content) ? content : "-";
    };
    $scope.currentAction = $state.current.name.split(".")[1];
    $scope.loading = false;
    $scope.loadingError = null;
    $scope.user = {};
    $scope.groupName = groupName;
    $scope.displayAction = displayAction;
    $scope.requestAction = requestAction;
    $scope.save = save;
    $scope.cancelSave = cancelSave;
    $scope.displayFlag = displayFlag;
    $scope.checkContent = checkContent;
    if($scope.currentAction != "create"){
        $scope.passwordCheck = "noPass";
        loadResource($stateParams.resourceId);
    }
};