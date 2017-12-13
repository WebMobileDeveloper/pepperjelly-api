"use strict";
module.exports = function(libraries){
    var dbServices = libraries.dbServices;
    var mongodb = require("mongodb");
    var ObjectID = mongodb.ObjectID;
    function userReport(query, emptyModel){
        if(emptyModel === true){
            return new UserReportModel(query);
        } else {
            return new dbServices.model("UserReport", query);
        }
    }
    function UserReportModel(model){
        if(model.motive){this.motive = model.motive;}
        if(model.solved || model.solved === false){this.solved = model.solved;}
        if(model.reportedUser){this.reportedUser = new ObjectID(model.reportedUser);}
        if(model.reportingUser){this.reportingUser = new ObjectID(model.reportingUser);}
        if(model.solvingUser){this.solvingUser = new ObjectID(model.solvingUser);}
        if(model.solvingDate){this.solvingDate = model.solvingDate;}
        if(model.solvingSolution){this.solvingSolution = model.solvingSolution;}
        this.createdAt = new Date();
    }
    dbServices.createIndex("UserReport", {reportedUser : 1, solved : 1}, {}).catch(console.error);
    dbServices.createIndex("UserReport", {reportingUser : 1, solved : 1}, {}).catch(console.error);
    dbServices.createIndex("UserReport", {solvingUser : 1}, {}).catch(console.error);
    dbServices.createIndex("UserReport", {solvingDate : -1}, {}).catch(console.error);
    dbServices.createIndex("UserReport", {createdAt : -1}, {}).catch(console.error);
    return userReport;
};