DTM = DTM || {};
DTM.controllers = DTM.controllers || {};
DTM.controllers.userList = function($scope, $rootScope, sessionService, resourceService, $state, $stateParams){
    "use strict";
    if(!sessionService.getValue("DTMSessionId")){
        $scope.$state.go("login");
    }
    var moduleName = "user";
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
        $scope.currentFilter = {profile : {}};
        if($scope.filters.userName){query.userName = "$like|" + $scope.filters.userName; $scope.currentFilter.userName = true;}
        if($scope.filters.role){query.role = "$like|" + $scope.filters.role; $scope.currentFilter.role = true;}
        if($scope.filters.profile.fullName){query["profile.fullName"] = "$like|" + $scope.filters.profile.fullName; $scope.currentFilter.profile.fullName = true;}
        if($scope.filters.profile.email){query["profile.email"] = "$like|" + $scope.filters.profile.email; $scope.currentFilter.profile.email = true;}
        if($scope.filters.facebookId){query.facebookId = "$like|" + $scope.filters.facebookId; $scope.currentFilter.facebookId = true;}
        if($scope.filters.googleId){query.googleId = "$like|" + $scope.filters.googleId; $scope.currentFilter.googleId = true;}
        resourceService.query(moduleName, query, true).then(function(result){
            $scope.loading = false;
            $scope.users = result.results;
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
    var groupName = function(group){
        switch(+group){
            case 1: return "User"; break;
            case 2: return "Admin"; break;
        }
    };
    var order = function(predicate) {
        $scope.pagination.currentPage = 1;
        $scope.predicate = predicate;
        $scope.reverse = ($scope.predicate === predicate) ? !$scope.reverse : false;
        loadList();
    };
    var requestAction = function(action, resourceId){
        switch(action){
            case "list":
                $scope.$state.go(moduleName);
                break;
            case "create":
                $scope.$state.go(moduleName + ".create");
                break;
            case "detail":
                $scope.$state.go(moduleName + ".detail", {resourceId : resourceId});
                break;
            case "edit":
                $scope.$state.go(moduleName + ".edit", {resourceId : resourceId});
                break;
            case "delete":
                if(confirm("Are you sure you want to remove PERMANENTLY this " + moduleName + "?")){
                    $scope.loading = true;
                    resourceService.remove(moduleName, resourceId).then(function(){
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
    $scope.users = [];
    $scope.filters = {profile : {}};
    $scope.groupName = groupName;
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
        if(toState.name == "user"){
            loadList();
        }
    });
    loadList();
};