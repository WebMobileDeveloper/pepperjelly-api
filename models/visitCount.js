"use strict";
module.exports = function(libraries){
    var dbServices = libraries.dbServices;
    function VisitCount(query, emptyModel){
        if(emptyModel === true){
            return new VisitCountModel(query);
        } else {
            return new dbServices.model("VisitCount", query);
        }
    }
    function VisitCountModel(model) {
        if(model.userId){this.userId = model.userId;}
        if(model.restaurantId){this.restaurantId = model.restaurantId;}
        if(model.count){this.count = model.count;}
        this.createdAt = new Date();
    }

    dbServices.createIndex("VisitCount", {userId : 1, restaurantId : 1}, {unique : 1}).catch(console.error);
    dbServices.createIndex("VisitCount", {restaurantId : 1}).catch(console.error);
    dbServices.createIndex("VisitCount", {count : 1}).catch(console.error);
    return VisitCount;
};