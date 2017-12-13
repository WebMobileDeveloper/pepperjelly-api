module.exports = (function(){
    var getIp = function(req){
        return  req.headers['x-forwarded-for'] ||
            req.connection.remoteAddress ||
            req.socket.remoteAddress ||
            req.connection.socket.remoteAddress;
    };
    return {
        getIp : getIp
    }
})();