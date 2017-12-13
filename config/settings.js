"use strict";
module.exports = {
    "local" : {
        "dataBase":{
            "replicaSetServers" : ["127.0.0.1:27017"],
            "databaseName" : "pepperjelly_db"
        },
        "googlePlaces" : "AIzaSyDL3nL5RSB4oLtSWmSk6L6GRzV2m87ygBw",
        "facebookAuth": {
            "clientID": "277134495951705",
            "clientSecret": "4918d66d0a9a37a9a930d58f553c728e",
            "profileFields": ['id', 'displayName', 'name', 'emails', 'age_range', 'link', 'gender', 'locale', 'timezone']
        },
        "googleAuth":{
            "clientID": "16827065516-n27lvdgh00rfsb6tg7utsb4kbu52chao.apps.googleusercontent.com",
            "clientSecret": "m6X9jodKPEI0sBbs4VTYk6l7",
            "callbackURL": "http://localhost:3000/api/v1/user/googleOAuth"
        },
        'sendgrid': {
            "linksBaseUrl" : "http://localhost:3000/",
            "apikey": "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",
            "mailSender": "noreply@pepperjellyapp.com"
        },
        "push":{
            "sandbox" : true,
            // authentication option A
            "apnPfxFile" : null,
            // authentication option B
            "apnCertFile" : "./certificates/development_push_cert.pem",
            "apnKeyFile" : "./certificates/development_push_cert.key"
        }
    },
    "development" : {
        "dataBase":{
            "replicaSetServers" : ["127.0.0.1:27017"],
            "databaseName" : "pepperjelly_db"
        },
        "googlePlaces" : "AIzaSyDL3nL5RSB4oLtSWmSk6L6GRzV2m87ygBw",
        "facebookAuth": {
            "clientID": "277134495951705",
            "clientSecret": "4918d66d0a9a37a9a930d58f553c728e",
            "profileFields": ['id', 'displayName', 'name', 'emails', 'age_range', 'link', 'gender', 'locale', 'timezone']
        },
        "googleAuth":{
            "clientID": "16827065516-n27lvdgh00rfsb6tg7utsb4kbu52chao.apps.googleusercontent.com",
            "clientSecret": "m6X9jodKPEI0sBbs4VTYk6l7",
            "callbackURL": "http://dtm-dev-01.dogtownmedia.com:3003/api/v1/user/googleOAuth"
        },
        'sendgrid': {
            "linksBaseUrl" : "http://dtm-dev-01.dogtownmedia.com:3003/",
            "apikey": "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",
            "mailSender": "noreply@pepperjellyapp.com"
        },
        "push":{
            "sandbox" : false,
            // authentication option A
            "apnPfxFile" : null,
            // authentication option B
            //"apnCertFile" : "./certificates/development_push_cert.pem",
            //"apnKeyFile" : "./certificates/development_push_cert.key"
            "apnCertFile" : "./certificates/production_push_cert.pem",
            "apnKeyFile" : "./certificates/production_push_cert.key"
        }
    },
    "production" : {
        "dataBase":{
            "user" : "user",
            "password" : "SOh3TbYhxuLiW8ypJPxmt1oOfL",
            "authDb" : "admin",
            "replicaSetServers" : ["ec2-52-39-101-172.us-west-2.compute.amazonaws.com:27017"],
            "databaseName" : "pepperjelly_db"
        },
        "googlePlaces" : "AIzaSyBXad2diFiK9rQw__TXxvoY5YCZRthgxCc",
        "facebookAuth": {
            "clientID": "1119883421407601",
            "clientSecret": "1864c450a6c6967ac6e735d78efd24c8",
            "profileFields": ['id', 'displayName', 'name', 'emails', 'age_range', 'link', 'gender', 'locale', 'timezone'],
            "callbackURL": "https://go.pepperjellyapp.com/api/v1/user/fbtoken"
        },
        "googleAuth":{
            "clientID": "704899774922-0ak660tm4g7a5459t74fika3kgee03mn.apps.googleusercontent.com",
            "clientSecret": "kJLTc5XeQSrwimSApzhfIcLr",
            "callbackURL": "https://go.pepperjellyapp.com/api/v1/user/googleOAuth"
        },
        'sendgrid': {
            "linksBaseUrl" : "https://go.pepperjellyapp.com/",
            "apikey": "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",
            "mailSender": "noreply@pepperjellyapp.com"
        },
        "push":{
            "sandbox" : false,
            // authentication option A
            "apnPfxFile" : null,
            // authentication option B
            "apnCertFile" : "./certificates/production_push_cert.pem",
            "apnKeyFile" : "./certificates/production_push_cert.key"
        }
    }
};