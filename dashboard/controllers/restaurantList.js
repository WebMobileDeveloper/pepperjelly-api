DTM = DTM || {};
DTM.controllers = DTM.controllers || {};
DTM.controllers.restaurantList = function($scope, $rootScope, sessionService, resourceService, $state, $stateParams, $filter){
    "use strict";
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
    var loadList = function(resetCurrentPage){
        $scope.loading = true;
        $scope.loadingError = null;
        var query = {};
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
        if($scope.filters.name){query.name = "$like|" + $scope.filters.name; $scope.currentFilter.name = true;}
        if($scope.filters.category && $scope.filters.category.length > 0){query.category = "$like|" + $scope.filters.category; $scope.currentFilter.category = true;}
        if($scope.filters.address){query.address = "$like|" + $scope.filters.address; $scope.currentFilter.address = true;}
        if($scope.filters.rating){query.rating = "$gte|" + $scope.filters.rating; $scope.currentFilter.rating = true;}
        if($scope.filters.averageRating){query.averageRating = "$gte|" + $scope.filters.averageRating; $scope.currentFilter.averageRating = true;}
        resourceService.query(moduleName, query, true).then(function(result){
            $scope.loading = false;
            $scope.restaurants = result.results;
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
            case "import":
                $scope.$state.go(overrideModule + ".import");
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
    $scope.loading = false;
    $scope.loadingError = null;
    $scope.restaurants = [];
    $scope.filters = {};
    $scope.categories = [];
    $scope.loadList = loadList;
    $scope.listVisibility = listVisibility;
    $scope.checkContent = checkContent;
    $scope.order = order;
    $scope.gotoPage = gotoPage;
    $scope.requestAction = requestAction;
    $scope.pagination = {
        currentPage : 1,
        perPage : 20,
        totalPages : 1,
        maxPages : 10
    };
    $rootScope.$on('$stateChangeStart', function(event, toState){
        if(toState.name == "restaurant"){
            loadList();
        }
    });
    loadCategories();
    loadList();
};