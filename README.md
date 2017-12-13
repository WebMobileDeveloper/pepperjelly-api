#Set-Up

#MongoDB
Install mongo 3 or above from [here](http://https://www.mongodb.com/download-center#community).

#AWS Elastic beanstalk Tools
Download and install from [here](http://docs.aws.amazon.com/elasticbeanstalk/latest/dg/eb-cli3.html).

#Node NVM
Install node version manager from [here](https://github.com/creationix/nvm).

Once installed use the stable version of node

    nvm install stable
    nvm use stable

#NPM - Install node modules
Install node packages

    npm install

#Run Project locally

    node server.js

A web port should be open for the API and webdashboard.

#Push to Elastic Beanstalk

    eb init

Select region from AWS, usually Oregan and then select app

    eb deploy

The app will be pushed to the live environment.

#Network Calls
Are documented in a postman collection file inside the repo.
