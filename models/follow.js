"use strict";
module.exports = function(libraries){
    var dbServices = libraries.dbServices;
    function Follow(query, emptyModel){
        if(emptyModel === true){
            return new FollowModel(query);
        } else {
            return new dbServices.model("Follow", query);
        }
    }
    function FollowModel(model) {
        if(model.userId){this.userId = model.userId;}
        if(model.followedUser){this.followedUser = model.followedUser;}
        this.follow = model.follow || false;
        this.createdAt = new Date();
    }

    dbServices.createIndex("Follow", {userId : 1}, {sparse : true}).catch(console.error);
    dbServices.createIndex("Follow", {followedUser : 1}, {sparse : true}).catch(console.error);
    return Follow;
};