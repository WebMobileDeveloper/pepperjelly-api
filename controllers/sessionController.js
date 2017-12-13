"use strict";
module.exports = function(libraries){
    var Q = libraries.Q;
    var SessionModel = require("../models/session")(libraries);

    var createSession = function(userId, userRole, ip) {
        var deferred = Q.defer();
        new SessionModel({userId : userId}).findOne().then(function(existingSession){
            if(existingSession){
                deferred.resolve(existingSession);
            } else {
                var model = {
                    userId : userId,
                    userRole : userRole,
                    ip : ip,
                    timeStamp : new Date()
                };
                new SessionModel().insertOne(model).then(deferred.resolve).catch(deferred.reject);
            }
        }).catch(deferred.reject);
        return deferred.promise;
    };
    var closeSession = function(sessionId){
        var deferred = Q.defer();
        new SessionModel({_id : sessionId}).deleteOne().then(deferred.resolve).catch(deferred.reject);
        return deferred.promise;
    };
    var closeAllSessions = function(userId){
        var deferred = Q.defer();
        new SessionModel({userId : userId}).deleteMany().then(deferred.resolve).catch(deferred.reject);
        return deferred.promise;
    };
    var validateSession = function(sessionId){
        var deferred = Q.defer();
        if(sessionId){
            new SessionModel({_id : sessionId}).findOne().then(function(existingSession){
                if(existingSession){
                    deferred.resolve(existingSession);
                } else {
                    deferred.reject(new Error("Invalid session"));
                }
            }).catch(deferred.reject);
        } else {
            deferred.reject(new Error("Invalid session"));
        }
        return deferred.promise;
    };
    var getSession = function(userId) {
        var deferred = Q.defer();
        new SessionModel({userId: userId}).findOne().then(deferred.resolve).catch(deferred.reject);
        return deferred.promise;
    };
    return {
        createSession : createSession,
        closeSession : closeSession,
        closeAllSessions : closeAllSessions,
        validateSession : validateSession,
        getSession : getSession
    };
};