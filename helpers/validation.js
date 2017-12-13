"use strict";
module.exports = function(){
    var checkForNullModel = function(model){
        for(var key in model) {
            if(model.hasOwnProperty(key)){
                return false;
            }
        }
        return true;
    };
    return {
        checkForNullModel : checkForNullModel
    };
};