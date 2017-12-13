var Q = require("q");
var dbServices = require("../services/dbServices")();
var environment = "production";//(process.env["environment"] == "production") ? "production" : "development";
var settings = require("../config/settings")[environment];
var ObjectID = require("mongodb").ObjectID;
var algoliasearch = require('algoliasearch');
var client = algoliasearch('48EUWY9NWN', '8c5aed3289990afc540f207b319b4408');
var index = client.initIndex('pepperjelly');

console.log("starting in env "+ environment);

console.log("connecting to db");
console.log(settings.dataBase);

var handleError = function(err){
    "use strict";
    console.log("failed to connect to db");
    console.error(err.stack);
    process.exit();
};
dbServices.connect(settings.dataBase).then(function(){
    "use strict";

    console.log("connected to db");


    var libraries = {dbServices : dbServices};
    var DishModel = require("../models/dish")(libraries);
    var RestaurantModel = require("../models/restaurant")(libraries);
    var UserModel = require("../models/user")(libraries);


    Q.all([
        //new DishModel({}).find(),
        new RestaurantModel({}).find(),
        new UserModel({}).find()
    ]).then(function(readResults){

        console.log("found data");
        //console.log(readResults);

        //var dishes = readResults[0];
        var restaurants = readResults[0];
        var users = readResults[1];
        var updateOps = [];

        // var j = 0;
        // var dishes_search = [];
        // dishes.forEach(function(dish){

        //     dish.type = "dish";
        //     dishes_search.push(dish);

        //     console.log("dish " + (j++));
        // });
        // index.addObjects(dishes_search, function(err, content) {
        //     });

        // var i = 0;
        // var restaurants_search = [];
        // restaurants.forEach(function(restaurant){
        //     console.log(restaurant._id);

        //     restaurant.type = "restaurant";
            
        //     if(restaurant.location && restaurant.location.length > 0) {
        //         restaurant["_geoloc"] = {
        //             "lat": restaurant.location[1],
        //             "lng": restaurant.location[0]
        //         };
        //     }

        //     restaurants_search.push(restaurant);
            
        //     console.log("restaurant " + (i++));
            
           

        // });
        // index.addObjects(restaurants_search, function(err, content) {
        //             console.log(err);
        //         });
        

        var t = 0;
        var users_search = [];
        users.forEach(function(user){

            user.type = "user";
            users_search.push(user);

            console.log("user " + (t++));
        });
        index.addObjects(users_search, function(err, content) {
            });

        // Q.all(updateOps).then(function(results){
        //     console.log(results);
        //     process.exit();
        // }).catch(handleError);
    }).catch(handleError);
}).catch(handleError);
