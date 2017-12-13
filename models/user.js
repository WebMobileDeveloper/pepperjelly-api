"use strict";
module.exports = function(libraries){
    var dbServices = libraries.dbServices;
    function User(query, emptyModel){
        if(emptyModel === true){
            return new UserModel(query);
        } else {
            return new dbServices.model("User", query);
        }
    }
    function UserModel(model) {
        if(model.userName){this.userName = model.userName;}
        if(model.userNameLower){this.userNameLower = model.userNameLower;}
        if(model.facebookId){this.facebookId = model.facebookId;}
        if(model.googleId){this.googleId = model.googleId;}
        if(model.password){this.password = model.password;}
        if(model.salt){this.salt = model.salt;}
        if(model.role){this.role = +model.role;}
        if(model.banned){this.banned = model.banned;}
        if(model.profile){this.profile = new ProfileModel(model.profile);}
        if(model.deviceToken){this.deviceToken = model.deviceToken;}
        if(model.longitude && model.latitude && !model.useCustomLocation){this.location = [+model.longitude, +model.latitude];}
        if(model.longitude && model.latitude && model.useCustomLocation){this.customLocation = [+model.longitude, +model.latitude];}
        if(model.locationName && !model.useCustomLocation){this.locationName = model.locationName; }
        if(model.locationName && model.useCustomLocation){this.customLocationName = model.locationName; }
        if(model.range){this.range = model.range;}
        if(model.categories){this.categories = model.categories;}
        if(model.useCustomLocation){this.useCustomLocation = model.useCustomLocation;}
        if(model.pushCount){this.pushCount = model.pushCount;}
        this.createdAt = new Date();
        this.updatedAt = new Date();
    }
    function ProfileModel(model){
        if(model.email){this.email = model.email;}
        if(model.emailLower){this.emailLower = model.emailLower;}
        if(model.pictures){this.pictures = model.pictures;}
        if(model.fullName){this.fullName = model.fullName;}
    }

    dbServices.createIndex("User", {"userName" : 1}, {sparse : true, unique : true}).catch(console.error);
    dbServices.createIndex("User", {"userNameLower" : 1}, {sparse : true, unique : true}).catch(console.error);
    dbServices.createIndex("User", {"facebookId" : 1}, {unique : true, sparse : true}).catch(console.error);
    dbServices.createIndex("User", {"googleId" : 1}, {unique : true, sparse : true}).catch(console.error);
    dbServices.createIndex("User", {"profile.email" : 1}, {sparse : true, unique : true}).catch(console.error);
    dbServices.createIndex("User", {"profile.emailLower" : 1}, {sparse : true, unique : true}).catch(console.error);
    dbServices.createIndex("User", {"location" : "2dsphere"}).catch(console.error);
    return User;
};