"use strict";
DTM = DTM || {};
DTM.controllers = DTM.controllers || {};
DTM.controllers.restaurantDetail = function($scope, sessionService, resourceService, $state, $stateParams){
    if(!sessionService.getValue("DTMSessionId")){
        $scope.$state.go("login");
    }
    var moduleName = "restaurant";
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
            result.password = "noPass";
            $scope.loading = false;
            $scope.restaurant = result;
            $scope.restaurant.location = $scope.restaurant.location || [0, 0];
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
            case "directImport":
                var placeId = search.placeId;
                $scope.softLoading = true;
                $scope.loadInfo = null;
                $scope.loadInfoType = null;
                $scope.selectResults = null;
                resourceService.genericPublic("post", "places", {resourceId : placeId, secondaryId : resourceId}).then(function(results){
                    $scope.loadInfoType = "result";
                    $scope.softLoading = false;
                    $scope.loadInfo = JSON.stringify(results, null, 4);
                    if(results.requestReload){
                        $scope.$state.go("restaurant.detail", {resourceId : resourceId}, {reload : true});
                    }
                }).catch(function(err){
                    $scope.softLoading = false;
                    $scope.softError = err;
                });
                break;
            case "import":
                if(confirm("Are you sure you want to import google places pictures for this restaurant?")){
                    $scope.softLoading = true;
                    $scope.loadInfo = null;
                    $scope.loadInfoType = null;
                    $scope.selectResults = null;
                    resourceService.genericPublic("get", "places", {resourceId : resourceId}).then(function(result){
                        if(result && result.places && result.places.length == 1){
                            var placeId = result.places[0].place_id;
                            $scope.loadInfoType = "result";
                            resourceService.genericPublic("post", "places", {resourceId : placeId, secondaryId : resourceId}).then(function(results){
                                $scope.softLoading = false;
                                $scope.loadInfo = JSON.stringify(results, null, 4);
                                if(results.requestReload){
                                    $scope.$state.go("restaurant.detail", {resourceId : resourceId}, {reload : true});
                                }
                            }).catch(function(err){
                                $scope.softLoading = false;
                                $scope.softError = err;
                            });
                        } else if(result && result.places && result.places.length > 1){
                            $scope.loadInfoType = "select";
                            $scope.selectResults = result.places.map(function(place){
                                return {place_id : place.place_id, name : place.name, vicinity : place.vicinity};
                            });
                            $scope.softLoading = false;
                            $scope.loadInfo = $scope.selectResults;
                        } else {
                            $scope.softLoading = false;
                            $scope.loadInfo = "No restaurants found matching name or location.";
                        }
                    }).catch(function(err){
                        $scope.softLoading = false;
                        $scope.softError = (err && err.data && err.data.error) ? err.data.error : err;
                    });
                }
                break;
        }
    };
    var save = function(){
        var op;
        $scope.loading = true;
        $scope.loadingError = null;
        if(typeof $scope[moduleName].category == "string"){
            $scope[moduleName].category = ($scope[moduleName].category.indexOf(",")) ? $scope[moduleName].category.split(",") : ($scope[moduleName].category) ? [$scope[moduleName].category] : [];
        }
        if(typeof $scope[moduleName].openingTimes == "string"){
            $scope[moduleName].openingTimes = ($scope[moduleName].openingTimes.indexOf(",")) ? $scope[moduleName].openingTimes.split(",") : ($scope[moduleName].openingTimes) ? [$scope[moduleName].openingTimes] : [];
        }
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
    var checkContent = function(content){
        if(content && content instanceof Array){
            return content.join(", ");
        } else {
            return (content) ? content : "-";
        }
    };
    $scope.currentAction = $state.current.name.split(".")[1];
    $scope.loading = false;
    $scope.softLoading = false;
    $scope.loadInfoType = null;
    $scope.loadingError = null;
    $scope.softError = null;
    $scope.loadInfo = null;
    $scope.selectResults = null;
    $scope.restaurant = {};
    $scope.categories = [];
    $scope.displayAction = displayAction;
    $scope.requestAction = requestAction;
    $scope.save = save;
    $scope.cancelSave = cancelSave;
    $scope.checkContent = checkContent;
    loadCategories();
    if($scope.currentAction != "create"){
        loadResource($stateParams.resourceId);
    } else {
        $scope.restaurant.location = [0, 0];
    }
};