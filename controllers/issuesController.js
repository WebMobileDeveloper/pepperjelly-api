"use strict";
module.exports = function(libraries){
    var Q = libraries.Q;
    var mongodb = require("mongodb");
    var mailSettings = libraries.settings.sendgrid;
    var sendgrid = require("sendgrid")(mailSettings.apikey);
    var ObjectID = mongodb.ObjectID;
    var IssueModel = require("../models/issues")(libraries);

    var emailIssue = function(model){
        var deferred = Q.defer();
        var reportSubject = (model.userId) ? "user" : "dish";
        var resourceId = (model.userId) ? model.userId : model.dishId;
        var link = mailSettings.linksBaseUrl + "#/" + reportSubject + "/detail/" + resourceId;
        var email = new sendgrid.Email({
            to : "team@pepperjellyapp.com",
            from : mailSettings.mailSender,
            subject : "A " + reportSubject + " has been reported",
            html :  "<p>PepperJelly team:</p>" +
                    "<p>The " + reportSubject + " with ID <b><a href='" + link + "' target='_blank'>" + resourceId + "</a></b> has been reported, please check it out in the dashboard.</p>" +
                    "<p>The motive is: <br/><b>" + model.motive + "</b>.</p>" +
                    "<p>The PepperJelly Team</p>"
        });
        sendgrid.send(email, function(err, json) {
            if(err){
                deferred.reject(err);
            } else {
                deferred.resolve(json);
            }
        });
        return deferred.promise;
    };
    var createIssue = function(model) {
        var deferred = Q.defer();
        var issue = new IssueModel(model, true);
        Q.all([
            new IssueModel().insertOne(issue),
            emailIssue(model)
        ]).then(function(results){
            deferred.resolve(results[0]);
        }).catch(deferred.reject);
        return deferred.promise;
    };
    var deleteIssue = function(reportId) {
        var deferred = Q.defer();
        var query = {reportId : new ObjectID(reportId)};
        new IssueModel(query).deleteOne().then(deferred.resolve).catch(deferred.reject);
        return deferred.promise;
    };
    var adminReadIssues = function(searchQuery) {
        var deferred = Q.defer();
        searchQuery = searchQuery || {};
        if(searchQuery.dishId){ searchQuery.dishId = new ObjectID(searchQuery.dishId);}
        Q.all([
            new IssueModel(searchQuery).find(),
            new IssueModel(searchQuery).count()
        ]).then(function(results){
            deferred.resolve({results : results[0], total : results[1]});
        }).catch(deferred.reject);
        return deferred.promise;
    };
    return {
        createIssue : createIssue,
        deleteIssue : deleteIssue,
        adminReadIssues : adminReadIssues
    }
};