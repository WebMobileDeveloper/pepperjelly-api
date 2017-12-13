"use strict";
module.exports = function(libraries){
    var GoogleOAuth2Strategy = require("passport-google-oauth").OAuth2Strategy;
    var userController = libraries.userController;
    var googleAuth = libraries.settings.googleAuth;
    return new GoogleOAuth2Strategy(googleAuth, function(accessToken, refreshToken, profile, callBack) {
        var model = {
            googleId : profile.id,
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
