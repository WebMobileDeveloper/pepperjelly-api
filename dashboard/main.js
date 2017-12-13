angular.module("dtmDashboard", [
		"ngSanitize",
		"ui.router",
		"ngResource",
		"ngCookies",
		"ui.select",
		"ui.bootstrap",
        "uiGmapgoogle-maps"
	])

	// Router states config
	.config(['$stateProvider', '$urlRouterProvider', DTM.states])
	.config(function(uiGmapGoogleMapApiProvider) {
		uiGmapGoogleMapApiProvider.configure({
			key: 'AIzaSyDL3nL5RSB4oLtSWmSk6L6GRzV2m87ygBw',
			v: '3',
			libraries: 'places'
		});
	})

	// Pass $state to $rootScope
	.run(["$rootScope", "$state", "$stateParams", function ($rootScope, $state, $stateParams) {
		$rootScope.$state = $state;
		$rootScope.$stateParams = $stateParams;
	}])

	// Services
	.service("sessionService", ["$resource", "$cookieStore", "$rootScope", DTM.services.sessionService])
	.service("resourceService", ["$resource", "sessionService", DTM.services.resourceService])

	// Basic controllers
	.controller("dtmHeader", ["$scope", "sessionService", DTM.controllers.dtmHeader])
	.controller("loginCtrl", ["$scope", "sessionService", DTM.controllers.login])

	// Start controller
	.controller("startCtrl", ["$scope", "sessionService", DTM.controllers.start])

	// Module controllers
    .controller("userListCtrl", ["$scope", "$rootScope", "sessionService", "resourceService", "$state", "$stateParams", "$filter", DTM.controllers.userList])
    .controller("userDetailCtrl", ["$scope", "sessionService", "resourceService", "$state", "$stateParams", DTM.controllers.userDetail])
	.controller("issuesListCtrl", ["$scope", "$rootScope", "sessionService", "resourceService", "$state", DTM.controllers.issuesList])
	.controller("categoriesListCtrl", ["$scope", "$rootScope", "sessionService", "resourceService", "$state", DTM.controllers.categoriesList])
	.controller("categoriesDetailCtrl", ["$scope", "sessionService", "resourceService", "$state", "$stateParams", DTM.controllers.categoriesDetail])
	.controller("restaurantListCtrl", ["$scope", "$rootScope", "sessionService", "resourceService", "$state", "$stateParams", "$filter", DTM.controllers.restaurantList])
	.controller("restaurantImportCtrl", ["$scope", "$rootScope", "sessionService", "resourceService", "uiGmapGoogleMapApi", DTM.controllers.restaurantImport])
	.controller("restaurantDetailCtrl", ["$scope", "sessionService", "resourceService", "$state", "$stateParams", DTM.controllers.restaurantDetail])
	.controller("dishListCtrl", ["$scope", "$rootScope", "sessionService", "resourceService", "$state", "$stateParams", "$filter", DTM.controllers.dishList])
	.controller("dishDetailCtrl", ["$scope", "sessionService", "resourceService", "$state", "$stateParams", DTM.controllers.dishDetail])
    .controller("restaurantImportMethod", ["$scope", "resourceService", DTM.controllers.restaurantImportMethod])
;