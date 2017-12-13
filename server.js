console.log("starting");
var Q = require("q");
var express = require("express");
var passport = require("passport");
var bcrypt = require('bcrypt-nodejs');
var requestHelpers = require("./helpers/requestHelpers");
var AppConfig = require("./resolvers/appConfig");
var mail = require("./helpers/mail");
var passportStrategies = require("./config/passport");
var router = require("./config/routes");
var userController = require("./controllers/userController");
var restaurantController = require("./controllers/restaurantController");
var dishController = require("./controllers/dishController");
var reportsController = require("./controllers/reportsController");
var categoriesController = require("./controllers/categoriesController");
var issuesController = require("./controllers/issuesController");
var sessionController = require("./controllers/sessionController");
var dbServices = require("./services/dbServices")();
var GooglePlaces = require("node-googleplaces");
var environment = (process.env["environment"] == "production") || 1 ? "production" : (process.env["environment"] == "local") ? "local" : "development";
var settings = require("./config/settings")[environment];
var pushServices = require("./services/pushServices")(settings.push);
var app = express();
console.log("connecting to db...");
console.log(settings.dataBase);
dbServices.connect(settings.dataBase).then(function(){
	console.log("connected to db");
    var libraries = {
        Q : Q,
        environment : environment,
        mail : mail(Q, settings),
        appPort : process.env.PORT || 3000,
        passport : passport,
        bcrypt : bcrypt,
        settings : settings,
        requestHelpers : requestHelpers,
        dbServices : dbServices,
        pushServices : pushServices,
        placesServices : new GooglePlaces(settings.googlePlaces),
        categoriesController : null,
        userController : null,
        restaurantController : null,
        dishController : null,
        reportsController : null,
        issuesController : null,
        sessionController : null
    };
    libraries.categoriesController = categoriesController(libraries);
    libraries.issuesController = issuesController(libraries);
    libraries.sessionController = sessionController(libraries);
    libraries.userController = userController(libraries);
    libraries.reportsController = reportsController(libraries);
    libraries.dishController = dishController(libraries);
    libraries.restaurantController = restaurantController(libraries);
    libraries.dishController.setLibraryElement("restaurantController", libraries.restaurantController);

    var appConfig = AppConfig(app, libraries);
    appConfig.middleWare();
    passportStrategies(libraries);
    router(app, libraries, appConfig.tokenValidate);
    appConfig.endResolvers();
}).catch(function(err){
	console.log("db connect failed");
    console.error(err.stack);
    process.exit();
});
