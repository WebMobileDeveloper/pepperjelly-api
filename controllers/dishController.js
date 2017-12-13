"use strict";
module.exports = function(libraries){
    var Q = libraries.Q;
    var mongodb = require("mongodb");
    var ObjectID = mongodb.ObjectID;
    var userController = libraries.userController;
    var reportsController = libraries.reportsController;
    var push = libraries.pushServices;
    var DishModel = require("../models/dish")(libraries);
    var LikeModel = require("../models/like")(libraries);
    var CommentModel = require("../models/comments")(libraries);
    var ReportModel = require("../models/reports")(libraries);
    var VisitCountModel = require("../models/visitCount")(libraries);
    var ActivityModel = require("../models/activity")(libraries);

    var setLibraryElement = function(elementName, element){
        libraries[elementName] = element;
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
    var _stringsToObjectIds = function(string){
        return new ObjectID(string);
    };
    var _ensureImageStructure = function(image, secondary){
        if(!image){
            return [];
        } else if(image && image.constructor === String){
            var size = _getSize(image);
            return [{url : image, height : size.height, width : size.width}];
        } else if(image && image instanceof Array){
            image = image.map(function(img){
                return _ensureImageStructure(img, true);
            });
            return image;
        } else if(image && image instanceof Object && !secondary){
            return [image];
        } else {
            return image;
        }
    };
    var getAverageRating = function(restaurantId){
        var deferred = Q.defer();
        var dishAggregation = [
            {
                $match : {
                    restaurantId : new ObjectID(restaurantId),
                    rating : {
                        $exists : true
                    }
                }
            },
            {
                $group : {
                    _id : "$restaurantId",
                    averageRating : {$avg : "$rating"}
                }
            }
        ];
        new DishModel(dishAggregation).aggregate().then(function(result){
            deferred.resolve((result && result[0] && result[0].averageRating) ? result[0].averageRating : 0);
        }).catch(deferred.reject);
        return deferred.promise;
    };
    var createDish = function(model, userId, autoImport){
        var deferred = Q.defer();
        if(model.image && (model.restaurantId || model.placeId)){
            var preOps = [];
            if(!model.restaurantId && model.placeId){
                preOps.push(libraries.restaurantController.placeImport(model.placeId, userId));
            }
            Q.all(preOps).then(function(preResults){
                var createOps = [];
                if(preResults[0]){
                    model.restaurantId = preResults[0]._id;
                }
                var preModel = {
                    image : _ensureImageStructure(model.image),
                    userId : userId || model.userId,
                    restaurantId : new ObjectID(model.restaurantId),
                    categories : model.categories,
                    status : (autoImport) ? "unfiltered" : "accepted"
                };
                if(model.rating){
                    preModel.rating = model.rating;
                }
                var insertModel = new DishModel(preModel, true);
                createOps.push(new DishModel().insertOne(insertModel));
                if(model.categories){
                    createOps.push(libraries.restaurantController.addRestaurantCategories(model.restaurantId, model.categories));
                }
                if(model.rating){
                    createOps.push(libraries.restaurantController.updateRating(model.restaurantId));
                }
                Q.all(createOps).then(function(createResults){
                    var resultModel = createResults[0];
                    resultModel.likes = 0;
                    resultModel.comments = [];
                    if(model.comment){
                        var commentModel = new CommentModel({
                            comment : model.comment,
                            userId : userId,
                            dishId : resultModel._id
                        }, true);
                        new CommentModel().insertOne(commentModel).then(function(newComment){
                            resultModel.comments.push(newComment);
                            deferred.resolve(resultModel);
                        }).catch(deferred.reject);
                    } else {
                        deferred.resolve(resultModel);
                    }
                }).catch(deferred.reject);
            }).catch(deferred.reject);
        } else {
            deferred.reject("Insufficient parameters in the body (image, restaurantId or placeId)");
        }
        return deferred.promise;
    };
    var searchDishes = function(searchQuery, currentUser){
        var deferred = Q.defer();
        searchQuery = searchQuery || {};
        searchQuery.status = "accepted";
        if(searchQuery._id && searchQuery._id instanceof Array){
            searchQuery._id = {$in : searchQuery._id.map(_stringsToObjectIds)};
        } else if(searchQuery._id){
            searchQuery._id = new ObjectID(searchQuery._id);
        }
        if(searchQuery.userId && searchQuery.userId instanceof Array){
            searchQuery.userId = {$in : searchQuery.userId.map(_stringsToObjectIds)};
        } else if(searchQuery.userId){
            searchQuery.userId = new ObjectID(searchQuery.userId);
        }
        if(searchQuery.restaurantId && searchQuery.restaurantId instanceof Array){
            searchQuery.restaurantId = {$in : searchQuery.restaurantId.map(_stringsToObjectIds)};
        } else if(searchQuery.restaurantId){
            searchQuery.restaurantId = new ObjectID(searchQuery.restaurantId);
        }
        new DishModel(searchQuery)
            .find({}, {$sort : {createdAt : -1}})
            .then(function(dishes){
                var userIds = dishes.map(function(dish){
                    return dish.userId;
                });
                var dishIds = dishes.map(function(dish){
                    return dish._id;
                });
                var ops = [
                    userController.searchUser({_id : {$in : userIds}}),
                    new LikeModel({dishId : {$in : dishIds}, like : true}).find(),
                    new CommentModel({dishId : {$in : dishIds}}).find({}, {$sort : {createdAt : -1}, $limit : 2}),
                    new LikeModel({dishId : {$in : dishIds}, userId : currentUser, like : true}).find()
                ];
                Q.all(ops).then(function(results){
                    var users = _toObject(results[0].users.map(function(item){return {_id : item._id, userName: item.userName, profile : item.profile}; }), "_id");
                    var likes = _countPerOccurrence(results[1], "dishId");
                    var comments = _groupBy(results[2], "dishId");
                    var currentUserLikes = _groupBy(results[3], "dishId");
                    dishes = dishes.map(function(dish){
                        if(dish.categories){
                            dish.categories = dish.categories.reverse();
                        }
                        dish.likes = likes[dish._id] || 0;
                        dish.user = users[dish.userId];
                        dish.comments = comments[dish._id] || [];
                        dish.currentUserLike = (currentUserLikes[dish._id] && currentUserLikes[dish._id] instanceof Object);
                        dish.image = _ensureImageStructure(dish.image);
                        return dish;
                    });
                    deferred.resolve({dishes : dishes});
                }).catch(deferred.reject);
            })
            .catch(deferred.reject);
        return deferred.promise;
    };
    var getDish = function(dishId, currentUser){
        var deferred = Q.defer();
        new DishModel({_id : dishId})
            .findOne()
            .then(function(dish){
                if(!dish){
                    deferred.reject("Dish not found");
                } else {
                    dish.image = _ensureImageStructure(dish.image);
                    var ops = [
                        userController.getUser({_id : dish.userId}),
                        new LikeModel({dishId : dish._id, like : true}).count(),
                        new CommentModel({dishId : dish._id}).find({}, {$sort:{createdAt:-1}}),
                        new LikeModel({dishId : dish._id, like : true, userId : currentUser}).findOne()
                    ];
                    if(currentUser){
                        ops.push(new VisitCountModel({userId : currentUser, restaurantId : new ObjectID(dish.restaurantId)}).findOneAndUpdate({$inc : {count : 1}}, {upsert : true}));
                    }
                    Q.all(ops).then(function(results){
                        var user = results[0].user;
                        var likes = results[1];
                        var comments = results[2];
                        dish.user = user;
                        dish.likes = likes;
                        dish.comments = comments;
                        dish.currentUserLike = (results[3] && results[3] instanceof Object);
                        deferred.resolve(dish);
                    }).catch(deferred.reject);
                }
            })
            .catch(deferred.reject);
        return deferred.promise;
    };
    var likeDish = function(dishId, model, userId){
        var deferred = Q.defer();
        var like = (model.like && (model.like === true || model.like === "true"));
        Q.all([
            getDish(dishId),
            userController.adminReadUser(userId)
        ]).then(function(readResults){
            var dish = readResults[0];
            var likingUser = readResults[1];
            if(!dish){
                deferred.reject("Dish not found");
            } else {
                userController.adminReadUser(dish.userId).then(function(ownerUser){
                    var dishId = dish._id;
                    var query = {
                        dishId : dishId,
                        userId : userId
                    };
                    var model = {
                        like : like,
                        dishId : dishId,
                        userId : userId,
                        createdAt : new Date()
                    };
                    var writeOps = [
                        new LikeModel(query).findOneAndUpdate(model, {upsert : true})
                    ];
                    if(like){
                        var pushCount = (ownerUser.pushCount) ? ownerUser.pushCount + 1 : 1;
                        var userAlias = (likingUser && likingUser.userName) ? likingUser.userName : (likingUser && likingUser.profile && likingUser.profile.email) ? likingUser.profile.email : "Someone";
                        var pushMessage = userAlias + " has liked one of your uploaded dishes!";
                        var activityModel = new ActivityModel({
                            userId : new ObjectID(dish.userId),
                            relatedUser : new ObjectID(userId),
                            relatedDish : new ObjectID(dishId),
                            userAlias : userAlias,
                            userPhoto : (likingUser && likingUser.profile && likingUser.profile.pictures) ? likingUser.profile.pictures[0] : null,
                            dishPhoto : dish.image,
                            message : "Peppered your photo",
                            type : "like",
                            seen : false
                        }, true);
                        writeOps.push(new ActivityModel().insertOne(activityModel));
                        if(ownerUser.deviceToken){
                            writeOps.push(push(ownerUser.deviceToken, pushMessage, pushCount, userId.toString(), dishId.toString()));
                            writeOps.push(userController.adminUpdateUser(ownerUser._id, {pushCount : pushCount}));
                        }
                    }
                    Q.all(writeOps).then(function(results){
                        deferred.resolve({like : results[0], userId : userId});
                    }).catch(deferred.reject);
                }).catch(deferred.reject);
            }
        }).catch(deferred.reject);
        return deferred.promise;
    };
    var getLikedDishes = function (userId) {
        var deferred = Q.defer();
        var query = {userId : userId, like : true};
        new LikeModel(query).find().then(function(foundLikes){
            var dishIds = foundLikes.map(function(item){
                return item.dishId;
            });
            searchDishes({_id : dishIds}, userId).then(deferred.resolve).catch(deferred.reject);
        }).catch(deferred.reject);
        return deferred.promise;
    };
    var commentDish = function(dishId, model, userId){
        var deferred = Q.defer();
        var comment = model.comment;
        Q.all([
            getDish(dishId),
            userController.getUser({_id : userId})
        ]).then(function(results){
            var dish = results[0];
            var user = results[1].user;
            if(!dish){
                deferred.reject("Dish not found");
            } else {
                var dishId = dish._id;
                var query = {
                    dishId : dishId,
                    userId : userId
                };
                var model = {
                    comment : comment,
                    dishId : dishId,
                    userId : userId,
                    userName : user.userName,
                    createdAt : new Date()
                };
                new CommentModel(query)
                    .insertOne(model)
                    .then(deferred.resolve).catch(deferred.reject);
            }
        }).catch(deferred.reject);
        return deferred.promise;
    };
    var _toObject = function(array, param){
        var object = {};
        array.forEach(function(item){
            object[item[param]] = item;
        });
        return object;
    };
    var _groupBy = function(array, param){
        var object = {};
        array.forEach(function(item){
            if(!object[item[param]]){
                object[item[param]] = [];
            }
            object[item[param]].push(item);
        });
        return object;
    };
    var _countPerOccurrence = function(array, param){
        return array.reduce(function(totals, currentValue){
            if(!totals[currentValue[param]]){
                totals[currentValue[param]] = 0;
            }
            totals[currentValue[param]] ++;
            return totals;
        }, {});
    };
    var flagDish = function(dishId, model, currentUser){
        var deferred = Q.defer();
        dishId = new ObjectID(dishId);
        new DishModel({_id : dishId}).findOne().then(function(dish){
            if(!dish){
                deferred.reject("Dish not found");
            } else {
                var reportModel = {
                    motive : model.motive,
                    reportedDish : dishId,
                    reportingUser : currentUser,
                    solved : false
                };
                reportsController.createReport(reportModel).then(deferred.resolve).catch(deferred.reject);
            }
        }).catch(deferred.reject);
        return deferred.promise;
    };
    var adminReadDish = function (dishId){
        var deferred = Q.defer();
        Q.all([
            new DishModel({_id : dishId}).findOne(),
            new CommentModel({dishId : new ObjectID(dishId)}).find({}, {$sort : {createdAt : -1}}),
            new ReportModel({reportedDish : new ObjectID(dishId)}).find({}, {$sort : {createdAt : -1}}),
            new LikeModel({dishId : new ObjectID(dishId), like : true}).count()
        ]).then(function(results){
            var dish = results[0];
            dish.image = _ensureImageStructure(dish.image);
            dish.comments = results[1];
            dish.reports = results[2];
            dish.likes = results[3];
            deferred.resolve(dish);
        }).catch(deferred.reject);
        return deferred.promise;
    };
    var adminReadDishes = function (searchQuery){
        var deferred = Q.defer();
        searchQuery = searchQuery || {};
        for(var key in searchQuery){
            if(searchQuery.hasOwnProperty(key) && key == "restaurantId"){
                searchQuery[key] = new ObjectID(searchQuery[key]);
            }
        }
        Q.all([
            new DishModel(searchQuery).find(),
            new DishModel(searchQuery).count()
        ]).then(function(results){
            deferred.resolve({results : results[0].map(function(dish){ dish.image = _ensureImageStructure(dish.image); return dish; }), total : results[1]});
        }).catch(deferred.reject);
        return deferred.promise;
    };
    var adminUpdateDish = function (dishId, model){
        var deferred = Q.defer();
        var preOps = [];
        var query = {
            _id : dishId
        };
        if(model.restaurantId){
            model.restaurantId = new ObjectID(model.restaurantId);
            if(model.categories){
                preOps.push(libraries.restaurantController.addRestaurantCategories(model.restaurantId, model.categories));
            }
        }
        if(model.userId){model.userId = new ObjectID(model.userId);}
        Q.all(preOps).then(function(){
            new DishModel(query)
                .findOneAndUpdate(model)
                .then(function(result){
                    if(result){
                        deferred.resolve({dish : result});
                    } else {
                        deferred.reject("Dish not found");
                    }
                })
                .catch(deferred.reject);
        }).catch(deferred.reject);
        return deferred.promise;
    };
    var adminUpdateDishStatusMulti = function (dishIds, newStatus){
        var deferred = Q.defer();
        var query = {
            _id : {$in : dishIds.map(function(item){return new ObjectID(item)})}
        };
        new DishModel(query)
            .updateMany({$set : {status : newStatus}})
            .then(function(result){
                if(result){
                    deferred.resolve({dishes : result});
                } else {
                    deferred.reject("Dish not found");
                }
            })
            .catch(deferred.reject);
        return deferred.promise;
    };
    var adminUpdateDishStatus = function (dishId, newStatus){
        var deferred = Q.defer();
        var query = {
            _id : dishId
        };
        new DishModel(query)
            .findOneAndUpdate({$set : {status : newStatus}})
            .then(function(result){
                if(result){
                    deferred.resolve({dish : result});
                } else {
                    deferred.reject("Dish not found");
                }
            })
            .catch(deferred.reject);
        return deferred.promise;
    };
    var adminDeleteDish = function (dishId){
        var deferred = Q.defer();
        if(dishId){
            if(dishId instanceof Array){
                dishId = dishId.map(function(id){ return new ObjectID(id); });
            } else {
                dishId = [new ObjectID(dishId)];
            }
            Q.all([
                new LikeModel({dishId : {$in : dishId}}).deleteMany(),
                new CommentModel({dishId : {$in : dishId}}).deleteMany(),
                new ReportModel({reportedDish : {$in : dishId}}).deleteMany(),
                new DishModel({_id : {$in : dishId}}).deleteMany()
            ]).then(function(){
                deferred.resolve({removed : "ok"})
            }).catch(deferred.reject)
        } else {
            deferred.reject("No dishId provided")
        }
        return deferred.promise;
    };
    var adminDeleteComment = function(commentId) {
        var deferred = Q.defer();
        if(commentId){
            new CommentModel({_id : commentId})
                .deleteOne()
                .then(function(){
                    deferred.resolve({removed : "ok"})
                })
                .catch(deferred.reject)
        } else {
            deferred.reject("No commentId provided")
        }
        return deferred.promise;
    };
    return {
        setLibraryElement : setLibraryElement,
        getAverageRating : getAverageRating,
        createDish : createDish,
        searchDishes : searchDishes,
        getDish : getDish,
        likeDish : likeDish,
        getLikedDishes : getLikedDishes,
        commentDish : commentDish,
        flagDish : flagDish,
        adminReadDish : adminReadDish,
        adminReadDishes : adminReadDishes,
        adminUpdateDish : adminUpdateDish,
        adminUpdateDishStatusMulti : adminUpdateDishStatusMulti,
        adminUpdateDishStatus : adminUpdateDishStatus,
        adminDeleteDish : adminDeleteDish,
        adminDeleteComment : adminDeleteComment
    }
};