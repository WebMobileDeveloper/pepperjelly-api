"use strict";
module.exports = function(libraries){
    var dbServices = libraries.dbServices;
    function Comments(query, emptyModel){
        if(emptyModel === true){
            return new CommentsModel(query);
        } else {
            return new dbServices.model("Comments", query);
        }
    }
    function CommentsModel(model) {
        if(model.comment){this.comment = model.comment;}
        if(model.userId){this.userId = model.userId;}
        if(model.dishId){this.dishId = model.dishId;}
        this.createdAt = new Date();
    }

    dbServices.createIndex("Comments", {userId : 1}).catch(console.error);
    dbServices.createIndex("Comments", {dishId : 1}).catch(console.error);
    return Comments;
};