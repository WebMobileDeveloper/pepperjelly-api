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
    var aggregationQuery = [
        {
            $match : {
                categories : {
                    $exists : true
                }
            }
        },
        {
            $unwind : "$categories"
        },
        {
            $group : {
                _id : "$restaurantId",
                categories : {
                    $addToSet :  "$categories"
                }
            }
        }
    ];
    new DishModel(aggregationQuery).aggregate().then(function(aggregationResult){
        var updateOps = [];
        aggregationResult.forEach(function(item){
            updateOps.push(new RestaurantModel({_id : new ObjectID(item._id)}).findOneAndUpdate({$addToSet : {category : {$each : item.categories}}}));
        });
        Q.all(updateOps).then(function(results){
            console.log(results);
            process.exit();
        }).catch(handleError);
    }).catch(handleError);
}).catch(handleError);