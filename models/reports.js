"use strict";
module.exports = function(libraries){
    var dbServices = libraries.dbServices;
    var mongodb = require("mongodb");
    var ObjectID = mongodb.ObjectID;
    function Report(query, emptyModel){
        if(emptyModel === true){
            return new ReportModel(query);
        } else {
            return new dbServices.model("Report", query);
        }
    }
    function ReportModel(model) {
        if(model.motive){this.motive = model.motive;}
        if(model.solved || model.solved === false){this.solved = model.solved;}
        if(model.reportedDish){this.reportedDish = new ObjectID(model.reportedDish);}
        if(model.reportingUser){this.reportingUser = new ObjectID(model.reportingUser);}
        if(model.solvingUser){this.solvingUser = new ObjectID(model.solvingUser);}
        if(model.solvingDate){this.solvingDate = model.solvingDate;}
        if(model.solvingSolution){this.solvingSolution = model.solvingSolution;}
        this.createdAt = new Date();
    }

    dbServices.createIndex("Report", {reportedDish : 1, solved : 1}).catch(console.error);
    dbServices.createIndex("Report", {reportingUser : 1, solved : 1}).catch(console.error);
    dbServices.createIndex("Report", {solvingUser : 1}).catch(console.error);
    dbServices.createIndex("Report", {solvingDate : -1}).catch(console.error);
    dbServices.createIndex("Report", {createdAt : -1}).catch(console.error);
    return Report;
};