"use strict";
module.exports = function(libraries){
    var dbServices = libraries.dbServices;
    var mongodb = require("mongodb");
    var ObjectID = mongodb.ObjectID;
    function Issues(query, emptyModel){
        if(emptyModel === true){
            return new IssuesModel(query);
        } else {
            return new dbServices.model("Issues", query);
        }
    }
    function IssuesModel(model) {
        if(model.dishId){this.dishId = new ObjectID(model.dishId);}
        if(model.userId){this.userId = new ObjectID(model.userId);}
        if(model.reportId){this.reportId = new ObjectID(model.reportId);}
        if(model.motive){this.motive = model.motive;}
        this.createdAt = new Date();
    }

    dbServices.createIndex("Issues", {dishId : 1}).catch(console.error);
    dbServices.createIndex("Issues", {userId : 1}).catch(console.error);
    dbServices.createIndex("Issues", {reportId : 1}).catch(console.error);
    dbServices.createIndex("Issues", {createdAt : -1}).catch(console.error);
    return Issues;
};