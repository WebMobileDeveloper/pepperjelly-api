"use strict";
module.exports = function(libraries){
    var Q = libraries.Q;
    var CategoryModel = require("../models/category")(libraries);
    var arrayToTreeObject = function(elements, keyParam, keyParamParent){
        var finalTree = [];
        elements.filter(function(item){
            return !item[keyParam];
        }).forEach(function(item){
            var children = elements.filter(function(child){
                return child[keyParam] === item[keyParamParent];
            }).map(function(child){
                return child[keyParamParent];
            });
            finalTree.push({name : item[keyParamParent], categories : children});
        });
        return finalTree;
    };
    var listCategories = function (){
        var deferred = Q.defer();
        var project = {name : 1};
        var options = {$sort : {position : 1, name : 1}};
        new CategoryModel({status : "active"}).find(project, options).then(function(result){
            deferred.resolve({categories : result});
        }).catch(deferred.reject);
        return deferred.promise;
    };
    var listTreeCategories = function (){
        var deferred = Q.defer();
        var project = {name : 1, parent : 1};
        var options = {$sort : {position : 1, name : 1}};
        new CategoryModel({status : "active"}).find(project, options).then(function(result){
            var categoryTree = arrayToTreeObject(result, "parent", "name");
            deferred.resolve({categories : categoryTree});
        }).catch(deferred.reject);
        return deferred.promise;
    };
    var adminReadCategories = function (searchQuery){
        var deferred = Q.defer();
        var project = {};
        var options = {$sort : {position : 1, name : 1}};
        Q.all([
            new CategoryModel(searchQuery).find(project, options),
            new CategoryModel(searchQuery).count()
        ]).then(function(results){
            deferred.resolve({results : results[0], total : results[1]});
        }).catch(deferred.reject);
        return deferred.promise;
    };
    var adminReadCategory = function (categoryId){
        var deferred = Q.defer();
        new CategoryModel({_id : categoryId})
            .findOne()
            .then(deferred.resolve)
            .catch(deferred.reject);
        return deferred.promise;
    };
    var adminCreateCategory = function (model) {
        var deferred = Q.defer();
        if(model.name){
            var cleanModel = new CategoryModel(model, true);
            new CategoryModel().insertOne(cleanModel).then(deferred.resolve).catch(deferred.reject);
        } else {
            deferred.reject("No category name provided");
        }
        return deferred.promise;
    };
    var adminUpdateCategory = function (categoryId, model){
        var deferred = Q.defer();
        var query = {_id : categoryId};
        var cleanModel = new CategoryModel(model, true);
        new CategoryModel(query).findOneAndUpdate(cleanModel).then(function(result){
            if(result){
                deferred.resolve(result);
            } else {
                deferred.reject("Category not found");
            }
        }).catch(deferred.reject);
        return deferred.promise;
    };
    var adminDeleteCategory = function (categoryId){
        var deferred = Q.defer();
        var query = {_id : categoryId};
        new CategoryModel(query).deleteOne().then(deferred.resolve).catch(deferred.reject);
        return deferred.promise;
    };
    return {
        listCategories : listCategories,
        listTreeCategories : listTreeCategories,
        adminReadCategories : adminReadCategories,
        adminReadCategory : adminReadCategory,
        adminCreateCategory : adminCreateCategory,
        adminUpdateCategory : adminUpdateCategory,
        adminDeleteCategory : adminDeleteCategory
    }
};