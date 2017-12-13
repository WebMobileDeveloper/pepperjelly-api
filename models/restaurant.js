"use strict";
module.exports = function(libraries){
    var dbServices = libraries.dbServices;
    function Restaurant(query, emptyModel){
        if(emptyModel === true){
            return new RestaurantModel(query);
        } else {
            return new dbServices.model("Restaurant", query);
        }
    }
    function RestaurantModel(model) {
        if(model.image){this.image = model.image;}
        if(model.name){this.name = model.name;}
        if(model.address){this.address = model.address;}
        if(model.menu){this.menu = model.menu;}
        if(model.placesId){this.placesId = model.placesId;}
        if(model.phone){this.phone = model.phone;}
        if(model.openingTimes){this.openingTimes = model.openingTimes;}
        if(model.rating){this.rating = +model.rating;}
        if(model.category){this.category = model.category;}
        if(model.longitude && model.latitude){this.location = [+model.longitude, +model.latitude];} else
        if(model.location){this.location = model.location;}
        if(model.userId){this.userId = model.userId;}
        if(model.averageRating){this.averageRating = +model.averageRating;}
        if(model.name && model.placesId){
            this.safeName = model.name.toLowerCase() + "_" + model.placesId;
        } else if(model.name && model.longitude && model.latitude){
            this.safeName = model.name.toLowerCase() + "_" + model.longitude + "_" + model.latitude;
        } else if(model.name){
            this.safeName = model.name.toLowerCase();
        }
        this.createdAt = new Date();
        this.updatedAt = new Date();
    }

    dbServices.createIndex("Restaurant", {name : 1}).catch(console.error);
    dbServices.createIndex("Restaurant", {userId : 1}).catch(console.error);
    dbServices.createIndex("Restaurant", {safeName : 1}, {unique : true}).catch(console.error);
    dbServices.createIndex("Restaurant", {placesId : 1}, {unique : true, sparse : true}).catch(console.error);
    dbServices.createIndex("Restaurant", {location : "2dsphere"}).catch(console.error);
    return Restaurant;
};