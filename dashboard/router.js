DTM = DTM || {};
DTM.resolvePromises = {
    sessionServiceReady : function(sessionService){ return sessionService;}
};
DTM.states = function($stateProvider, $urlRouterProvider){
    $urlRouterProvider.otherwise("/login");
    $stateProvider
        .state("login", {url : "/login", templateUrl : "views/login.html", controller : "loginCtrl", resolve : DTM.resolvePromises})
        .state("start", {url : "/start", templateUrl : "views/start.html", controller : "startCtrl", resolve : DTM.resolvePromises})
        .state("user", {url : "/user", templateUrl : "views/userList.html", controller : "userListCtrl", resolve : DTM.resolvePromises})
        .state("user.create", {url : "/create", templateUrl : "views/userDetail.html", controller : "userDetailCtrl", resolve : DTM.resolvePromises})
        .state("user.detail", {url : "/detail/:resourceId", templateUrl : "views/userDetail.html", controller : "userDetailCtrl", resolve : DTM.resolvePromises})
        .state("user.edit", {url : "/edit/:resourceId", templateUrl : "views/userDetail.html", controller : "userDetailCtrl", resolve : DTM.resolvePromises})

        .state("issues", {url : "/issues", templateUrl : "views/issuesList.html", controller : "issuesListCtrl", resolve : DTM.resolvePromises})

        .state("categories", {url : "/categories", templateUrl : "views/categoriesList.html", controller : "categoriesListCtrl", resolve : DTM.resolvePromises})
        .state("categories.create", {url : "/create", templateUrl : "views/categoriesDetail.html", controller : "categoriesDetailCtrl", resolve : DTM.resolvePromises})
        .state("categories.detail", {url : "/detail/:resourceId", templateUrl : "views/categoriesDetail.html", controller : "categoriesDetailCtrl", resolve : DTM.resolvePromises})
        .state("categories.edit", {url : "/edit/:resourceId", templateUrl : "views/categoriesDetail.html", controller : "categoriesDetailCtrl", resolve : DTM.resolvePromises})

        .state("restaurant", {url : "/restaurant", templateUrl : "views/restaurantList.html", controller : "restaurantListCtrl", resolve : DTM.resolvePromises})
        .state("restaurant.import", {url : "/import", templateUrl : "views/restaurantImport.html", controller : "restaurantImportCtrl", resolve : DTM.resolvePromises})
        .state("restaurant.create", {url : "/create", templateUrl : "views/restaurantDetail.html", controller : "restaurantDetailCtrl", resolve : DTM.resolvePromises})
        .state("restaurant.detail", {url : "/detail/:resourceId", templateUrl : "views/restaurantDetail.html", controller : "restaurantDetailCtrl", resolve : DTM.resolvePromises})
        .state("restaurant.edit", {url : "/edit/:resourceId", templateUrl : "views/restaurantDetail.html", controller : "restaurantDetailCtrl", resolve : DTM.resolvePromises})

        .state("dish", {url : "/dish?restaurantId&status", templateUrl : "views/dishList.html", controller : "dishListCtrl", resolve : DTM.resolvePromises})
        .state("dish.create", {url : "/create", templateUrl : "views/dishDetail.html", controller : "dishDetailCtrl", resolve : DTM.resolvePromises})
        .state("dish.detail", {url : "/detail/:resourceId", templateUrl : "views/dishDetail.html", controller : "dishDetailCtrl", resolve : DTM.resolvePromises})
        .state("dish.edit", {url : "/edit/:resourceId", templateUrl : "views/dishDetail.html", controller : "dishDetailCtrl", resolve : DTM.resolvePromises})
};