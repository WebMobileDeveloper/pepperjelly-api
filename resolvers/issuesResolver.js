"use strict";
module.exports = function(libraries){
    var issuesController = libraries.issuesController;
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

    var adminReadIssues = function(req, res){
        issuesController.adminReadIssues(req.query)
            .then(handleResponse.bind(res))
            .catch(handleError.bind(res));
    };
    return {
        adminReadIssues : adminReadIssues
    }
};