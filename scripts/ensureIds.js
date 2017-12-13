var Q = require("q");
var dbServices = require("../services/dbServices")();
var environment = (process.env["environment"] == "production") ? "production" : "development";
var settings = require("../config/settings")[environment];
var ObjectID = require("mongodb").ObjectID;

var handleError = function(err){
    "use strict";
    console.error(err.stack);
    process.exit();
};
dbServices.connect(settings.dataBase).then(function(){
    "use strict";
    var libraries = {dbServices : dbServices};
    var DishModel = require("../models/dish")(libraries);
    var RestaurantModel = require("../models/restaurant")(libraries);
    Q.all([
        new DishModel({}).find(),
        new RestaurantModel({}).find()
    ]).then(function(readResults){
        var dishes = readResults[0];
        var restaurants = readResults[1];
        var updateOps = [];
        dishes.forEach(function(dish){
            updateOps.push(new DishModel({_id : new ObjectID(dish._id)}).findOneAndUpdate({$set : {restaurantId : new ObjectID(dish.restaurantId), userId : new ObjectID(dish.userId)}}));
        });
        restaurants.forEach(function(restaurant){
            updateOps.push(new RestaurantModel({_id : new ObjectID(restaurant._id)}).findOneAndUpdate({$set : {userId : new ObjectID(restaurant.userId)}}));
        });
        Q.all(updateOps).then(function(results){
            console.log(results);
            process.exit();
        }).catch(handleError);
    }).catch(handleError);
}).catch(handleError);