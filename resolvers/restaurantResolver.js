"use strict";
module.exports = function(libraries){
    var restaurantController = libraries.restaurantController;
    var handleResponse = function(result){
        result.success = true;
        this.json(result);
    };
    var handleError = function(err, softErrorCode){
        var errorResponse = {
            "success" : false
        };
        if(err instanceof Error){
            console.error(err.stack);
            errorResponse.SERVER_ERROR = err.message;
            this.status(500).json(errorResponse);
        } else {
            var statusCode = (softErrorCode) ? softErrorCode : 400;
            this.status(statusCode).json({
                "success": false,
                "error": err
            });
        }
    };

    var createRestaurant = function(req, res){
        restaurantController.createRestaurant(req.body, req.session._userId)
            .then(handleResponse.bind(res))
            .catch(handleError.bind(res));
    };
    var getRestaurants = function(req, res){
        restaurantController.getRestaurants(req.body, req.session._userId)
            .then(handleResponse.bind(res))
            .catch(handleError.bind(res));
    };
    var getRestaurantsDishes = function(req, res){
        restaurantController.getRestaurantsDishes(req.body, req.session._userId)
            .then(handleResponse.bind(res))
            .catch(handleError.bind(res));
    }; 
    var updateRestaurant = function(req, res){
        restaurantController.updateRestaurant(req.params["restaurantId"], req.body, req.session._userId)
            .then(handleResponse.bind(res))
            .catch(handleError.bind(res));
    };
    var placesAutocomplete = function (req, res) {
        restaurantController.placesAutocomplete(req.query)
            .then(handleResponse.bind(res))
            .catch(handleError.bind(res));
    };
    var placesSearch = function (req, res) {
        restaurantController.placesSearch(req.query)
            .then(handleResponse.bind(res))
            .catch(handleError.bind(res));
    };
    var placesSearchForRestaurant = function (req, res) {
        restaurantController.placesSearchForRestaurant(req.params["restaurantId"])
            .then(handleResponse.bind(res))
            .catch(handleError.bind(res));
    };
    var placesGet = function (req, res) {
        restaurantController.placesGet(req.params["placeId"])
            .then(handleResponse.bind(res))
            .catch(handleError.bind(res));
    };
    var placesPhoto = function (req, res) {
        restaurantController.placesPhoto(req.params["photoReference"])
            .then(handleResponse.bind(res))
            .catch(handleError.bind(res));
    };
    var placeImport = function (req, res) {
        restaurantController.placeImport(req.params["placeId"], req.session._userId)
            .then(handleResponse.bind(res))
            .catch(handleError.bind(res));
    };
    var placesPhotoImport = function (req, res) {
        restaurantController.placesPhotoImport(req.params["placeId"], req.params["restaurantId"], req.session._userId)
            .then(handleResponse.bind(res))
            .catch(handleError.bind(res));
    };
    var adminCreateRestaurant = function (req, res){
        restaurantController.createRestaurant(req.body, req.session._userId)
            .then(handleResponse.bind(res))
            .catch(handleError.bind(res));
    };
    var addressLookup = function (req, res){
        restaurantController.addressLookup(req.query["search"])
            .then(handleResponse.bind(res))
            .catch(handleError.bind(res));
    };
    var adminReadRestaurant = function (req, res){
        restaurantController.adminReadRestaurant(req.params["restaurantId"])
            .then(handleResponse.bind(res))
            .catch(handleError.bind(res));
    };
    var adminReadRestaurants = function (req, res){
        restaurantController.adminReadRestaurants(req.query)
            .then(handleResponse.bind(res))
            .catch(handleError.bind(res));
    };
    var adminUpdateRestaurant = function (req, res){
        restaurantController.adminUpdateRestaurant(req.params["restaurantId"], req.body)
            .then(handleResponse.bind(res))
            .catch(handleError.bind(res));
    };
    var adminDeleteRestaurant = function (req, res){
        restaurantController.adminDeleteRestaurant(req.params["restaurantId"])
            .then(handleResponse.bind(res))
            .catch(handleError.bind(res));
    };
    return {
        createRestaurant : createRestaurant,
        getRestaurants : getRestaurants,
        getRestaurantsDishes : getRestaurantsDishes,
        updateRestaurant : updateRestaurant,
        placesAutocomplete : placesAutocomplete,
        placesSearch : placesSearch,
        placesSearchForRestaurant : placesSearchForRestaurant,
        placesGet : placesGet,
        placesPhoto : placesPhoto,
        placeImport : placeImport,
        placesPhotoImport : placesPhotoImport,
        addressLookup : addressLookup,
        adminCreateRestaurant : adminCreateRestaurant,
        adminReadRestaurant : adminReadRestaurant,
        adminReadRestaurants : adminReadRestaurants,
        adminUpdateRestaurant : adminUpdateRestaurant,
        adminDeleteRestaurant : adminDeleteRestaurant
    }
};