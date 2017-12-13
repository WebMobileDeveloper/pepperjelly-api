"use strict";
module.exports = function(libraries){
    var dbServices = libraries.dbServices;
    function Category(query, emptyModel){
        if(emptyModel === true){
            return new CategoryModel(query);
        } else {
            return new dbServices.model("Category", query);
        }
    }
    function CategoryModel(model){
        if(model.name){this.name = model.name;}
        if(model.parent){this.parent = model.parent;}
        if(model.status){this.status = model.status;}
        if(model.position){this.position = model.position;}
        this.createdAt = new Date();
    }

    dbServices.createIndex("Category", {name : 1}, {unique : true}).catch(console.error);
    dbServices.createIndex("Category", {position : 1, name : 1}).catch(console.error);
    return Category;
};