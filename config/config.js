/**
 * Copyright 2015 IBM Corp. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
 'use strict';

var bluemix  = require('./bluemix'),
  extend   = require('util')._extend,
  fs       = require('fs'),
  env      = process.env.VCAP_SERVICES ? 'prod' : 'dev';

var services = {

  "personality_insights": {
    "url":      '<url>',
    "username": '<username>',
    "password": '<password>',
    "version": 'v2'
  },

  "concept_insights": {
    "url":      '<url>',
    "username": '<username>',
    "password": '<password>',
    "version": 'v2'
  },

  // LinkedIn app credentials: https://www.linkedin.com/developer/apps/new
  "linkedin": {
    "app_key":    '<app_key>',
    "app_secret": '<app_secret>'
  },

  "cloudant": {
    "username": "<username>",
    "password": "<password>",
    "host": "<host>",
    "port": 443,
    "url": "<url>"
  }

};


// Get the service
if (env === 'prod') {
//   services.mongodb = bluemix.getServiceCreds('mongolab').url;
  services.personality_insights = extend({'version':'v2'}, bluemix.getServiceCreds('personality_insights'));
  services.concept_insights = extend({'version':'v2'}, bluemix.getServiceCreds('concept_insights'));
  services.cloudant = bluemix.getServiceCreds('cloudantNoSQLDB');
  services.linkedin.app_key = process.env.LINKEDIN_APPKEY;
  services.linkedin.app_secret = process.env.LINKEDIN_APPSECRET;
} else {
  services = JSON.parse(fs.readFileSync(__dirname + '/local.json', 'utf8'));
}

console.log(env);
console.log(services);

module.exports = {
    services: services
};
