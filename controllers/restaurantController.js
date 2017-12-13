"use strict";
module.exports = function(libraries){
    var Q = libraries.Q;
    var mongodb = require("mongodb");
    var ObjectID = mongodb.ObjectID;
    var geocoder = require('geocoder');
    var RestaurantModel = require("../models/restaurant")(libraries);
    var UserModel = require("../models/user")(libraries);
    var FollowModel = require("../models/follow")(libraries);
    var VisitCountModel = require("../models/visitCount")(libraries);
    var dishController = libraries.dishController;
    var places = libraries.placesServices;
    var defaultSearchRange = 13500000;

    var _toObject = function(array, param){
        var object = {};
        array.forEach(function(item){
            object[item[param]] = item;
        });
        return object;
    };
    var updateUserLocation = function (userId, latitude, longitude, range, categories, useCustomLocation, locationName, deviceToken) {
        var deferred = Q.defer();
        var document = {$set : {}};
        if(useCustomLocation){
            document.$set = {
                //pushCount : 0,
                range : range,
                categories : categories,
                customLocation : [+longitude, +latitude],
                useCustomLocation : true
            };
            if(locationName){
                document.$set["customLocationName"] = locationName;
            }
        } else {
            document.$set = {
                //pushCount : 0,
                range : range,
                categories : categories,
                location : [+longitude, +latitude],
                useCustomLocation : false
            };
            if(locationName){
                document.$set["locationName"] = locationName;
            }
        }
        if(deviceToken){
            document.$set["deviceToken"] = deviceToken;
        }
        new UserModel({_id : userId}).findOneAndUpdate(document).then(deferred.resolve).catch(deferred.reject);
        return deferred.promise;
    };
    var createRestaurant = function(model, currentUser){
        var deferred = Q.defer();
        model.userId = currentUser;
        var restaurant = new RestaurantModel(model, true);
        if(restaurant){
            var query = {safeName : restaurant.safeName};
            if(restaurant.placesId){
                query = {
                    $or : [
                        {safeName : restaurant.safeName},
                        {placesId : restaurant.placesId}
                    ]
                };
            }
            new RestaurantModel(query).findOne().then(function(restaurantFound){
                if(restaurantFound){
                    deferred.resolve(restaurantFound);
                } else {
                    new RestaurantModel(restaurant).insertOne().then(deferred.resolve).catch(deferred.reject);
                }
            }).catch(deferred.reject);
        } else {
            deferred.reject("No restaurant to create");
        }
        return deferred.promise;
    };
    var verifyRestaurant = function(restaurant){
        var deferred = Q.defer();
        new RestaurantModel({
            name : restaurant
        }).findOne().then(function(foundRestaurant){
            if(foundRestaurant){
                deferred.resolve({});
            } else {
                deferred.reject("No valid restaurant.");
            }
        }).catch(deferred.reject);
        return deferred.promise;
    };
    var getRestaurants = function(searchQuery, currentUser){
        var deferred = Q.defer();
        var searchOps = [];
        var latitude = (searchQuery.latitude) ? +searchQuery.latitude : null;
        var longitude = (searchQuery.longitude) ? +searchQuery.longitude : null;
        var range = (searchQuery.range) ? +searchQuery.range : null;
        var deviceToken = (searchQuery.deviceToken) ? searchQuery.deviceToken : null;
        var locationName = searchQuery.locationName;
        var useCustomLocation = (searchQuery.useCustomLocation === true || searchQuery.useCustomLocation === "true");
        var categories = (searchQuery.category && searchQuery.category instanceof Array) ? searchQuery.category : (searchQuery.category) ? [searchQuery.category] : [];
        delete searchQuery.deviceToken;
        delete searchQuery.useCustomLocation;
        delete searchQuery.locationName;
        if(searchQuery.category && searchQuery.category instanceof Array){
            searchQuery.category = {$in : searchQuery.category};
        }
        searchQuery = _parseQuery(searchQuery) || {};
        searchOps.push(new RestaurantModel(searchQuery).find());
        if(latitude && longitude){
            searchOps.push(updateUserLocation(currentUser, latitude, longitude, range, categories, useCustomLocation, locationName, deviceToken));
        }
        Q.all(searchOps).then(function(results){
            var restaurants = results[0];
            var restaurantIds = restaurants.map(function(item){
                return item._id;
            });
            var visitCountsQuery = {
                restaurantId : {
                    $in : restaurantIds
                },
                userId : currentUser
            };
            new VisitCountModel(visitCountsQuery).find().then(function(visitCounts){
                visitCounts = _toObject(visitCounts, "restaurantId");
                deferred.resolve({restaurants : restaurants.map(function(item){
                    if(item.category && item.category instanceof Array){
                        item.category = item.category.reverse();
                    }
                    item.visitCounts = (visitCounts[item._id]) ? visitCounts[item._id].count : 0;
                    return item;
                })});
            }).catch(deferred.reject);
        }).catch(deferred.reject);
        return deferred.promise;
    };
    var getRestaurantsDishes = function(searchQuery, currentUser){
        var deferred = Q.defer();
        var preOps = [];
        if(searchQuery.onlyFollowed === "true" || searchQuery.onlyFollowed === true){
            preOps.push(new FollowModel({userId : new ObjectID(currentUser), follow : true}).find());
        }
        delete searchQuery.onlyFollowed;
        Q.all(preOps).then(function(preResults){
            var searchOps = [];
            var $limit = searchQuery.$limit;
            var $skip = searchQuery.$skip;
            var latitude = (searchQuery.latitude) ? +searchQuery.latitude : null;
            var longitude = (searchQuery.longitude) ? +searchQuery.longitude : null;
            var range = (searchQuery.range) ? +searchQuery.range : null;
            var deviceToken = (searchQuery.deviceToken) ? searchQuery.deviceToken : null;
            var locationName = searchQuery.locationName;
            var useCustomLocation = (searchQuery.useCustomLocation === true || searchQuery.useCustomLocation === "true");
            var categories = (searchQuery.category && searchQuery.category instanceof Array) ? searchQuery.category : (searchQuery.category) ? [searchQuery.category] : [];
            delete searchQuery.$limit;
            delete searchQuery.$skip;
            delete searchQuery.deviceToken;
            delete searchQuery.useCustomLocation;
            delete searchQuery.locationName;
            if(searchQuery.category && searchQuery.category instanceof Array){
                searchQuery.category = {$in : searchQuery.category};
            }
            searchQuery = _parseQuery(searchQuery) || {};
            searchOps.push(new RestaurantModel(searchQuery).find({_id : 1}));
            if(latitude && longitude){
                searchOps.push(updateUserLocation(currentUser, latitude, longitude, range, categories, useCustomLocation, locationName, deviceToken));
            }
            Q.all(searchOps).then(function(results){
                var dishesQuery = {
                    restaurantId : results[0].map(function(item){
                        return item._id;
                    })
                };
                if(searchQuery.category){dishesQuery.categories = searchQuery.category}
                if($limit){dishesQuery.$limit = $limit;}
                if($skip){dishesQuery.$skip = $skip;}
                if(preResults[0] && preResults[0] instanceof Array){
                    dishesQuery.userId = preResults[0].map(function(item){ return item.followedUser.toString(); });
                }
                dishController.searchDishes(dishesQuery, currentUser).then(deferred.resolve).catch(deferred.reject);
            }).catch(deferred.reject);
        }).catch(deferred.reject);
        return deferred.promise;
    };
    var _parseQuery = function(query){
        var numeric = ["longitude", "latitude", "range"];
        if(query.search){
            query.name = new RegExp("^" + query.search.toLowerCase(), "gi");
            delete query.search;
        }
        if(query.longitude && query.latitude){
            query.location = {
                $near : {
                    $geometry: {
                        type: "Point" ,
                        coordinates: [ +query.longitude , +query.latitude ]
                    },
                    $maxDistance: query.range || defaultSearchRange,
                    $minDistance: 0
                }
            };
            delete query.longitude;
            delete query.latitude;
            delete query.range;
        }
        for(var key in query){
            if(query.hasOwnProperty(key)){
                if(numeric.indexOf(key) != -1){
                    query[key] = +query[key];
                }
                if(key.indexOf("_") == 0 && key != "_id"){
                    delete query[key];
                }
            }
        }
        return query;
    };
    var addRestaurantCategories = function(restaurantId, categories){
        var deferred = Q.defer();
        var query = {_id : restaurantId};
        if(!categories instanceof Array){
            categories = [categories];
        }
        new RestaurantModel(query).findOneAndUpdate({$addToSet : {category : {$each : categories}}}).then(deferred.resolve).catch(deferred.reject);
        return deferred.promise;
    };
    var updateRating = function(restaurantId){
        var deferred = Q.defer();
        var query = {_id : restaurantId};
        dishController.getAverageRating(restaurantId).then(function(averageRating){
            new RestaurantModel(query).findOneAndUpdate({$set : {averageRating : averageRating}}).then(deferred.resolve).catch(deferred.reject);
        }).catch(deferred.reject);
        return deferred.promise;
    };
    var updateRestaurant = function(restaurantId, model, currentUser){
        var deferred = Q.defer();
        var query = {_id : restaurantId};
        var restaurant = new RestaurantModel(model, true);
        var ops = [
            new RestaurantModel(query).findOne()
        ];
        Q.all(ops).then(function(results){
            var restaurantFound = results[0];
            if(restaurantFound && restaurantFound.userId.toString() == currentUser.toString()){
                new RestaurantModel(query).findOneAndUpdate({$set : restaurant}).then(deferred.resolve).catch(deferred.reject);
            } else if(restaurantFound) {
                deferred.reject("You can not modify this restaurant.");
            } else {
                deferred.reject("No restaurant found.");
            }
        }).catch(deferred.reject);
        return deferred.promise;
    };
    var placesAutocomplete = function(searchQuery) {
        var deferred = Q.defer();
        if(searchQuery.input){
            searchQuery.types = "establishment";
            places.autocomplete(searchQuery, function(err, result) {
                if (err) {
                    deferred.reject(err);
                } else {
                    deferred.resolve({results : result.body.predictions.map(function(item){
                        return {
                            description : item.description,
                            placeId : item.place_id
                        }
                    })});
                }
            });
        } else {
            deferred.reject("No 'input' defined in the query.");
        }
        return deferred.promise;
    };
    var placesSearch = function (query) {
        var deferred = Q.defer();
        places.nearbySearch(query, function(err, result){
            if(err){
                deferred.reject(err);
            } else {
                deferred.resolve({places : (result.body.results) ? result.body.results : []});
            }
        });
        return deferred.promise;
    };
    var placesSearchForRestaurant = function (restaurantId) {
        var deferred = Q.defer();
        new RestaurantModel({_id : restaurantId})
            .findOne()
            .then(function(restaurant){
                if(restaurant){
                    if(restaurant.name){
                        var query = {
                            location : restaurant.location.reverse().join(","),
                            radius : 10000,
                            name : restaurant.name
                        };
                        placesSearch(query).then(deferred.resolve).catch(deferred.reject);
                    } else {
                        deferred.reject("No name or location defined, please set them to search photos.");
                    }
                } else {
                    deferred.reject("No restaurant found.");
                }
            })
            .catch(deferred.reject);
        return deferred.promise;
    };
    var placesGet = function (placeId) {
        var deferred = Q.defer();
        var query = {
            placeid : placeId
        };
        places.details(query, function(err, result){
            if(err) {
                deferred.reject(err);
            } else if(result.body && result.body.error_message){
                deferred.reject(result.body.error_message);
            } else if(result.body && result.body.result){
                deferred.resolve(result.body.result);
            } else {
                deferred.reject("Not found");
            }
        });
        return deferred.promise;
    };
    var _getSize = function(url){
        var size = {height : 1125, width : 1125};
        var regExpA = new RegExp("\/s([0-9]+)-w([0-9]+)\/", "i");
        var regExpB = new RegExp("\/s([0-9]+)-w([0-9]+)-h([0-9]+)\/", "i");
        var matchA = (url) ? url.match(regExpA) : [];
        var matchB = (url) ? url.match(regExpB) : [];
        if(matchA && matchA.length >= 3){
            size.height = (!isNaN(matchA[1])) ? +matchA[1] : size.height;
            size.width = (!isNaN(matchA[2])) ? +matchA[2] : size.width;
        } else if(matchB && matchB.length >= 4){
            size.height = (!isNaN(matchB[2])) ? +matchB[2] : size.height;
            size.width = (!isNaN(matchB[3])) ? +matchB[3] : size.width;
        }
        return size;
    };
    var singlePlacesPhoto = function(photoReference, maxSize){
        var deferred = Q.defer();
        var query = {
            maxwidth : maxSize || 1125,
            maxheight : maxSize || 1125,
            photoreference : photoReference
        };
        places.photo(query, function(err, result){
            if(err){
                deferred.reject(err);
            } else {
                var url = result && result.redirects ? result.redirects[0] : null;
                var size = _getSize(url);
                deferred.resolve({url : url, height : size.height, width : size.width});
            }
        });
        return deferred.promise;
    };
    var placesPhoto = function (photoReference, maxSize) {
        var deferred = Q.defer();
        var ops = [];
        if(maxSize && maxSize instanceof Array){
            maxSize.forEach(function(singleMaxSize){
                ops.push(singlePlacesPhoto(photoReference, singleMaxSize));
            });
        } else {
            ops.push(singlePlacesPhoto(photoReference, maxSize));
        }
        Q.all(ops).then(function(photoResults){
            if(maxSize && maxSize instanceof Array){
                deferred.resolve(photoResults);
            } else {
                deferred.resolve(photoResults[0]);
            }
        }).catch(deferred.reject);
        return deferred.promise;
    };
    var placeImport = function (placeId, currentUser) {
        var deferred = Q.defer();
        Q.all([
            placesGet(placeId),
            new UserModel({"profile.email" : "team@pepperjellyapp.com"}).findOne()
        ]).then(function(readResults){
            var place = readResults[0];
            var adminUser = readResults[1];
            currentUser = (adminUser && adminUser._id) ? adminUser._id : currentUser;
            var restaurantModel = {
                image : place.icon,
                name : place.name,
                placesId : place.place_id,
                address : place.formatted_address || "",
                menu : place.website || "",
                phone : place.international_phone_number || place.formatted_phone_number || "",
                openingTimes : (place.opening_hours && place.opening_hours.weekday_text) ? place.opening_hours.weekday_text : [],
                rating : place.rating,
                category : [],
                longitude : place.geometry.location.lng,
                latitude : place.geometry.location.lat,
                userId : currentUser
            };
            Q.all([
                _getPhotoUrlsFromReferences(_extractPhotoReferencesFromPlaceData(place)),
                createRestaurant(restaurantModel, currentUser)
            ]).then(function(placeResults){
                var photos = placeResults[0];
                var restaurant = placeResults[1];
                if(restaurant._id){
                    var createOps = [];
                    if(photos && photos[0] && photos[0][0] && photos[0][0].url){
                        createOps.push(new RestaurantModel({_id : restaurant._id}).findOneAndUpdate({$set : {image : photos[0][0].url}}));
                    }
                    photos.forEach(function(photo){
                        var createModel = {
                            image : photo,
                            userId : currentUser,
                            restaurantId : restaurant._id.toString()
                        };
                        createOps.push(dishController.createDish(createModel, currentUser, true));
                    });
                    Q.allSettled(createOps).then(function (results) {
                        var successful = 0;
                        var errors = [];
                        results.forEach(function (result) {
                            if (result.state === "fulfilled") {
                                successful ++;
                            } else {
                                errors.push(result.reason.message);
                            }
                        });
                        deferred.resolve(restaurant);
                    });
                } else {
                    deferred.resolve(restaurant);
                }
            }).catch(deferred.reject);
        }).catch(deferred.reject);
        return deferred.promise;
    };
    var placesPhotoImport = function (placeId, restaurantId, currentUser) {
        var deferred = Q.defer();
        new RestaurantModel({_id : restaurantId})
            .findOne()
            .then(function(restaurant){
                if(restaurant){
                    placesGet(placeId).then(function(place){
                        _getPhotoUrlsFromReferences(_extractPhotoReferencesFromPlaceData(place)).then(function(photos){
                            var createOps = [];
                            var requestReload = false;
                            photos.forEach(function(photo){
                                var createModel = {
                                    image : photo,
                                    userId : currentUser,
                                    restaurantId : restaurantId,
                                    status : "accepted"
                                };
                                createOps.push(dishController.createDish(createModel, currentUser, true));
                            });
                            if(!restaurant.image && photos[0] && photos[0][0]){
                                requestReload = true;
                                createOps.push(new RestaurantModel({_id : restaurantId}).findOneAndUpdate({$set : {image : photos[0][0].url}}));
                            }
                            Q.allSettled(createOps).then(function (results) {
                                var successful = 0;
                                var errors = [];
                                results.forEach(function (result) {
                                    if (result.state === "fulfilled") {
                                        successful ++;
                                    } else {
                                        errors.push(result.reason.message);
                                    }
                                });
                                deferred.resolve({foundCount : photos.length, successfulCount : successful, errorsCount : errors.length, errors : errors, requestReload : requestReload});
                            });
                        }).catch(deferred.reject);
                    }).catch(deferred.reject);
                } else {
                    deferred.reject("No restaurant found.");
                }
            })
            .catch(deferred.reject);
        return deferred.promise;
    };
    var _extractPhotoReferencesFromPlaceData = function (placeData) {
        return (placeData && placeData.photos) ? placeData.photos.map(function(item){ return item.photo_reference; }) : [];
    };
    var _getPhotoUrlsFromReferences = function (photoReferences) {
        var deferred = Q.defer();
        var getOps = [];
        photoReferences.forEach(function(reference){
            getOps.push(placesPhoto(reference, [1125, 250]));
        });
        Q.all(getOps).then(function(allPhotos){
            allPhotos = allPhotos.map(function(item){
                item = item.filter(function(pic){
                    return pic.url;
                });
                return item;
            });
            deferred.resolve(allPhotos.filter(function(item){
                return (item.length > 0);
            }));
        }).catch(deferred.reject);
        return deferred.promise;
    };
    var addressLookup = function (searchAddress) {
        var deferred = Q.defer();
        if(searchAddress){
            geocoder.geocode(searchAddress, function(err, data) {
                if(err){
                    deferred.reject(err);
                } else {
                    var results = (data && data.results) ? data.results.map(function(item){
                        return {
                            address : item.formatted_address,
                            location : {
                                longitude : item.geometry.location.lng,
                                latitude : item.geometry.location.lat
                            }
                        };
                    }) : [];
                    deferred.resolve({results : results});
                }
            });
        } else {
            deferred.reject("No search parameter provided in the query.");
        }
        return deferred.promise;
    };
    var adminReadRestaurant = function (restaurantId){
        var deferred = Q.defer();
        new RestaurantModel({_id : restaurantId})
            .findOne()
            .then(deferred.resolve)
            .catch(deferred.reject);
        return deferred.promise;
    };
    var adminReadRestaurants = function (searchQuery){
        var deferred = Q.defer();
        searchQuery = searchQuery || {};
        if(searchQuery.search){
            searchQuery.name = new RegExp(searchQuery.search.toLowerCase());
            delete searchQuery.search;
        }
        Q.all([
            new RestaurantModel(searchQuery).find(),
            new RestaurantModel(searchQuery).count()
        ]).then(function(results){
            deferred.resolve({results : results[0], total : results[1]});
        }).catch(deferred.reject);
        return deferred.promise;
    };
    var adminUpdateRestaurant = function (restaurantId, model){
        var deferred = Q.defer();
        var query = {
            _id : restaurantId
        };
        if(model.userId){model.userId = new ObjectID(model.userId);}
        new RestaurantModel(query)
            .findOneAndUpdate(model)
            .then(function(result){
                if(result){
                    deferred.resolve({restaurant : result});
                } else {
                    deferred.reject("Restaurant not found");
                }
            })
            .catch(deferred.reject);
        return deferred.promise;
    };
    var adminDeleteRestaurant = function (restaurantId){
        var deferred = Q.defer();
        if(restaurantId){
            Q.all([
                dishController.adminReadDishes({restaurantId : restaurantId}),
                new RestaurantModel({_id : restaurantId}).deleteOne()
            ]).then(function(results){
                var dishIds = results[0].results.map(function(dish){ return dish._id.toString(); });
                dishController.adminDeleteDish(dishIds).then(function(){
                    deferred.resolve({removed : "ok"});
                }).catch(deferred.reject);
            }).catch(deferred.reject)
        } else {
            deferred.reject("No restaurantId provided")
        }
        return deferred.promise;
    };
    return {
        createRestaurant : createRestaurant,
        verifyRestaurant : verifyRestaurant,
        getRestaurants : getRestaurants,
        getRestaurantsDishes : getRestaurantsDishes,
        addRestaurantCategories : addRestaurantCategories,
        updateRating : updateRating,
        updateRestaurant : updateRestaurant,
        placesAutocomplete : placesAutocomplete,
        placesSearch : placesSearch,
        placesSearchForRestaurant : placesSearchForRestaurant,
        placesGet : placesGet,
        placesPhoto : placesPhoto,
        placeImport : placeImport,
        placesPhotoImport : placesPhotoImport,
        addressLookup : addressLookup,
        adminReadRestaurant : adminReadRestaurant,
        adminReadRestaurants : adminReadRestaurants,
        adminUpdateRestaurant : adminUpdateRestaurant,
        adminDeleteRestaurant : adminDeleteRestaurant
    }
};