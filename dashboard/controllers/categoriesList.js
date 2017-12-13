DTM = DTM || {};
DTM.controllers = DTM.controllers || {};
DTM.controllers.categoriesList = function($scope, $rootScope, sessionService, resourceService, $state){
    "use strict";
    if(!sessionService.getValue("DTMSessionId")){
        $scope.$state.go("login");
    }
    var moduleName = "categories";
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
        if($scope.filters.parent){query.parent = "$like|" + $scope.filters.parent; $scope.currentFilter.parent = true;}
        if($scope.filters.name){query.name = "$like|" + $scope.filters.name; $scope.currentFilter.name = true;}
        if($scope.filters.status){query.status = "$like|" + $scope.filters.status; $scope.currentFilter.status = true;}
        resourceService.query(moduleName, query, true).then(function(result){
            $scope.loading = false;
            $scope.categories = result.results;
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
    $scope.categories = [];
    $scope.filters = {};
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
        if(toState.name == "categories"){
            loadList();
        }
    });
    loadList();
};