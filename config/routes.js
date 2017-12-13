"use strict";
module.exports = function(app, libraries, validator) {
    var userResolver = require("../resolvers/userResolver")(libraries);
    var restaurantResolver = require("../resolvers/restaurantResolver")(libraries);
    var dishResolver = require("../resolvers/dishResolver")(libraries);
    var categoriesResolver = require("../resolvers/categoriesResolver")(libraries);
    var issuesResolver = require("../resolvers/issuesResolver")(libraries);
    var passport = libraries.passport;

    app.get("/auth/google", passport.authenticate("google", { scope: [ 'https://www.googleapis.com/auth/plus.login', 'https://www.googleapis.com/auth/plus.profile.emails.read' ] }));
    app.get("/auth/facebook", passport.authenticate("facebook-token"));

    /* user
     ################################################# */
    app.get("/api/v1/user/fbtoken", passport.authenticate("facebook-token"), userResolver.passportAuthCallBack);
    app.post("/api/v1/user/fbtoken", passport.authenticate("facebook-token"), userResolver.passportAuthCallBack);
    app.get("/api/v1/user/googleOAuth", passport.authenticate("google"), userResolver.passportAuthCallBack);
    app.post("/api/v1/user/register", userResolver.register);
    app.post("/api/v1/user/login", userResolver.login);
    app.post("/api/v1/user/forgot", userResolver.forgotPassword);
    app.post("/api/v1/user/password", validator, userResolver.passwordChange);
    app.post("/api/v1/user/report", validator, userResolver.reportUser);
    app.post("/api/v1/user/block", validator, userResolver.blockUser);
    app.post("/api/v1/user/unblock", validator, userResolver.unblockUser);
    app.post("/api/v1/user/getBlocked", validator, userResolver.getBlocked);
    app.post("/api/v1/profile", validator, userResolver.modifyUser);
    app.post("/api/v1/user/get", validator, userResolver.getUser);
    app.post("/api/v1/user/search", validator, userResolver.searchUser);
    app.post("/api/v1/user/follow", validator, userResolver.followUser);
    app.post("/api/v1/user/unfollow", validator, userResolver.unfollowUser);
    app.post("/api/v1/user/getFollowers", validator, userResolver.getFollowers);
    app.post("/api/v1/user/getFollowing", validator, userResolver.getFollowing);
    app.get("/api/v1/user/feed", validator, userResolver.getNewsFeed);
    app.post("/api/v1/user/push", validator, userResolver.testPush);

    /* restaurant
    ######################################################## */
    app.post("/api/v1/feed", validator, restaurantResolver.getRestaurantsDishes);
    app.post("/api/v1/restaurant", validator, restaurantResolver.createRestaurant);
    app.post("/api/v1/restaurants", validator, restaurantResolver.getRestaurants);
    app.post("/api/v1/restaurant/:restaurantId", validator, restaurantResolver.updateRestaurant);
    app.get("/api/v1/places", validator, restaurantResolver.placesSearch);
    app.get("/api/v1/places/:restaurantId", validator, restaurantResolver.placesSearchForRestaurant);
    app.get("/api/v1/places/photo/:photoReference", validator, restaurantResolver.placesPhoto);
    app.post("/api/v1/places/:placeId/:restaurantId", validator, restaurantResolver.placesPhotoImport);
    app.post("/api/v1/places/:placeId", validator, restaurantResolver.placeImport);
    app.get("/api/v1/addressLookup", validator, restaurantResolver.addressLookup);
    app.get("/api/v1/autocomplete", validator, restaurantResolver.placesAutocomplete);

    /* dish
    #################################################### */
    app.post("/api/v1/dish", validator, dishResolver.createDish);
    app.post("/api/v1/dish/:dishId/like", validator, dishResolver.likeDish);
    app.post("/api/v1/dish/:dishId/flag", validator, dishResolver.flagDish);
    app.post("/api/v1/dish/:dishId/comment", validator, dishResolver.commentDish);
    app.post("/api/v1/dish/search", validator, dishResolver.searchDishes);
    app.post("/api/v1/dish/:dishId", validator, dishResolver.getDish);
    app.delete("/api/v1/dish/:dishId", validator, dishResolver.adminDeleteDish);
    app.post("/api/v1/liked", validator, dishResolver.getLikedDishes);

    /* Categories
     #################################################### */
    app.get("/api/v1/categories", validator, categoriesResolver.listCategories);
    app.get("/api/v1/categories/tree", validator, categoriesResolver.listTreeCategories);
    
    /* Admin
    ##################################################### */
    app.post('/admin/login', userResolver.login);
    app.post('/admin/logout', userResolver.logout);

    app.post("/admin/user/forgot", validator.bind({role : 2}), userResolver.forgotPassword);
    app.post("/admin/user/password", validator.bind({role : 2}), userResolver.passwordChange);
    app.post("/admin/user", validator.bind({role : 2}), userResolver.adminCreateUser);
    app.post("/admin/user/:userId", validator.bind({role : 2}), userResolver.adminUpdateUser);
    app.get("/admin/user", validator.bind({role : 2}), userResolver.adminReadUsers);
    app.get("/admin/user/:userId", validator.bind({role : 2}), userResolver.adminReadUser);
    app.delete("/admin/user/:userId", validator.bind({role : 2}), userResolver.adminDeleteUser);
    app.post("/admin/passwordReset", validator.bind({role : 2}), userResolver.forgotPassword);

    app.post("/admin/restaurant", validator.bind({role : 2}), restaurantResolver.adminCreateRestaurant);
    app.get("/admin/restaurant/:restaurantId", validator.bind({role : 2}), restaurantResolver.adminReadRestaurant);
    app.get("/admin/restaurant", validator.bind({role : 2}), restaurantResolver.adminReadRestaurants);
    app.post("/admin/restaurant/:restaurantId", validator.bind({role : 2}), restaurantResolver.adminUpdateRestaurant);
    app.delete("/admin/restaurant/:restaurantId", validator.bind({role : 2}), restaurantResolver.adminDeleteRestaurant);

    app.get("/admin/dish/:dishId", validator.bind({role : 2}), dishResolver.adminReadDish);
    app.get("/admin/dish", validator.bind({role : 2}), dishResolver.adminReadDishes);
    app.post("/admin/dish", validator.bind({role : 2}), dishResolver.createDish);
    app.post("/admin/dishStatus", validator.bind({role : 2}), dishResolver.adminUpdateDishStatusMulti);
    app.post("/admin/dish/:dishId", validator.bind({role : 2}), dishResolver.adminUpdateDish);
    app.post("/admin/dish/:dishId/:newStatus", validator.bind({role : 2}), dishResolver.adminUpdateDishStatus);
    app.delete("/admin/dish/:dishId", validator.bind({role : 2}), dishResolver.adminDeleteDish);
    app.delete("/admin/comment/:commentId", validator.bind({role : 2}), dishResolver.adminDeleteComment);

    app.get("/admin/categories", validator.bind({role : 2}), categoriesResolver.adminReadCategories);
    app.get("/admin/categories/:categoryId", validator.bind({role : 2}), categoriesResolver.adminReadCategory);
    app.post("/admin/categories", validator.bind({role : 2}), categoriesResolver.adminCreateCategory);
    app.post("/admin/categories/:categoryId", validator.bind({role : 2}), categoriesResolver.adminUpdateCategory);
    app.delete("/admin/categories/:categoryId", validator.bind({role : 2}), categoriesResolver.adminDeleteCategory);

    app.get("/admin/issues", validator.bind({role : 2}), issuesResolver.adminReadIssues);
    app.post("/admin/solveDishReport/:reportId", validator.bind({role : 2}), dishResolver.solveReport);
    app.post("/admin/solveUserReport/:reportId", validator.bind({role : 2}), userResolver.solveUserReport);
};