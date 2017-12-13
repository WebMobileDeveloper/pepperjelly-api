"use strict";
module.exports = function(libraries){
    var Q = libraries.Q;
    var ReportModel = require("../models/reports")(libraries);

    var createReport = function(postId, model, currentUser){
        var deferred = Q.defer();
        new ReportModel()
            .insertOne({reportingUser : currentUser,
                motive : model.motive,
                reportedPost : postId,
                timeStamp : new Date()
            })
            .then(deferred.resolve)
            .catch(deferred.reject);
        return deferred.promise;
    };
    var readReport = function(reportId) {
        var deferred = Q.defer();
        new ReportModel({_id : reportId})
            .findOne()
            .then(deferred.resolve)
            .catch(deferred.reject);
        return deferred.promise;
    };
    var readReports = function(searchQuery) {
        var deferred = Q.defer();
        searchQuery = searchQuery || {};
        new ReportModel(searchQuery)
            .find()
            .then(deferred.resolve)
            .catch(deferred.reject);
        return deferred.promise;
    };
    return {
        createReport : createReport,
        readReport : readReport,
        readReports : readReports
    }
};