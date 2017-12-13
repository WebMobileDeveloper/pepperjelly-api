"use strict";
module.exports = function(Q, settings){
    var apiKey = settings.sendgrid.apikey;
    var mailSender = settings.sendgrid.mailSender;
    var sendGrid = require('sendgrid')(apiKey);
    var send = function(payload) {
        var deferred = Q.defer();
        if(payload.to && payload.subject && payload.text) {
            payload.from = payload.from || mailSender;
            sendGrid.send(payload, function (err, response) {
                if (err) {
                    deferred.reject(err);
                } else {
                    deferred.resolve(response);
                }
            });
        } else {
            deferred.reject(new Error("Payload parameters missing (to, subject, text)"));
        }
        return deferred.promise;
    };
    return {
        send : send
    }
};