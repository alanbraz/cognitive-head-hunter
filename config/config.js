'use strict';

var bluemix  = require('./bluemix'),
  extend   = require('util')._extend,
  fs       = require('fs'),
  env      = process.env.VCAP_SERVICES ? 'prod' : 'dev';

var services = {
  
  mongodb: 'mongodb://localhost/<db name>',

  personality_insights: {
    url:      '<url>',
    username: '<username>',
    password: '<password>',
    version: 'v2'
  },

  concept_insights: {
    url:      '<url>',
    username: '<username>',
    password: '<password>',
    version: 'v1'
  },

  // LinkedIn app credentials: https://www.linkedin.com/developer/apps/new
  linkedin: {
    app_key:    '<app_key>',
    app_secret: '<app_secret>'
  }

};


// Get the service
if (env === 'prod') {
  services.mongodb = bluemix.serviceStartsWith('mongolab').uri;
  services.personality_insights = extend({'version':'v2'}, bluemix.serviceStartsWith('personality_insights'));
  services.concept_insights = extend({'version':'v1'}, bluemix.serviceStartsWith('concept_insights'));
  services.linkedin.app_key = process.env.LINKEDIN_APPKEY;
  services.linkedin.app_secret = process.env.LINKEDIN_APPSECRET;
} else {
  services = JSON.parse(fs.readFileSync(__dirname + '/local.json', 'utf8'));
}

console.log(services);

module.exports = {
    services: services
};
