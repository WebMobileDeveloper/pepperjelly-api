DTM = DTM || {};
DTM.controllers = DTM.controllers || {};
DTM.controllers.dishDetail = function($scope, sessionService, resourceService, $state, $stateParams){
    if(!sessionService.getValue("DTMSessionId")){
        $scope.$state.go("login");
    }
    var moduleName = "dish";
    var loadCategories = function(){
        $scope.categories = [];
        resourceService.genericPublic("get", "categories").then(function(result){
            $scope.categories = result.categories.map(function(item){ return item.name; });
        }).catch(function(err){
            $scope.loading = false;
            $scope.loadingError = err;
        });
    };
    var loadResource = function(resourceId){
        $scope.loading = true;
        $scope.loadingError = null;
        resourceService.read(moduleName, resourceId).then(function(result){
            $scope.loading = false;
            $scope.dish = result;
        }).catch(function(err){
            $scope.loading = false;
            $scope.loadingError = err;
        });
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
                        if(overrideModule != moduleName){
                            loadResource($stateParams.resourceId);
                        } else {
                            $scope.$state.go(overrideModule);
                        }
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
        if(content && content instanceof Array){
            return content.join(", ");
        } else {
            return (content) ? content : "-";
        }
    };
    var removeImage = function(index){
        $scope.dish.image.splice(index, 1);
    };
    var addImage = function(){
        $scope.dish.image.push({url : "http://", height : 0, width : 0});
    };
    var getImageSizes = function(index){
        var url = $scope.dish.image[index].url;
        var image = new Image();
        //$scope.dish.image[index].height = 0;
        //$scope.dish.image[index].width = 0;
        image.onload = function(){
            $scope.dish.image[index].height = image.height;
            $scope.dish.image[index].width = image.width;
        };
        image.src = url;
    };
    $scope.currentAction = $state.current.name.split(".")[1];
    $scope.loading = false;
    $scope.loadingError = null;
    $scope.dish = {image:[]};
    $scope.categories = [];
    $scope.displayAction = displayAction;
    $scope.requestAction = requestAction;
    $scope.save = save;
    $scope.cancelSave = cancelSave;
    $scope.displayFlag = displayFlag;
    $scope.checkContent = checkContent;
    $scope.removeImage = removeImage;
    $scope.addImage = addImage;
    $scope.getImageSizes = getImageSizes;
    loadCategories();
    if($scope.currentAction != "create"){
        loadResource($stateParams.resourceId);
    } else {
        $scope.dish.status = "unfiltered";
        $scope.dish.image.push({url:null, height:0, width:0});
        if($stateParams.restaurantId){
            $scope.dish.restaurantId = $stateParams.restaurantId;
        }
    }
};