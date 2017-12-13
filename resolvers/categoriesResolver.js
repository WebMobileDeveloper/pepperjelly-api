"use strict";
module.exports = function(libraries){
    var categoriesController = libraries.categoriesController;
    var handleResponse = function(result){
        result.success = true;
        this.json(result);
    };
    var handleError = function(err, softErrorCode){
        var errorResponse = {
            "success" : false
        };
        if(err instanceof Error){
            console.error(err.stack);
            errorResponse.SERVER_ERROR = err.message;
            this.status(500).json(errorResponse);
        } else {
            var statusCode = (softErrorCode) ? softErrorCode : 400;
            this.status(statusCode).json({
                "success": false,
                "error": err
            });
        }
    };

    var listCategories = function(req, res){
        categoriesController.listCategories()
            .then(handleResponse.bind(res))
            .catch(handleError.bind(res));
    };
    var listTreeCategories = function(req, res){
        categoriesController.listTreeCategories()
            .then(handleResponse.bind(res))
            .catch(handleError.bind(res));
    };
    var adminReadCategories = function (req, res){
        categoriesController.adminReadCategories(req.query)
            .then(handleResponse.bind(res))
            .catch(handleError.bind(res));
    };
    var adminReadCategory = function (req, res){
        categoriesController.adminReadCategory(req.params["categoryId"])
            .then(handleResponse.bind(res))
            .catch(handleError.bind(res));
    };
    var adminCreateCategory = function (req, res){
        categoriesController.adminCreateCategory(req.body)
            .then(handleResponse.bind(res))
            .catch(handleError.bind(res));
    };
    var adminUpdateCategory = function (req, res){
        categoriesController.adminUpdateCategory(req.params["categoryId"], req.body)
            .then(handleResponse.bind(res))
            .catch(handleError.bind(res));
    };
    var adminDeleteCategory = function (req, res){
        categoriesController.adminDeleteCategory(req.params["categoryId"])
            .then(handleResponse.bind(res))
            .catch(handleError.bind(res));
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