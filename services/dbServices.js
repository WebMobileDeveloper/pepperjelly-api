"use strict";
module.exports = function(connectionDetails){
    var Q = require("q");
    var mongodb = require("mongodb");
    var MongoClient = mongodb.MongoClient;
    var ReadPreference = mongodb.ReadPreference;
    var ObjectID = mongodb.ObjectID;
    var mongoIdFields = ["_id"];
    var db;
    var connect = function(config){
        var deferred = Q.defer();
        var connectionUrl;
        var connectionParams = [];
        var authValues = "";
        if(config.user && config.password){
            authValues = config.user + ":" + config.password + "@";
        }
        if(config.replicaSetName){
            connectionParams.push("replicaSet=" + config.replicaSetName);
        }
        if(config.authDb){
            connectionParams.push("authSource=" + config.authDb);
        }
        connectionUrl = 'mongodb://' + authValues + config.replicaSetServers.join(",") + '/' + config.databaseName;
        if(connectionParams.length > 0){
            connectionUrl += "?" + connectionParams.join("&")
        }
	console.log(connectionUrl);
        MongoClient.connect(connectionUrl, function(err, dbOk){
            if(err){
		console.log(err);
                deferred.reject(err);
            } else {
                db = dbOk;
                deferred.resolve();
            }
        });
        return deferred.promise;
    };
    var _prepareQuery = function(query){
        for(var key in query){
            if(query.hasOwnProperty(key) && mongoIdFields.indexOf(key) != -1 && typeof query[key] == "string"){
                try{
                    query[key] = new ObjectID(query[key]);
                } catch(err){
                    console.error("Invalid ObjectID", query, err);
                }
            } else if(query.hasOwnProperty(key) && typeof query[key] == "string" && query[key].indexOf("|") != -1){
                var tempKey = query[key].split("|");
                query[key] = {};
                if(tempKey[0] == "$like") {
                    query[key] = new RegExp(tempKey[1], "gi");
                } else if(tempKey[0] == "$in"){
                    query[key] = {$in : (tempKey[1] instanceof Array) ? tempKey[1] : (tempKey[1].indexOf(",") != -1) ? tempKey[1].split(",") : [tempKey[1]]};
                } else {
                    query[key][tempKey[0]] = (!isNaN(tempKey[1])) ? +tempKey[1] : tempKey[1];
                }
            }
        }
        return query;
    };
    var _extractQueryOptions = function(currentOptions, searchQuery){
        searchQuery = searchQuery || {};
        currentOptions = currentOptions || {};
        if(searchQuery.$sort){
            var direction = (!isNaN(searchQuery.$direction)) ? +searchQuery.$direction : 1;
            currentOptions.$sort = {};
            currentOptions.$sort[searchQuery.$sort] = direction;
            delete searchQuery.$sort;
            delete searchQuery.$direction;
        }
        if(searchQuery.$limit){
            currentOptions.$limit = +searchQuery.$limit;
            delete searchQuery.$limit;
        }
        if(searchQuery.$skip){
            currentOptions.$skip = +searchQuery.$skip;
            delete searchQuery.$skip;
        }
        return currentOptions;
    };
    var DBInterface = function(collection, query, tokens){
        this.collection = collection;
        this.query = query || {};
        this.tokens = tokens || [];
        this.model = {};
    };
    DBInterface.prototype.ObjectID = ObjectID;
    DBInterface.prototype.ReadPreference = ReadPreference;
    DBInterface.prototype.find = function(project, options){
        var deferred = Q.defer();
        options = _extractQueryOptions(options, this.query);
        var cursor = db.collection(this.collection).find(_prepareQuery(this.query));
        if(options && options.$limit){cursor.limit(options.$limit);}
        if(options && options.$skip){cursor.skip(options.$skip);}
        if(options && options.$sort){cursor.sort(options.$sort);}
        if(options && options.$readPreference){cursor.setReadPreference(options.$readPreference)}
        if(project){cursor.project(project);}
        cursor
            .toArray()
            .then(deferred.resolve)
            .catch(deferred.reject);
        return deferred.promise;
    };
    DBInterface.prototype.findOne = function(project, options){
        var deferred = Q.defer();
        var cursor = db.collection(this.collection).find(_prepareQuery(this.query)).limit(1);
        if(project){cursor.project(project);}
        if(options && options.$readPreference){cursor.setReadPreference(options.$readPreference)}
        cursor
            .next()
            .then(deferred.resolve)
            .catch(deferred.reject);
        return deferred.promise;
    };
    DBInterface.prototype.insertOne = function(document){
        var deferred = Q.defer();
        document = document || _prepareQuery(this.query);
        this.tokens.forEach(function(token){
            document[token] = new ObjectID().toString();
        });
        db.collection(this.collection).insertOne(document)
            .then(function(result){
                deferred.resolve(result.ops[0]);
            })
            .catch(deferred.reject);
        return deferred.promise;
    };
    DBInterface.prototype.findOneAndUpdate = function(document, options){
        var deferred = Q.defer();
        document = document || {};
        options = options || {};
        options.returnOriginal = false;
        db.collection(this.collection).findOneAndUpdate(_prepareQuery(this.query), document, options)
            .then(function(result) {
                deferred.resolve(result.value);
            })
            .catch(deferred.reject);
        return deferred.promise;
    };
    DBInterface.prototype.updateMany = function(document, options){
        var deferred = Q.defer();
        document = document || {};
        options = options || {};
        options.returnOriginal = false;
        db.collection(this.collection).updateMany(_prepareQuery(this.query), document, options)
            .then(function(result) {
                deferred.resolve(result.modifiedCount);
            })
            .catch(deferred.reject);
        return deferred.promise;
    };
    DBInterface.prototype.deleteOne = function(){
        var deferred = Q.defer();
        db.collection(this.collection).deleteOne(_prepareQuery(this.query))
            .then(deferred.resolve)
            .catch(deferred.reject);
        return deferred.promise;
    };
    DBInterface.prototype.deleteMany = function(){
        var deferred = Q.defer();
        db.collection(this.collection).deleteMany(_prepareQuery(this.query))
            .then(deferred.resolve)
            .catch(deferred.reject);
        return deferred.promise;
    };
    DBInterface.prototype.count = function(){
        var deferred = Q.defer();
        db.collection(this.collection).count(_prepareQuery(this.query))
            .then(deferred.resolve)
            .catch(deferred.reject);
        return deferred.promise;
    };
    DBInterface.prototype.aggregate = function(project, options){
        var deferred = Q.defer();
        project = project || {};
        options = options || {};
        db.collection(this.collection).aggregate(_prepareQuery(this.query), project, options)
            .toArray()
            .then(deferred.resolve)
            .catch(deferred.reject);
        return deferred.promise;
    };
    var createIndex = function(collection, index, options){
        var deferred = Q.defer();
        options = options || {};
        db.collection(collection).createIndex(index, options)
            .then(deferred.resolve)
            .catch(deferred.reject);
        return deferred.promise;
    };
    return {
        connect : connect,
        model : DBInterface,
        createIndex : createIndex
    };
};
