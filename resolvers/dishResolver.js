"use strict";
module.exports = function(libraries){
    var validate = require('../helpers/validation')(libraries);
    var dishController = libraries.dishController;
    var reportsController = libraries.reportsController;
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

    var createDish = function(req, res){
        var model = req.body;
        var isNull = validate.checkForNullModel(model);
        if(isNull){
            handleError.bind(res)("no request body found");
        } else {
            var errors = req.validationErrors();
            if (!errors || errors.length == 0) {
                dishController.createDish(model, req.session._userId)
                    .then(handleResponse.bind(res))
                    .catch(handleError.bind(res));
            } else {
                handleError.bind(res)(errors);
            }
        }
    };
    var searchDishes = function(req, res){
        dishController.searchDishes(req.body, req.session._userId)
            .then(handleResponse.bind(res))
            .catch(handleError.bind(res));
    };
    var getDish = function(req, res){
        dishController.getDish(req.params["dishId"], req.session._userId)
            .then(handleResponse.bind(res))
            .catch(handleError.bind(res));
    };
    var getUsageByUser = function(req, res){
        dishController.getUsageByUser(req.params["userId"], req.params["element"])
            .then(handleResponse.bind(res))
            .catch(handleError.bind(res));
    };
    var likeDish = function(req, res){
        dishController.likeDish(req.params["dishId"], req.body, req.session._userId)
            .then(handleResponse.bind(res))
            .catch(handleError.bind(res));
    };
    var getLikedDishes = function(req, res){
        dishController.getLikedDishes(req.session._userId)
            .then(handleResponse.bind(res))
            .catch(handleError.bind(res));
    };
    var commentDish = function(req, res){
        var model = req.body;
        var isNull = validate.checkForNullModel(model);
        if(isNull){
            handleError.bind(res)("no request body found");
        } else {
            var errors = req.validationErrors();
            if (!errors || errors.length == 0) {
                dishController.commentDish(req.params["dishId"], model, req.session._userId)
                    .then(handleResponse.bind(res))
                    .catch(handleError.bind(res));
            } else {
                handleError.bind(res)(errors);
            }
        }
    };
    var flagDish = function(req, res){
        dishController.flagDish(req.params["dishId"], req.body, req.session._userId)
            .then(handleResponse.bind(res))
            .catch(handleError.bind(res));
    };
    var solveReport = function(req, res){
        reportsController.solveReport(req.params["reportId"], req.session._userId)
            .then(handleResponse.bind(res))
            .catch(handleError.bind(res));
    };
    var adminReadDish = function (req, res){
        dishController.adminReadDish(req.params["dishId"])
            .then(handleResponse.bind(res))
            .catch(handleError.bind(res));
    };
    var adminReadDishes = function (req, res){
        dishController.adminReadDishes(req.query)
            .then(handleResponse.bind(res))
            .catch(handleError.bind(res));
    };
    var adminUpdateDish = function (req, res){
        dishController.adminUpdateDish(req.params["dishId"], req.body)
            .then(handleResponse.bind(res))
            .catch(handleError.bind(res));
    };
    var adminUpdateDishStatusMulti = function (req, res){
        dishController.adminUpdateDishStatusMulti(req.body["dishIds"], req.body["newStatus"])
            .then(handleResponse.bind(res))
            .catch(handleError.bind(res));
    };
    var adminUpdateDishStatus = function (req, res){
        dishController.adminUpdateDishStatus(req.params["dishId"], req.params["newStatus"])
            .then(handleResponse.bind(res))
            .catch(handleError.bind(res));
    };
    var adminDeleteDish = function (req, res){
        dishController.adminDeleteDish(req.params["dishId"])
            .then(handleResponse.bind(res))
            .catch(handleError.bind(res));
    };
    var adminDeleteComment = function (req, res) {
        dishController.adminDeleteComment(req.params["commentId"])
            .then(handleResponse.bind(res))
            .catch(handleError.bind(res));
    };
    return {
        createDish : createDish,
        searchDishes : searchDishes,
        getDish : getDish,
        likeDish : likeDish,
        getLikedDishes : getLikedDishes,
        commentDish : commentDish,
        getUsageByUser : getUsageByUser,
        flagDish : flagDish,
        solveReport : solveReport,
        adminReadDish : adminReadDish,
        adminReadDishes : adminReadDishes,
        adminUpdateDish : adminUpdateDish,
        adminUpdateDishStatusMulti : adminUpdateDishStatusMulti,
        adminUpdateDishStatus : adminUpdateDishStatus,
        adminDeleteDish : adminDeleteDish,
        adminDeleteComment : adminDeleteComment
    }
};