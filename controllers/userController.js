var algoliasearch = require('algoliasearch');
var client = algoliasearch('48EUWY9NWN', '8c5aed3289990afc540f207b319b4408');
var index = client.initIndex('pepperjelly');

"use strict";
module.exports = function(libraries){
    var Q = libraries.Q;
    var mail = libraries.mail;
    var bcrypt = libraries.bcrypt;
    var ObjectID = require("mongodb").ObjectID;
    var sessionController = libraries.sessionController;
    var issuesController = libraries.issuesController;
    var push = libraries.pushServices;
    var UserModel = require("../models/user")(libraries);
    var UserReportModel = require("../models/userReport")(libraries);
    var UserBlockModel = require("../models/userBlock")(libraries);
    var FollowModel = require("../models/follow")(libraries);
    var DishModel = require("../models/dish")(libraries);
    var LikeModel = require("../models/like")(libraries);
    var ActivityModel = require("../models/activity")(libraries);
    var RestaurantModel = require("../models/restaurant")(libraries);
    var randomString = require("randomstring");
    var defaultSearchRange = 40233.6;

    var setLibraryValue = function(key, value){
        libraries[key] = value;
    };
    var register = function(model, ip) {
        var deferred = Q.defer();
        var userName = (model.userName) ? model.userName.trim() : null;
        var userNameLower = (model.userName) ? model.userName.trim().toLowerCase() : null;
        var role = 1;
        var banned = model.banned;
        var password = model.password;
        var facebookId = model.facebookId || null;
        var googleId = model.googleId || null;
        var profile = model.profile || {};
        var email = (profile.email) ? profile.email : null;
        var emailLower = (profile.email) ? profile.email.toLowerCase() : null;
        var query = {$or : []};
        if(facebookId) {query.$or.push({"facebookId" : facebookId});}
        if(googleId){query.$or.push({"googleId" : googleId});}
        if(userNameLower){query.$or.push({"userNameLower" : userNameLower});}
        if(emailLower){query.$or.push({"profile.emailLower" : emailLower});}
        new UserModel(query)
            .findOne()
            .then(function(foundModel){
                if(foundModel){
                    delete foundModel.salt;
                    delete foundModel.password;
                }
                if(foundModel && !facebookId && !googleId){
                    deferred.reject("user name already exists");
                } else if(password && password.length < 6 && !facebookId && !googleId) {
                    deferred.reject("password need to be more than 6 characters!");
                } else if(foundModel && (facebookId || googleId)){
                    var updateModel = {
                        $set : {"profile.fullName" : profile.fullName}
                    };
                    if(facebookId){ updateModel.$set["facebookId"] = facebookId; }
                    if(googleId){ updateModel.$set["googleId"] = googleId; }
                    if(profile.pictures){ updateModel.$addToSet = {"profile.pictures" : {$each : profile.pictures}};}
                    if(profile.email){ updateModel.$set["profile.email"] = profile.email;}
                    if(profile.emailLower){ updateModel.$set["profile.emailLower"] = profile.emailLower;}
                    new UserModel(query).findOneAndUpdate(updateModel).then(function(updatedModel){
                        sessionController.createSession(updatedModel._id, updatedModel.role, ip).then(function(newSession){
                            deferred.resolve({
                                result : "user already exists",
                                user : updatedModel,
                                authToken : newSession._id
                            });
                        }).catch(deferred.reject);
                    }).catch(deferred.reject);
                } else {
                    var salt = bcrypt.genSaltSync(10);
                    var newModel = new UserModel({
                        userName : userName,
                        userNameLower : userNameLower,
                        role : role,
                        banned : banned,
                        range : 80467.2,
                        profile : profile
                    }, true);
                    if(facebookId) {
                        newModel.facebookId = facebookId;
                        newModel.password = salt;
                    } else if(googleId){
                        newModel.googleId = googleId;
                        newModel.password = salt;
                    } else {
                        newModel.password = bcrypt.hashSync(password, salt);
                        newModel.salt = salt;
                        delete newModel.facebookId;
                    }
                    new UserModel(newModel).insertOne().then(function(user){
                        delete user.salt;
                        delete user.password;
                        user.userNew = true;
                        
                        user.type = "user";
                        index.addObject(user, user._id, function(err, content) {});

                        sessionController.createSession(user._id, user.role, ip).then(function(newSession){
                            deferred.resolve({
                                result : "user created successfully",
                                user : user,
                                authToken : newSession._id
                            });
                        }).catch(deferred.reject);
                    }).catch(deferred.reject);
                }
            }).catch(deferred.reject);
        return deferred.promise;
    };
    var login = function(userName, password, ip){
        var deferred = Q.defer();
        userName = userName || "";
        var query = {
            $or : [
                {"userNameLower" : userName.toLowerCase()},
                {"profile.emailLower" : userName.toLowerCase()}
            ]
        };
        new UserModel(query)
            .findOne()
            .then(function(user){
                if(!user || user.password != bcrypt.hashSync(password, user.salt)){
                    deferred.reject("Invalid user name or password");
                } else {
                    delete user.salt;
                    delete user.password;
                    sessionController.createSession(user._id, user.role, ip).then(function(newSession){
                        deferred.resolve({
                            result : "user found",
                            user : user,
                            authToken : newSession._id
                        });
                    }).catch(deferred.reject);
                }
            }).catch(deferred.reject);
        return deferred.promise;
    };
    var logout = function (sessionId) {
        var deferred = Q.defer();
        sessionController.closeSession(sessionId).then(function(){
            deferred.resolve({});
        }).catch(deferred.reject);
        return deferred.promise;
    };
    var forgotPassword = function(model){
        var deferred = Q.defer();
        model = model || {};
        var newPassword = randomString.generate(8);
        var salt = bcrypt.genSaltSync(10);
        var updateModel = {
            $set : {
                password : bcrypt.hashSync(newPassword, salt),
                salt : salt
            }
        };
        if(model.userName) {
            var query = {
                $or : [
                    {"userNameLower" : model.userName.trim().toLowerCase()},
                    {"profile.emailLower" : model.userName.trim().toLowerCase()}
                ]
            };
            new UserModel(query)
                .findOneAndUpdate(updateModel)
                .then(function (result) {
                    var user = result;
                    if (user && user.profile && user.profile.email) {
                        mail.send({
                            to: user.profile.email,
                            subject: "Password reset",
                            text: "Your password has been reset to a temporary one: \n\n" + newPassword
                        }).then(function () {
                            deferred.resolve({result: "Password has been reset and email has been sent"});
                        }).catch(deferred.reject);
                    } else {
                        deferred.reject("User not found");
                    }
                })
                .catch(deferred.reject);
        } else {
            deferred.reject("No search criteria provided");
        }
        return deferred.promise;
    };
    var passwordChange = function(searchQuery, model, currentUserId, currentUserRole){
        var deferred = Q.defer();
        var query = {};
        if(searchQuery.userName){
            query.userNameLower = searchQuery.userName.trim().toLowerCase();
        } else {
            query._id = currentUserId;
        }
        var password = model.password;
        var salt = bcrypt.genSaltSync(10);
        if(Object.keys(query).length > 0){
            new UserModel(query)
                .findOne()
                .then(function (user) {
                    if (user._id.toString() == currentUserId.toString() || currentUserRole == 2) {
                        var hash = bcrypt.hashSync(password, salt);
                        if (!user.facebookId || user.facebookId == null && password != null) {
                            new UserModel(query)
                                .findOneAndUpdate({$set: {password: hash, salt : salt}})
                                .then(function (model) {
                                    if (model) {
                                        delete model.salt;
                                        delete model.password;
                                        deferred.resolve({user: model});
                                    } else {
                                        deferred.reject("User not found");
                                    }
                                });
                        } else {
                            deferred.reject("Facebook user");
                        }
                    } else {
                        deferred.reject("Not allowed to change password for this user");
                    }
                })
                .catch(deferred.reject);
        } else {
            deferred.reject("No search criteria provided");
        }
        return deferred.promise;
    };
    var modifyUser = function(model, currentUserId, currentUserRole){
        var deferred = Q.defer();
        var query = {
            "_id" : currentUserId
        };
        if(Object.keys(query).length > 0){
            new UserModel(query)
                .findOne()
                .then(function(user){
                    if(user && user._id.toString() == currentUserId.toString() || currentUserRole == 2){
                        var updateModel = {
                            $set : {
                                updatedAt : new Date()
                            }
                        };
                        if(model.userName){ updateModel.$set["userName"] = model.userName.trim();}
                        if(model.userName){ updateModel.$set["userNameLower"] = model.userName.trim().toLowerCase();}
                        if(model.deviceToken){ updateModel.$set["deviceToken"] = model.deviceToken;}
                        if(model.longitude && model.latitude){ updateModel.$set["location"] = [+model.longitude, +model.latitude];}
                        if(model.customLongitude && model.customLatitude){ updateModel.$set["customLocation"] = [+model.customLongitude, +model.customLatitude];}
                        if(model.location){ updateModel.$set["location"] = [+model.location[0], +model.location[1]];}
                        if(model.locationName){ updateModel.$set["locationName"] = model.locationName;}
                        if(model.customLocation){ updateModel.$set["customLocation"] = [+model.customLocation[0], +model.customLocation[1]];}
                        if(model.customLocationName){ updateModel.$set["customLocationName"] = model.customLocationName;}
                        if(model.useCustomLocation || model.useCustomLocation === false){ updateModel.$set["useCustomLocation"] = model.useCustomLocation;}
                        if(model.range){ updateModel.$set["range"] = model.range;}
                        if(model.categories){ updateModel.$set["categories"] = model.categories;}
                        if(model.email){ updateModel.$set["profile.email"] = model.email;}
                        if(model.email){ updateModel.$set["profile.emailLower"] = model.email.toLowerCase();}
                        if(model.pictures){ updateModel.$set["profile.pictures"] = model.pictures;}
                        if(model.fullName){ updateModel.$set["profile.fullName"] = model.fullName;}
                        new UserModel(query)
                            .findOneAndUpdate(updateModel)
                            .then(function(result){
                                if(result){
                                    
                                    result.type = "user";
                                    index.addObject(result, currentUserId, function(err, content) {});

                                    delete result.password;
                                    delete result.salt;
                                    deferred.resolve({user : result});
                                } else {
                                    deferred.reject("User not found");
                                }
                            })
                            .catch(deferred.reject);
                    } else {
                        deferred.reject("Not allowed to modify this profile");
                    }
                })
                .catch(deferred.reject);
        } else {
            deferred.reject("No search criteria provided");
        }
        return deferred.promise;
    };
    var getUser = function(model, currentUser, userRole){
        var deferred = Q.defer();
        var getReports = (model.getReports === true);
        var profileProjection = {_id : 1, userName : 1, profile : 1, deviceToken : 1, pushCount : 1};
        delete model.getReports;
        if(Object.keys(model).length <= 0) {
            model = {_id : currentUser};
            profileProjection = false;
        }
        new UserModel(model).findOne(profileProjection).then(function(user){
            if(user){
                delete user.salt;
                delete user.password;
                var additionalOps = [
                    new FollowModel({followedUser : user._id, follow : true}).count(),
                    new FollowModel({userId : user._id, follow : true}).count(),
                    new DishModel({userId : user._id, status : "accepted"}).count(),
                    new LikeModel({userId : user._id, like : true}).count(),
                    new RestaurantModel({userId : user._id}).count()
                ];
                if(getReports){
                    additionalOps.push(new UserReportModel({reportedUser : user._id.toString()}).find());
                }
                Q.all(additionalOps).then(function(results){
                    var followers = results[0];
                    var followed = results[1];
                    var dishes = results[2];
                    var likes = results[3];
                    var restaurants = results[4];
                    var allReports = results[5];
                    user.stats = {
                        followers : followers,
                        followed : followed,
                        dishes : dishes,
                        likes : likes,
                        restaurants : restaurants
                    };
                    if(getReports){
                        user.reports = allReports.map(function(item){
                            if(userRole != 2){ delete item.userId;}
                            delete item.reportedUser;
                            delete item._id;
                            return item;
                        });
                    }
                    deferred.resolve({user : user});
                }).catch(deferred.reject);
            } else {
                deferred.resolve({user : null});
            }
        }).catch(deferred.reject);
        return deferred.promise;
    };
    var searchUser = function(model){
        var deferred = Q.defer();
        if(model.search){
            model.userNameLower =  new RegExp(model.search, "gi");
            delete model.search;
        }
        var query = parseQuery(model) || {};
        new UserModel(query)
            .find()
            .then(function(users){
                deferred.resolve({users : users.map(function(user){
                    delete user.salt;
                    delete user.password;
                    return user;
                })});
            })
            .catch(deferred.reject);
        return deferred.promise;
    };
    var parseQuery = function(query){
        var numeric = ["longitude", "latitude", "range"];
        var profile = ["pictures", "fullName", "email"];
        for(var key in query){
            if(query.hasOwnProperty(key)){
                if(numeric.indexOf(key) != -1){
                    query[key] = +query[key];
                }
                if(profile.indexOf(key) != -1){
                    query["profile." + key] = query[key];
                    delete query[key];
                }
                if(key.indexOf("_") == 0 && key != "_id"){
                    delete query[key];
                }
            }
        }
        if(query.longitude && query.latitude){
            query.location = {
                $near : {
                    $geometry: {
                        type: "Point" ,
                        coordinates: [ query.longitude , query.latitude ]
                    },
                    $maxDistance: query.range || defaultSearchRange,
                    $minDistance: 0
                }
            };
            delete query.longitude;
            delete query.latitude;
            delete query.range;
        }
        return query;
    };
    var reportUser = function(model, userId){
        var deferred = Q.defer();
        var reportedUser = model.reportedUser;
        getUser({_id : reportedUser}).then(function(foundUser){
            if(foundUser.user && model.motive){
                model.reportingUser = userId;
                model.solved = false;
                var reportModel = new UserReportModel(model, true);
                reportModel._id = new ObjectID();
                var issueModel = {userId : new ObjectID(reportedUser), reportId : reportModel._id, motive : model.motive};
                Q.all([
                    new UserReportModel().insertOne(reportModel),
                    issuesController.createIssue(issueModel)
                ]).then(function(results){
                    deferred.resolve(results[0]);
                }).catch(deferred.reject);
            } else {
                deferred.reject("Reported user not found or no reason received.");
            }
        }).catch(deferred.reject);
        return deferred.promise;
    };
    var solveUserReport = function(reportId, currentUser){
        var deferred = Q.defer();
        var query = {_id : reportId};
        var document = {$set : {solved : true, solvingUser : currentUser, solvingDate : new Date()}};
        Q.all([
            new UserReportModel(query).findOneAndUpdate(document),
            issuesController.deleteIssue(reportId)
        ]).then(function(responses){
            deferred.resolve(responses[0]);
        }).catch(deferred.reject);
        return deferred.promise;
    };
    var blockUser = function(model, currentUser){
        var deferred = Q.defer();
        var blockedUser = new ObjectID(model.blockedUser);
        getUser({_id : blockedUser}).then(function(foundUser){
            if(foundUser.user){
                var newBlock = new UserBlockModel({
                    userId : currentUser,
                    blockedUser : blockedUser
                }, true);
                var followQuery = {$or:[
                    {userId : currentUser, followedUser : blockedUser},
                    {userId : blockedUser, followedUser : currentUser}
                ]};
                Q.all([
                    new UserBlockModel(newBlock).insertOne(),
                    new FollowModel(followQuery).deleteMany()
                ]).then(function(results){
                    deferred.resolve(results[0]);
                }).catch(deferred.reject);
            } else {
                deferred.reject("Blocked user not found.");
            }
        }).catch(deferred.reject);
        return deferred.promise;
    };
    var unblockUser = function(model, currentUser){
        var deferred = Q.defer();
        var blockedUser = model.blockedUser;
        var query = {userId : currentUser, blockedUser : new ObjectID(blockedUser)};
        new UserBlockModel(query)
            .deleteMany()
            .then(deferred.resolve)
            .catch(deferred.reject);
        return deferred.promise;
    };
    var getBlocked = function(currentUser){
        var deferred = Q.defer();
        new UserBlockModel({
            userId : new ObjectID(currentUser)
        }).find().then(function(result){
            if(result.length > 0){
                var ids = result.map(function(item){
                    return item.blockedUser;
                });
                searchUser({_id : {$in : ids}}).then(function(items){
                    deferred.resolve({blocked : items.users});
                }).catch(deferred.reject);
            } else {
                deferred.resolve({blocked : []});
            }
        }).catch(deferred.reject);
        return deferred.promise;
    };
    var followUser = function(model, currentUser){
        var deferred = Q.defer();
        var followedUser = new ObjectID(model.followedUser);
        var blockQuery = {$or:[
            {userId : currentUser, blockedUser : followedUser},
            {userId : followedUser, blockedUser : currentUser}
        ]};
        Q.all([
            getUser({_id : followedUser}),
            new UserBlockModel(blockQuery).findOne(),
            getUser({_id : currentUser}),
            new FollowModel({userId : followedUser, followedUser : currentUser}).findOne()
        ]).then(function(results){
            var foundUser = results[0];
            var blocking = results[1];
            var follower = results[2];
            var followBack = results[3];
            if(foundUser.user && !blocking){
                var query = {userId : currentUser, followedUser : followedUser};
                var pushCount = (foundUser.user.pushCount) ? foundUser.user.pushCount + 1 : 1;
                var userAlias = (follower && follower.user && follower.user.userName) ? follower.user.userName : (follower && follower.user && follower.user.profile && follower.user.profile.email) ? follower.user.profile.email : "Someone";
                var pushMessage = userAlias + " has started following you!";
                var activityQuery = {userId : new ObjectID(followedUser), relatedUser : new ObjectID(currentUser)};
                var activityModel = new ActivityModel({
                    userAlias : userAlias,
                    userPhoto : (follower && follower.user && follower.user.profile && follower.user.profile.pictures) ? follower.user.profile.pictures[0] : null,
                    followBack : (followBack instanceof Object),
                    message : "Followed you",
                    type : "follow",
                    seen : false
                }, true);
                var ownActivityUpdateQuery = {userId : new ObjectID(currentUser), relatedUser : new ObjectID(followedUser)};
                var writeOps = [
                    new FollowModel(query).findOneAndUpdate({$set : {follow : true}}, {upsert : true}),
                    new ActivityModel(activityQuery).findOneAndUpdate({$set : activityModel}, {upsert : true}),
                    new ActivityModel(ownActivityUpdateQuery).findOneAndUpdate({$set : {followBack : true}})
                ];
                if(foundUser.user && foundUser.user.deviceToken){
                    writeOps.push(push(foundUser.user.deviceToken, pushMessage, pushCount, currentUser.toString()));
                    writeOps.push(adminUpdateUser(foundUser.user._id, {pushCount : pushCount}));
                }
                Q.all(writeOps).then(function(writeResults){
                    deferred.resolve(writeResults[0]);
                }).catch(deferred.reject);
            } else {
                deferred.reject("Followed user not found");
            }
        }).catch(deferred.reject);
        return deferred.promise;
    };
    var unfollowUser = function(model, currentUser){
        var deferred = Q.defer();
        var followedUser = new ObjectID(model.followedUser);
        var query = {userId : currentUser, followedUser : followedUser};
        var activityFollowedQuery = {userId : new ObjectID(followedUser), relatedUser : new ObjectID(currentUser)};
        var activityCurrentQuery = {userId : new ObjectID(currentUser), relatedUser : new ObjectID(followedUser)};
        Q.all([
            new FollowModel(query).deleteMany(),
            new ActivityModel(activityFollowedQuery).deleteMany(),
            new ActivityModel(activityCurrentQuery).findOneAndUpdate({$set : {followBack : false}})
        ]).then(function(responses){
            deferred.resolve(responses[0]);
        }).catch(deferred.reject);
        return deferred.promise;
    };
    var getFollowers = function(userId, currentUser){
        var deferred = Q.defer();
        var userSearched = userId || currentUser;
        new FollowModel({
            followedUser : new ObjectID(userSearched), follow : true
        })
            .find()
            .then(function(result){
                if(result.length > 0){
                    var ids = result.map(function(item){
                        return item.userId;
                    });
                    searchUser({_id : {$in : ids}})
                        .then(function(items){
                            deferred.resolve({followers : items.users});
                        })
                        .catch(deferred.reject);
                } else {
                    deferred.resolve({followers : []});
                }
            })
            .catch(deferred.reject);
        return deferred.promise;
    };
    var getFollowing = function(userId, currentUser){
        var deferred = Q.defer();
        var userSearched = userId || currentUser;
        new FollowModel({
            userId : new ObjectID(userSearched), follow : true
        })
            .find()
            .then(function(result){
                if(result.length > 0){
                    var ids = result.map(function(item){
                        return item.followedUser;
                    });
                    searchUser({_id : {$in : ids}})
                        .then(function(items){
                            deferred.resolve({following: items.users})
                        })
                        .catch(deferred.reject);
                } else {
                    deferred.resolve({following : []});
                }
            })
            .catch(deferred.reject);
        return deferred.promise;
    };
    var getNewsFeed = function(currentUser){
        var deferred = Q.defer();
        var minDate = new Date();
        minDate.setDate(minDate.getDate() - 21);
        var readQuery = {
            userId : new ObjectID(currentUser),
            createdAt : {$gte : minDate}
        };
        var seenQuery = {
            userId : new ObjectID(currentUser),
            seen : false,
            createdAt : {$gte : minDate}
        };
        new ActivityModel(readQuery).find({}, {$sort : {createdAt : -1}}).then(function(results){
            Q.all([
                new ActivityModel(seenQuery).updateMany({$set : {seen : true}}),
                new UserModel({_id : currentUser}).findOneAndUpdate({$set : {pushCount : 0}})
            ]).then(function(){
                deferred.resolve({latestActivity : results});
            }).catch(deferred.reject);
        }).catch(deferred.reject);
        return deferred.promise;
    };
    var adminCreateUser = function (model, userRole) {
        var deferred = Q.defer();
        if(model && model instanceof Object && userRole == 2){
            if(model.password && model.password != "noPass"){
                model.salt = bcrypt.genSaltSync(10);
                model.password = bcrypt.hashSync(model.password, model.salt);
            } else {
                delete model.salt;
                delete model.password;
            }
            new UserModel(model).insertOne().then(function(user){
                delete user.salt;
                delete user.password;
                deferred.resolve(user);
            }).catch(deferred.reject);
        } else {
            deferred.reject("No valid model or user type to create a resource.");
        }
        return deferred.promise;
    };
    var adminReadUser = function(userId) {
        var deferred = Q.defer();
        Q.all([
            new UserModel({_id : userId}).findOne(),
            sessionController.getSession(new ObjectID(userId)),
            new UserReportModel({reportedUser : new ObjectID(userId)}).find()
        ]).then(function(results){
            var user = results[0];
            if(user && user.role == 1 || user._id.toString() == userId.toString()){
                user.session = results[1];
            }
            user.reports = results[2];
            deferred.resolve(user);
        }).catch(deferred.reject);
        return deferred.promise;
    };
    var adminReadUsers = function(searchQuery) {
        var deferred = Q.defer();
        searchQuery = searchQuery || {};
        if(searchQuery.search){
            searchQuery.name = new RegExp(searchQuery.search.toLowerCase());
            delete searchQuery.search;
        }
        Q.all([
            new UserModel(searchQuery).find(),
            new UserModel(searchQuery).count()
        ]).then(function(results){
            deferred.resolve({results : results[0], total : results[1]});
        }).catch(deferred.reject);
        return deferred.promise;
    };
    var adminUpdateUser = function(userId, model) {
        var deferred = Q.defer();
        var query = {
            _id : userId
        };
        if(model.password && model.password != "noPass"){
            model.salt = bcrypt.genSaltSync(10);
            model.password = bcrypt.hashSync(model.password, model.salt);
        } else {
            delete model.salt;
            delete model.password;
        }
        if(model.role){
            model.role = +model.role;
        }
        new UserModel(query)
            .findOneAndUpdate({$set:model})
            .then(function(result){
                if(result){
                    deferred.resolve({user : result});
                } else {
                    deferred.reject("User not found");
                }
            })
            .catch(deferred.reject);
        return deferred.promise;
    };
    var adminDeleteUser = function(userId) {
        var deferred = Q.defer();
        if(userId){
            new UserModel({_id : userId})
                .deleteOne()
                .then(deferred.resolve({removed : "ok"}))
                .catch(deferred.reject)
        } else {
            deferred.reject("No userId provided or userRole not an admin")
        }
        return deferred.promise;
    };
    var testPush = function(deviceToken, message, currentUser){
        return push(deviceToken, message, 1, currentUser.toString());
    };
    return {
        setLibraryValue : setLibraryValue,
        register : register,
        login : login,
        logout : logout,
        forgotPassword : forgotPassword,
        passwordChange : passwordChange,
        modifyUser : modifyUser,
        getUser : getUser,
        searchUser : searchUser,
        reportUser : reportUser,
        solveUserReport : solveUserReport,
        blockUser : blockUser,
        unblockUser : unblockUser,
        getBlocked : getBlocked,
        followUser : followUser,
        unfollowUser : unfollowUser,
        getFollowers : getFollowers,
        getFollowing : getFollowing,
        getNewsFeed : getNewsFeed,
        adminCreateUser : adminCreateUser,
        adminReadUser : adminReadUser,
        adminReadUsers : adminReadUsers,
        adminUpdateUser : adminUpdateUser,
        adminDeleteUser : adminDeleteUser,
        testPush : testPush
    };
};
