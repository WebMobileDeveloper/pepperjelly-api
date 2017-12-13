"use strict";
module.exports = function(libraries){
    var dbServices = libraries.dbServices;
    function Activity(query, emptyModel){
        if(emptyModel === true){
            return new ActivityModel(query);
        } else {
            return new dbServices.model("Activity", query);
        }
    }
    function ActivityModel(model){
        if(model.userId){this.userId = model.userId;}
        if(model.relatedUser){this.relatedUser = model.relatedUser;}
        if(model.relatedDish){this.relatedDish = model.relatedDish;}
        if(model.userAlias){this.userAlias = model.userAlias;}
        if(model.userPhoto){this.userPhoto = model.userPhoto;}
        if(model.dishPhoto){this.dishPhoto = model.dishPhoto;}
        if(model.followBack || model.followBack === false){this.followBack = model.followBack;}
        if(model.message){this.message = model.message;}
        if(model.type){this.type = model.type;}
        if(model.seen || model.seen === false){this.seen = model.seen;}
        this.createdAt = new Date();
    }

    dbServices.createIndex("Activity", {userId : 1}).catch(console.error);
    dbServices.createIndex("Activity", {userId : 1, relatedUser : 1}).catch(console.error);
    return Activity;
};