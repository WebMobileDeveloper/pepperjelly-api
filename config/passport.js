"use strict";
module.exports = function(libraries) {
    var facebookToken = require('./passport/facebookToken')(libraries);
    var googleOauth = require('./passport/googleOAuth')(libraries);
    var userController = libraries.userController;
    var passport = libraries.passport;

    passport.serializeUser(function(user, callBack) {
        callBack(null, user._id);
    });
    passport.deserializeUser(function(id, callBack) {
        userController.getUser({_id : id}).then(function(result){
            callBack(null, result);
        }).catch(callBack);
    });
    passport.use(facebookToken);
    passport.use(googleOauth);
};