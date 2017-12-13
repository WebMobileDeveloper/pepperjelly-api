"use strict";
module.exports = function(app, libraries){
    var bodyParser = require("body-parser");
    var cookieParser = require("cookie-parser");
    var session = require("express-session");
    var expressValidator = require("express-validator");
    var serveStatic = require("serve-static");
    var server = require('http');
    var io = require('socket.io');
    var path = require("path");
    var express = libraries.express;
    var sessionController = libraries.sessionController;
    //var chatServices = libraries.chatServices;
    var passport = libraries.passport;
    var appPort = libraries.appPort;

    var middleWare = function(){
        app.use(bodyParser.urlencoded({
            extended: true
        }));
        app.use(cookieParser());
        app.use(bodyParser.json());
        app.use(session({
            secret: "set_some_unique_value",
            resave: true,
            saveUninitialized: true
        }));
        app.use(passport.initialize());
        app.use(passport.session());
        app.use(expressValidator());
        app.use(function(err, req, res, next) {
            if (err) {
                console.log(err.stack);
            }
            next();
        });
        app.use(serveStatic("./dashboard"));
        app.engine("html", require("ejs").renderFile);
        app.set("view engine", "html");
    };
    var endResolvers = function(){
        app.use(function(err, req, res, next) {
            if (err.message && (~err.message.indexOf('not found') || (~err.message.indexOf('Cast to ObjectId failed')))) {
                return next();
            }
            console.error(err.stack);
            res.status(500).send({
                error: err.stack
            });
        });
        app.use(function(req, res) {
            res.status(404).send({
                url: req.originalUrl,
                error: 'Not found'
            });
        });
        server = server.Server(app);
        io = io(server);
        libraries.io = io;
        //chatServices = chatServices(libraries);
        server.listen(appPort, function(err) {
            if (err) throw err;
            console.log("Server is running @ http://localhost:" + appPort);
        });
    };
    var tokenValidate = function(req, res, next){
        var sessionId = req.header("Authorization") || null;
        var context = this;
        sessionController.validateSession(sessionId)
            .then(function(result){
                if(
                    result &&
                    result.userId &&
                    (
                        !context ||
                        !context.role ||
                        (
                            context && context.role && +context.role == +result.userRole
                        )
                    )
                ){
                    req.session = req.session || {};
                    req.session._userId = result.userId;
                    req.session._userRole = result.userRole;
                    next();
                } else {
                    res.status(403).json({error : "Invalid session"});
                }
            })
            .catch(function(error){
                res.status(500).json({error : error.message});
            });
    };
    return {
        middleWare : middleWare,
        endResolvers : endResolvers,
        tokenValidate : tokenValidate
    }
};