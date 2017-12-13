DTM = DTM || {};
DTM.controllers = DTM.controllers || {};
DTM.controllers.dishList = function($scope, $rootScope, sessionService, resourceService, $state, $stateParams){
    "use strict";
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
    var loadList = function(resetCurrentPage){
        var query = {};
        $scope.loading = true;
        $scope.loadingError = null;
        if(resetCurrentPage){
            $scope.pagination.currentPage = 1;
        }
        if($scope.predicate){
            query.$sort = $scope.predicate;
            query.$direction = ($scope.reverse) ? 1 : -1;
        }
        query.$limit = $scope.pagination.perPage;
        query.$skip = $scope.pagination.perPage * ($scope.pagination.currentPage - 1);
        $scope.currentFilter = {};
        if($scope.filters.image){query.image = "$like|" + $scope.filters.image; $scope.currentFilter.image = true;}
        if($scope.filters.status){query.status = "$like|" + $scope.filters.status; $scope.currentFilter.status = true;}
        if($scope.filters.rating){query.rating = "$gte|" + $scope.filters.rating; $scope.currentFilter.rating = true;}
        if($scope.filters.restaurantId){query.restaurantId = $scope.filters.restaurantId; $scope.currentFilter.restaurantId = true;}
        if($scope.filters.categories && $scope.filters.categories.length > 0){query.categories = "$in|" + $scope.filters.categories.join(","); $scope.currentFilter.categories = true;}
        if($scope.filters.userId){query.userId = $scope.filters.userId; $scope.currentFilter.userId = true;}
        resourceService.query(moduleName, query, true).then(function(result){
            $scope.loading = false;
            $scope.dishes = result.results;
            $scope.pagination.total = result.total;
            $scope.pagination.totalPages = Math.ceil(result.total / $scope.pagination.perPage);
            $scope.pagination.pages = [];
            $scope.pagination.from = ($scope.pagination.perPage * ($scope.pagination.currentPage - 1)) + 1;
            $scope.pagination.to = ($scope.pagination.perPage * $scope.pagination.currentPage);
            if($scope.pagination.to > $scope.pagination.total){
                $scope.pagination.to = $scope.pagination.total;
            }
            for(var i = 0; i < $scope.pagination.totalPages; i++){
                if(i >= $scope.pagination.currentPage - ($scope.pagination.maxPages / 2)){
                    $scope.pagination.pages.push(i + 1);
                }
                if($scope.pagination.pages.length >= $scope.pagination.maxPages){
                    break;
                }
            }
            setSelected();
        }).catch(function(err){
            $scope.loading = false;
            $scope.loadingError = err;
        });
    };
    var gotoPage = function(page){
        if(page >= 1 && page <= $scope.pagination.totalPages && page != $scope.pagination.currentPage){
            $scope.pagination.currentPage = page;
            loadList();
        }
    };
    var order = function(predicate) {
        $scope.pagination.currentPage = 1;
        $scope.predicate = predicate;
        $scope.reverse = ($scope.predicate === predicate) ? !$scope.reverse : false;
        loadList();
    };
    var requestAction = function(action, resourceId, overrideModule){
        overrideModule = overrideModule || moduleName;
        switch(action){
            case "list":
                $scope.$state.go(overrideModule);
                break;
            case "create":
                $scope.$state.go(overrideModule + ".create");
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
                        loadList();
                    }).catch(function(err){
                        $scope.loading = false;
                        $scope.loadingError = err;
                    });
                }
                break;
            case "accept":
            case "reject":
                $scope.loading = true;
                resourceService.generic("post", "dish", {resourceId : resourceId, secondaryId : action + "ed"}).then(function(){
                    loadList();
                }).catch(function(err){
                    $scope.loading = false;
                    $scope.loadingError = err;
                });
                break;
            case "acceptSelected":
            case "rejectSelected":
            case "unfilterSelected":
                $scope.loading = true;
                resourceService.generic("post", "dishStatus", {}, {dishIds : $scope.currentSelected, newStatus : action.replace("Select", "")}).then(function(){
                    loadList();
                }).catch(function(err){
                    $scope.loading = false;
                    $scope.loadingError = err;
                });
                break;
        }
    };
    var listVisibility = function(){
        return $state.current.name == moduleName;
    };
    var checkContent = function(content){
        if(content && content instanceof Array){
            return content.join(", ");
        } else {
            return (content) ? content : "-";
        }
    };
    var toggleAllSelected = function(){
        var destinyState = $scope.allSelected;
        $scope.dishes = $scope.dishes.map(function(item){
            item.selected = destinyState;
            return item;
        });
        checkSelected();
    };
    var checkSelected = function(){
        $scope.currentSelected = [];
        $scope.dishes.forEach(function(item){
            if(item.selected){
                $scope.currentSelected.push(item._id);
            }
        });
        $scope.activeMultiActions = ($scope.currentSelected.length > 0);
        $scope.allSelected = ($scope.currentSelected.length == $scope.dishes.length);
    };
    var setSelected = function(){
        $scope.dishes.forEach(function(item){
            if($scope.currentSelected.indexOf(item._id) != -1){
                item.selected = true;
            }
        });
        $scope.activeMultiActions = ($scope.currentSelected.length > 0);
        $scope.allSelected = ($scope.currentSelected.length == $scope.dishes.length);
    };
    $scope.loading = false;
    $scope.loadingError = null;
    $scope.dishes = [];
    $scope.currentSelected = [];
    $scope.categories = [];
    $scope.filters = $stateParams ||{};
    $scope.loadList = loadList;
    $scope.listVisibility = listVisibility;
    $scope.checkContent = checkContent;
    $scope.order = order;
    $scope.gotoPage = gotoPage;
    $scope.requestAction = requestAction;
    $scope.toggleAllSelected = toggleAllSelected;
    $scope.checkSelected = checkSelected;
    $scope.activeMultiActions = false;
    $scope.predicate = "createdAt";
    $scope.reverse = false;
    $scope.allSelected = false;
    $scope.pagination = {
        currentPage : 1,
        perPage : 20,
        totalPages : 1,
        maxPages : 10
    };
    $rootScope.$on('$stateChangeStart', function(event, toState){
        if(toState.name == "dish"){
            loadList();
        }
    });
    loadCategories();
    loadList();
};