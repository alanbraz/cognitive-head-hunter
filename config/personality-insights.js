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