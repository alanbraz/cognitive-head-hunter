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

// Module dependencies
var express = require('express'),
  bluemix = require('./bluemix'),
  config  = require('./config'),
  watson = require('watson-developer-cloud'),
  extend = require('util')._extend;

// Create the service wrapper
var personalityInsights = new watson.personality_insights(config.services.personality_insights);

module.exports = function (app) {

  	app.post('/pi/', function(req, res) {
	  personalityInsights.profile(req.body, function(err, profile) {
		if (err) {
		  if (err.message){
			err = { error: err.message };
		  }
		  return res.status(err.code || 500).json(err || 'Error processing the request');
		}
		else
		  return res.json(profile);
	  });
	});

};