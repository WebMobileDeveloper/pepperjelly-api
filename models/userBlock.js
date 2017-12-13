"use strict";
module.exports = function(libraries){
    var dbServices = libraries.dbServices;
    function userBlock(query, emptyModel){
        if(emptyModel === true){
            return new UserBlockModel(query);
        } else {
            return new dbServices.model("UserBlock", query);
        }
    }
    function UserBlockModel(model){
        this.userId = model.userId || null;
        this.blockedUser = model.blockedUser || null;
        this.createdAt = new Date();
    }
    dbServices.createIndex("UserBlock", {blockedUser : 1}, {}).catch(console.error);
    dbServices.createIndex("UserBlock", {userId : 1}, {}).catch(console.error);
    return userBlock;
};