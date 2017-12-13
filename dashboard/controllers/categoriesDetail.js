"use strict";
DTM = DTM || {};
DTM.controllers = DTM.controllers || {};
DTM.controllers.categoriesDetail = function($scope, sessionService, resourceService, $state, $stateParams){
    if(!sessionService.getValue("DTMSessionId")){
        $scope.$state.go("login");
    }
    var moduleName = "categories";
    var loadResource = function(resourceId){
        $scope.loading = true;
        $scope.loadingError = null;
        resourceService.read(moduleName, resourceId).then(function(result){
            $scope.loading = false;
            $scope.categories = result;
            $scope.parentCategories = $scope.parentCategories.filter(function(item){
                return (item !== $scope.categories.name);
            });
            $scope.disableParenting = ($scope.alreadyParents.indexOf($scope.categories.name) != -1);
        }).catch(function(err){
            $scope.loading = false;
            $scope.loadingError = err;
        });
    };
    var displayAction = function(action){
        return action.charAt(0).toUpperCase() + action.slice(1);
    };
    var requestAction = function(action, resourceId, overrideModule, search){
        overrideModule = overrideModule || moduleName;
        switch(action){
            case "list":
                if(search){
                    $scope.$state.go(overrideModule, search);
                } else {
                    $scope.$state.go(overrideModule);
                }
                break;
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
                $scope.$state.go(moduleName);
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
    var checkContent = function(content){
        return (content) ? content : "-";
    };
    $scope.currentAction = $state.current.name.split(".")[1];
    $scope.loading = false;
    $scope.parentCategories = [];
    $scope.softLoading = false;
    $scope.loadingError = null;
    $scope.softError = null;
    $scope.selectResults = null;
    $scope.categories = {};
    $scope.displayAction = displayAction;
    $scope.requestAction = requestAction;
    $scope.save = save;
    $scope.cancelSave = cancelSave;
    $scope.checkContent = checkContent;
    resourceService.query("categories", {}, true).then(function(parentCategories){
        $scope.alreadyParents = parentCategories.results.filter(function(item){
            return item.parent;
        }).map(function(item){
            return item.parent;
        }).sort().filter(function(item, pos, ary) {
            return !pos || item != ary[pos - 1];
        });
        $scope.parentCategories = parentCategories.results.filter(function(item){
            return !item.parent;
        }).map(function(item){
            return item.name;
        });
        if($scope.currentAction != "create"){
            loadResource($stateParams.resourceId);
        } else {
            $scope.categories.status = "active";
        }
    }).catch(function(err){
        console.error(err);
        alert("Error loading parent categories");
    });
};