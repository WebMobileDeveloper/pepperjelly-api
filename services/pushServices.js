module.exports = function(config){
	var Q = require('q');
	var apn = require('apnagent');
	var agent = null;
	var startAgent = function(pfxFile, certFile, keyFile, sandbox){
		var innerAgent = new apn.Agent();
		if(pfxFile){
			innerAgent.set('pfx file', pfxFile);
		} else {
			if(certFile) {
				innerAgent.set('cert file', certFile);
			}
			if(keyFile){
				innerAgent.set('key file', keyFile);
			}
		}
		if(sandbox === true){
			innerAgent.enable('sandbox');
		}
		innerAgent.on('message:error', function (err, msg) {
			console.log(err, msg);
		});
		innerAgent.connect(function(err){
			if(err){
				console.error(err);
			}
		});
		innerAgent.set("reconnect delay", "3s").set("cache ttl", "30m");
		return innerAgent;
	};
	return function(device, message, badge, userId, dishId){
		var deferred = Q.defer();
		var unresponsiveTimeOut = setTimeout(function(){
			"use strict";
			var result = {"time" : new Date(), "device" : device, "result" : "Unresponsive, check credentials."};
			console.log(result);
			deferred.resolve({"result" : result});
		}, 5000);
		badge = badge || 1;
		if(!agent || !agent.connected){
			agent = startAgent(config.apnPfxFile, config.apnCertFile, config.apnKeyFile, config.sandbox);
		}
		var pushMessage = agent.createMessage();
        pushMessage.device(device);
        pushMessage.alert(message);
        pushMessage.badge(badge);
        if(userId){pushMessage.set("userId", userId);}
        if(dishId){pushMessage.set("dishId", dishId);}
        pushMessage.send(function (err) {
			clearTimeout(unresponsiveTimeOut);
			var result = {};
			if (err && err.toJSON) {
				result = {"time" : new Date(), "device" : device, "result": err.toJSON(false)};
				console.log(result);
			} else if (err) {
				result = {"time" : new Date(), "device" : device, "result": err.message};
				console.log(result);
			} else {
				result = {"time" : new Date(), "device" : device, "result" : "OK"};
			}
			deferred.resolve({"result" : result});
		});
		return deferred.promise;
	};
};