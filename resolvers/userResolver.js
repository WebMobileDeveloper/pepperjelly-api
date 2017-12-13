"use strict";
module.exports = function(libraries){
    var requestHelpers = libraries.requestHelpers;
    var userController = libraries.userController;
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

    var register = function(req, res){
        var ip = requestHelpers.getIp(req);
        userController.register(req.body, ip)
            .then(handleResponse.bind(res))
            .catch(handleError.bind(res));
    };
    var login = function(req, res){
        var ip = requestHelpers.getIp(req);
        userController.login(req.body.userName, req.body.password, ip)
            .then(handleResponse.bind(res))
            .catch(handleError.bind(res));
    };
    var logout = function(req, res){
        userController.logout(req.header("Authorization"))
            .then(handleResponse.bind(res))
            .catch(handleError.bind(res));
    };
    var passportAuthCallBack = function(req, res) {
        handleResponse.bind(res)({
            user : req.user,
            authToken : req.user.authToken || req.authToken
        });
    };
    var forgotPassword = function(req, res){
        userController.forgotPassword(req.body)
            .then(handleResponse.bind(res))
            .catch(handleError.bind(res));
    };
    var passwordChange = function(req, res) {
        userController.passwordChange(req.query, req.body, req.session._userId, req.session._userRole)
            .then(handleResponse.bind(res))
            .catch(handleError.bind(res));
    };
    var modifyUser = function(req, res){
        userController.modifyUser(req.body, req.session._userId, req.session._userRole)
            .then(handleResponse.bind(res))
            .catch(handleError.bind(res));
    };
    var getUser = function(req, res){
        userController.getUser(req.body, req.session._userId, req.session._userRole)
            .then(handleResponse.bind(res))
            .catch(handleError.bind(res));
    };
    var searchUser = function(req, res){
        userController.searchUser(req.body)
            .then(handleResponse.bind(res))
            .catch(handleError.bind(res));
    };
    var reportUser = function(req, res){
        userController.reportUser(req.body, req.session._userId)
            .then(handleResponse.bind(res))
            .catch(handleError.bind(res));
    };
    var solveUserReport = function(req, res){
        userController.solveUserReport(req.params["reportId"], req.session._userId)
            .then(handleResponse.bind(res))
            .catch(handleError.bind(res));
    };
    var blockUser = function(req, res){
        userController.blockUser(req.body, req.session._userId)
            .then(handleResponse.bind(res))
            .catch(handleError.bind(res));
    };
    var unblockUser = function(req, res){
        userController.unblockUser(req.body, req.session._userId)
            .then(handleResponse.bind(res))
            .catch(handleError.bind(res));
    };
    var getBlocked = function(req, res){
        userController.getBlocked(req.session._userId)
            .then(handleResponse.bind(res))
            .catch(handleError.bind(res));
    };
    var followUser = function(req, res){
        userController.followUser(req.body, req.session._userId)
            .then(handleResponse.bind(res))
            .catch(handleError.bind(res));
    };
    var unfollowUser = function(req, res){
        userController.unfollowUser(req.body, req.session._userId)
            .then(handleResponse.bind(res))
            .catch(handleError.bind(res));
    };
    var getFollowers = function(req, res){
        userController.getFollowers(req.body["userId"], req.session._userId)
            .then(handleResponse.bind(res))
            .catch(handleError.bind(res));
    };
    var getFollowing = function(req, res){
        userController.getFollowing(req.body["userId"], req.session._userId)
            .then(handleResponse.bind(res))
            .catch(handleError.bind(res));
    };
    var getNewsFeed = function(req, res){
        userController.getNewsFeed(req.session._userId)
            .then(handleResponse.bind(res))
            .catch(handleError.bind(res));
    };
    var adminCreateUser = function(req, res){
        userController.adminCreateUser(req.body, req.session._userRole)
            .then(handleResponse.bind(res))
            .catch(handleError.bind(res));
    };
    var adminUpdateUser = function(req, res){
        userController.adminUpdateUser(req.params["userId"], req.body)
            .then(handleResponse.bind(res))
            .catch(handleError.bind(res));
    };
    var adminReadUser = function(req, res){
        userController.adminReadUser(req.params["userId"])
            .then(handleResponse.bind(res))
            .catch(handleError.bind(res));
    };
    var adminReadUsers = function(req, res){
        userController.adminReadUsers(req.query)
            .then(handleResponse.bind(res))
            .catch(handleError.bind(res));
    };
    var adminDeleteUser = function(req, res){
        userController.adminDeleteUser(req.params["userId"])
            .then(handleResponse.bind(res))
            .catch(handleError.bind(res));
    };
    var testPush = function(req, res){
        userController.testPush(req.body["deviceToken"], req.body["message"], req.session._userId)
            .then(handleResponse.bind(res))
            .catch(handleError.bind(res));
    };

    return {
        register : register,
        login : login,
        logout : logout,
        passportAuthCallBack : passportAuthCallBack,
        forgotPassword : forgotPassword,
        passwordChange : passwordChange,
        modifyUser : modifyUser,
        getUser : getUser,
        searchUser : searchUser,
        reportUser : reportUser,
        solveUserReport : solveUserReport,
        blockUser : blockUser,
        unblockUser : unblockUser,
        getBlocked : getBlocked,
        followUser : followUser,
        unfollowUser : unfollowUser,
        getFollowers : getFollowers,
        getFollowing : getFollowing,
        getNewsFeed : getNewsFeed,
        adminCreateUser : adminCreateUser,
        adminUpdateUser : adminUpdateUser,
        adminReadUser : adminReadUser,
        adminReadUsers : adminReadUsers,
        adminDeleteUser : adminDeleteUser,
        testPush : testPush
    }
};