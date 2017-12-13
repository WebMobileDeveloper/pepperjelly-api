"use strict";
DTM = DTM || {};
DTM.controllers = DTM.controllers || {};
DTM.controllers.restaurantImport = function($scope, $rootScope, sessionService, resourceService, uiGmapGoogleMapApi){
    if(!sessionService.getValue("DTMSessionId")){
        $scope.$state.go("login");
    }
    var onBoundsChanged = function(){
        if(!$scope.map.initialized){
            onMapReady();
        }
        var bounds = $scope.map.control.getGMap().getBounds();
        var sw = bounds.getSouthWest();
        var ne = bounds.getNorthEast();
        $scope.search.options.bounds = new google.maps.LatLngBounds(sw, ne);
    };
    var onPlacesChanged = function(searchBox){
        $scope.window.show = false;
        $scope.placesFound = searchBox.getPlaces().map(function(item){
            return {
                id : item.place_id,
                address : item.formatted_address,
                icon : item.icon,
                name : item.name,
                latitude : item.geometry.location.lat(),
                longitude : item.geometry.location.lng(),
                imported : false
            };
        });
        onBoundsChanged();
    };
    var onMapReady = function(){
        $scope.map.initialized = true;
        setTimeout(function(){
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(function(position) {
                    $scope.map.center = {
                        latitude : position.coords.latitude,
                        longitude : position.coords.longitude
                    };
                    onBoundsChanged();
                });
            } else {
                alert("Geo location is not supported by your browser, setting default starting point.");
            }
            onBoundsChanged();
        }, 0);
    };
    uiGmapGoogleMapApi.then(function(){
        $scope.map.bounds = new google.maps.LatLngBounds();
    });
    $scope.placesFound = [];
    $scope.importing = false;
    $scope.importError = null;
    $scope.importInfo = false;
    $scope.importProperty = function(id){
        $scope.importing = true;
        $scope.importError = null;
        $scope.importInfo = false;
        resourceService.genericPublic("post", "places", {resourceId : id}).then(function(){
            $scope.importing = false;
            $scope.importInfo = true;
        }).catch(function(err){
            $scope.importing = false;
            $scope.importError = (err.data && err.data.error) ? err.data.error : err;
        });
    };
    $scope.map = {
        initialized : false,
        control : {},
        bounds : null,
        center : {
            latitude : 45,
            longitude : -73
        },
        zoom : 14,
        options : {
            scrollwheel : false,
            panControl : true,
            overviewMapControl : true,
            rotateControl : true,
            scaleControl : true
        },
        events : {
            bounds_changed : onBoundsChanged
        }
    };
    $scope.search = {
        template : "searchbox.tpl.html",
        options : {
            bounds: null
        },
        events : {
            places_changed: onPlacesChanged
        }
    };
    $scope.markers = {
        events : {
            click : function(marker, eventName, model) {
                $scope.window.model = model;
                $scope.window.show = true;
            }
        }
    };
    $scope.window = {
        marker : {},
        show : false,
        closeClick : function(){
            this.show = false;
        },
        options : {}
    };
};
DTM.controllers.restaurantImportMethod = function($scope, resourceService){
    $scope.importing = false;
    $scope.importError = null;
    $scope.importInfo = false;
    $scope.importProperty = function(id){
        $scope.importing = true;
        $scope.importError = null;
        $scope.importInfo = false;
        resourceService.genericPublic("post", "places", {resourceId : id}).then(function(){
            $scope.importing = false;
            $scope.importInfo = true;
        }).catch(function(err){
            $scope.importing = false;
            $scope.importError = err;
        });
    };
};