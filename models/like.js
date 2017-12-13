"use strict";
module.exports = function(libraries){
    var dbServices = libraries.dbServices;
    function Like(query, emptyModel){
        if(emptyModel === true){
            return new LikeModel(query);
        } else {
            return new dbServices.model("Like", query);
        }
    }
    function LikeModel(model) {
        if(model.like){this.like = model.like;}
        if(model.userId){this.userId = model.userId;}
        if(model.dishId){this.dishId = model.dishId;}
        this.createdAt = new Date();
    }

    dbServices.createIndex("Like", {userId : 1}).catch(console.error);
    dbServices.createIndex("Like", {dishId : 1, like : 1}).catch(console.error);
    return Like;
};