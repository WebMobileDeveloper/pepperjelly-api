"use strict";
module.exports = function(libraries){
    var Q = libraries.Q;
    var mongodb = require("mongodb");
    var ObjectID = mongodb.ObjectID;
    var issuesController = libraries.issuesController;
    var ReportModel = require("../models/reports")(libraries);

    var createReport = function(model){
        var deferred = Q.defer();
        var reportModel = new ReportModel(model, true);
        reportModel._id = new ObjectID();
        var issueModel = {dishId : model.reportedDish, reportId : reportModel._id, motive : model.motive};
        Q.all([
            new ReportModel().insertOne(reportModel),
            issuesController.createIssue(issueModel)
        ]).then(function(results){
            deferred.resolve(results[0]);
        }).catch(deferred.reject);
        return deferred.promise;
    };
    var solveReport = function(reportId, currentUser){
        var deferred = Q.defer();
        var query = {_id : reportId};
        var document = {$set : {solved : true, solvingUser : currentUser, solvingDate : new Date()}};
        Q.all([
            new ReportModel(query).findOneAndUpdate(document),
            issuesController.deleteIssue(reportId)
        ]).then(function(responses){
            deferred.resolve(responses[0]);
        }).catch(deferred.reject);
        return deferred.promise;
    };
    return {
        createReport : createReport,
        solveReport : solveReport
    }
};