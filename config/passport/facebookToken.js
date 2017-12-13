"use strict";
module.exports = function(libraries){
    var FacebookTokenStrategy = require("passport-facebook-token");
    var userController = libraries.userController;
    var fbAuth = libraries.settings.facebookAuth;
    return new FacebookTokenStrategy(fbAuth, function(accessToken, refreshToken, profile, callBack) {
        var model = {
            facebookId : profile.id,
            profile : {
                fullName : profile.displayName
            }
        };
        if(profile.emails && profile.emails.length > 0){
            model.profile.email = profile.emails.map(function(item){ return item.value; })[0];
        }
        if(profile.photos && profile.photos.length > 0){
            model.profile.pictures = profile.photos.map(function(item){ return item.value; });
        }
        userController.register(model).then(function(result){
            result.user.authToken = result.authToken;
            callBack(null, result.user);
        }).catch(callBack);
    });
};