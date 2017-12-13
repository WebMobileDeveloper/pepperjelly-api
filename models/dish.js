"use strict";
module.exports = function(libraries){
    var dbServices = libraries.dbServices;
    function Dish(query, emptyModel){
        if(emptyModel === true){
            return new DishModel(query);
        } else {
            return new dbServices.model("Dish", query);
        }
    }
    function DishModel(model){
        if(model.image){this.image = model.image;}
        if(model.restaurantId){this.restaurantId = model.restaurantId;}
        if(model.userId){this.userId = model.userId;}
        if(model.status){this.status = model.status;}
        if(model.categories){this.categories = model.categories;}
        if(model.banned){this.banned = model.banned;}
        if(model.rating){this.rating = +model.rating;}
        this.createdAt = new Date();
    }

    dbServices.createIndex("Dish", {userId : 1}).catch(console.error);
    dbServices.createIndex("Dish", {restaurantId : 1}).catch(console.error);
    dbServices.createIndex("Dish", {restaurantId : 1, rating : 1}, {sparse : true}).catch(console.error);
    dbServices.createIndex("Dish", {categories : 1}, {sparse : true}).catch(console.error);
    dbServices.createIndex("Dish", {restaurantId : 1, image : 1}, {unique : true}).catch(console.error);
    return Dish;
};