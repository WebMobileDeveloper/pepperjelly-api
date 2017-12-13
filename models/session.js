"use strict";
module.exports = function(libraries){
    var dbServices = libraries.dbServices;
    function Session(query){
        return new dbServices.model("Session", query);
    }
    dbServices.createIndex("Session", {userId : 1}).catch(console.error);
    return Session;
};