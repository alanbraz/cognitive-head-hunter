/**
 * Copyright 2014 IBM Corp. All Rights Reserved.
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

// There are many useful environment variables available in process.env.
// VCAP_APPLICATION contains useful information about a deployed application.
var appInfo = JSON.parse(process.env.VCAP_APPLICATION || "{}");
// TODO: Get application information and use it in your app.

// VCAP_SERVICES contains all the credentials of services bound to
// this application. For details of its content, please refer to
// the document or sample of each service.
var services = JSON.parse(process.env.VCAP_SERVICES || "{}");
// TODO: Get service credentials and communicate with bluemix services.

// The IP address of the Cloud Foundry DEA (Droplet Execution Agent) that hosts
// this application:
var host = (process.env.VCAP_APP_HOST || 'localhost');
// The port on the DEA for communication with the application:
var port = (process.env.VCAP_APP_PORT || 3000);

var uri = "http://" + host + ":" + port;
if (appInfo.application_uris) {
	uri = "http://" + appInfo.application_uris[0];
}


var express = require('express'),
  app = express(),
  bluemix = require('./config/bluemix'),
  watson = require('watson-developer-cloud'),
  extend = require('util')._extend;

// Bootstrap application settings
require('./config/express')(app);
require('./config/db')(app);
// TODO externalize linked, ci and pi stuff

var appKey = '781og0rurwqsom', 
	appSecret = '9FnyK7slh4CuPxFo';

var cavoto = { key: "7520yhhithxeg8", secret: "fvrctKbDcwYtJJKF"}

var linkedin_client = require('linkedin-js')
  (appKey, appSecret, uri + '/auth');

app.get('/', function(req, res){
	 res.render('home');
});

app.get('/analyze', function(req, res){
	  res.render('analyze');
	});

app.get('/jobsearch', function(req, res){
	  if (req.session.user)
		res.render('index', { user: req.session.user });
	  else
		res.redirect('/auth');
	});

app.get('/user/:id', function(req, res) {
	var params = { 
		user: ci_credentials.username,
		corpus: ci_credentials.corpus_candidates,
		documentid: req.params.id
	};

	conceptInsights.getDocument(params, function(error, result) {
	  if (error)
		return res.status(error.error ? error.error.code || 500 : 500).json(error);
	  else {
		  var temp = JSON.parse(JSON.stringify(result));
		  console.log(temp.id);
		  var newUser = {};

		  newUser.id = temp.id;
		  newUser.fullName = temp.label;
		  newUser.pictureUrl = temp.candidatePictureUrl;
		  newUser.headline = temp.candidateHeadline || '';
		  newUser.publicProfileUrl = temp.candidatePublicProfileUrl;
		  console.log(temp.lastmodified);
		  newUser.data = temp.parts[0].data;

		  return res.render('index', { user:  newUser});
	  }
	});
});

app.get('/manage', function(req, res){
	res.render('manage');
});

app.get('/candidates/list', function(req, res){
	res.render('candidates');
});

app.get('/auth', function (req, res) {
	
  linkedin_client.getAccessToken(req, res, function (error, token) {
	
	if (error) {
		console.error('error authenticating accessToken');
		return console.error(error);
	} else {
		req.session.token = token;
		console.log('success on getting access token');
	  console.log(token);
		return res.redirect('/profile');
	}
		
  });
});

app.get('/parse', function (req, res) {
	
	req.session.text = cleanTextProfile(req.params.text);
	console.log('success on cleaning text profile');
	console.log(req.session.text);
	return res.redirect('/profile');

});

app.get('/profile', function (req, res) {
	  // the first time will redirect to linkedin
	console.log(req.session);
	if(req.session.token){
		linkedin_client.apiCall('GET', '/people/~:' + 
				'(' + basic_profile + ',' + full_profile + ')', 
			{ token : req.session.token }, 			
			function(error, result) {
				console.log('api call callback');
				if (error) {
					res.json(error);
				} else {
					req.session.user = transformProfile(result);
					console.log("transformProfile");
					res.redirect('/jobsearch');
				}
			  });
	}
	else if(req.session.text){
		req.session.user = req.session.text
		console.log("req.session.text");
		res.redirect('/jobsearch');
	}
});

//https://developer.linkedin.com/docs/fields/full-profile
var full_profile =  "proposal-comments,associations,interests,projects," + 
					"publications,patents,languages,skills,certifications," +
					"educations,courses,volunteer,recommendations-received,honors-awards";
//https://developer.linkedin.com/docs/fields/basic-profile
var basic_profile = "id,formatted-name,headline,location,industry,summary,specialties," + 
					"positions,picture-url,public-profile-url,email-address";

var ci_credentials = {
  version: 'v1',
  url: 'https://gateway.watsonplatform.net/concept-insights-beta/api',
  username: '58236fbc-904e-4317-ad6d-c98a34744e9c',
  password: 'J4DjaOigWNuU',
  use_vcap_services: false,
  corpus_jobs: 'testmatchmyjob2',
  corpus_candidates: 'candidates2'
}; // Bluemix externo, bind manual


// Create the service wrapper
var conceptInsights = watson.concept_insights(ci_credentials);

app.put('/job', function(req, res) {
	
  var input = req.body;
  var params = {
	document: {
		id: input.code,
		label: input.title,
		parts: [
			{
				data: input.description,
				name: "Job description",
				type: "text"
			}
		]
	},
	user: ci_credentials.username,
	corpus: ci_credentials.corpus_jobs,
	documentid: input.code
  }  ;
	  conceptInsights.createDocument(params, function(error, result) {
	  	console.log('createDocument: ' + error + ' > ' + result);
		if (error)
		  return res.status(error.error ? error.error.code || 500 : 500).send(error);
		else
		  return res.status(200).send("OK");
	  });
});

app.post('/job', function(req, res) {
	
  var input = req.body;
  var params = {
	document: {
		id: input.code,
		label: input.title,
		parts: [
			{
				data: input.description,
				name: "Job description",
				type: "text"
			}
		]
	},
	user: ci_credentials.username,
	corpus: ci_credentials.corpus_jobs,
	documentid: input.code
}  ;
	  conceptInsights.updateDocument(params, function(error, result) {
		if (error)
		  return res.status(error.error ? error.error.code || 500 : 500).json(error);
		else
		  return res.json(result);
	  });
});

app.get('/jobs', function(req, res) {
	console.log('inside .get /jobs');
	console.log(ci_credentials);
  console.log(req.query);

  var params = { 
	  user: ci_credentials.username,
	  corpus: ci_credentials.corpus_jobs,
	  limit: 0
  };
	
	  conceptInsights.getDocumentIds(params, function(error, result) {
		if (error)
		  return res.status(error.error ? error.error.code || 500 : 500).json(error);
		else
		  return res.json(result);
	  });
});

app.get('/job/:id', function(req, res) {
  var params = { 
	  user: ci_credentials.username,
	  corpus: ci_credentials.corpus_jobs,
	  documentid: req.params.id
  };
  
	conceptInsights.getDocument(params, function(error, result) {
	  if (error)
		return res.status(error.error ? error.error.code || 500 : 500).json(error);
	  else
		return res.json(result);
	});
});

app.delete('/job/:id', function(req, res) {
  var params = { 
	  user: ci_credentials.username,
	  corpus: ci_credentials.corpus_jobs,
	  documentid: req.params.id
  };
  
	conceptInsights.deleteDocument(params, function(error, result) {
	  if (error)
		return res.status(error.error ? error.error.code || 500 : 500).json(error);
	  else
		return res.json(result);
	});
});

app.get('/candidates', function(req, res) {
  var params = { 
	  user: ci_credentials.username,
	  corpus: ci_credentials.corpus_candidates
  };
	
	  conceptInsights.getDocumentIds(params, function(error, result) {
		if (error)
		  return res.status(error.error ? error.error.code || 500 : 500).json(error);
		else
		  return res.json(result);
	  });
});

app.get('/candidate/:id', function(req, res) {
	var params = { 
		user: ci_credentials.username,
		corpus: ci_credentials.corpus_candidates,
		documentid: req.params.id
	};
  
	conceptInsights.getDocument(params, function(error, result) {
	  if (error)
		return res.status(error.error ? error.error.code || 500 : 500).json(error);
	  else
		return res.json(result);
	});
});

app.delete('/candidate/:id', function(req, res) {
	var params = { 
		user: ci_credentials.username,
		corpus: ci_credentials.corpus_candidates,
		documentid: req.params.id
	};
	conceptInsights.deleteDocument(params, function(error, result) {
	  if (error)
		return res.status(error.error ? error.error.code || 500 : 500).json(error);
	  else
		return res.json(result);
	});
});

app.post('/candidate', function(req, res) {

  	var input = req.body;
  	var params = {
		document: {
			id: input.id,
			label: input.fullName,
			parts: [
				{
					data: input.data,
					name: "Candidate",
					type: "text"
				}
			],
			candidatePictureUrl: input.pictureUrl,
			candidatePublicProfileUrl: input.publicProfileUrl,
			candidateEmailAddress: input.emailAddress,
			candidateHeadline: input.headline
		},
		user: ci_credentials.username,
		corpus: ci_credentials.corpus_candidates,
		documentid: input.id
	};
	
	conceptInsights.updateDocument(params, function(error, result) {
		if (error)
	  		return res.status(error.error ? error.error.code || 500 : 500).json(error);
		else
	  		return res.json(result); // TODO tratar melhor
	});
	
});

app.put('/candidate', function(req, res) {

  	var input = req.body;
  	var params = {
		document: {
			id: input.id,
			label: input.fullName,
			parts: [
				{
					data: input.data,
					name: "Candidate",
					type: "text"
				}
			],
			candidatePictureUrl: input.pictureUrl,
			candidatePublicProfileUrl: input.publicProfileUrl,
			candidateEmailAddress: input.emailAddress,
			candidateHeadline: input.headline
		},
		user: ci_credentials.username,
		corpus: ci_credentials.corpus_candidates,
		documentid: input.id
	};
	
	conceptInsights.createDocument(params, function(error, result) {
		if (error)
	  		return res.status(error.error ? error.error.code || 500 : 500).json(error);
		else
	  		return res.json(result);
	});
	
});
	
app.get('/semantic_search/:candidate/:limit', function (req, res) {
  var payload = extend({
	func:'semanticSearch',
	user: ci_credentials.username,
	corpus: ci_credentials.corpus_jobs,
	ids: ['/corpus/'+ ci_credentials.username + '/' + ci_credentials.corpus_candidates + '/' + req.params.candidate ],
	limit: req.params.limit || 5,
  }, req.query);
  //console.log(payload);

  // ids needs to be stringify
  payload.ids = JSON.stringify(payload.ids);
  //console.log(payload.ids);

  conceptInsights.semanticSearch(payload, function(error, result) {
	if (error)
	  return res.status(error.error ? error.error.code || 500 : 500).json(error);
	else
	  return res.json(result);
  });
});

app.get('/graph_search', function (req, res) {
	  var payload = extend({
		user: ci_credentials.username
	  }, req.query);
	  console.log(payload);

	  // ids needs to be stringify
	  payload.ids = JSON.stringify(payload.ids);
	  console.log(payload.ids);

	  conceptInsights.getConceptsMetadata(payload, function(error, result) {
		if (error)
		  return res.status(error.error ? error.error.code || 500 : 500).json(error);
		else
		  return res.json(result);
	  });
	});


var pi_credentials = extend({
	version: 'v2',
	url: "https://gateway-s.watsonplatform.net/personality-insights/api",
	username: "f6fe0c12-fb84-41a5-8f19-50032d6cad29",
	password: "QHGtHD142ZhU"
}, bluemix.getServiceCreds('personality_insights')); // VCAP_SERVICES

// Create the service wrapper
var personalityInsights = new watson.personality_insights(pi_credentials);

app.post('/', function(req, res) {
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

function transformProfile(data){
	
	var profile = {};
		
	profile.id = data.id;
	profile.fullName = data.formattedName;
	profile.headline = data.headline;
	profile.pictureUrl = (data.pictureUrl || "");
	profile.publicProfileUrl = (data.publicProfileUrl || "");
	profile.emailAddress = (data.emailAddress || "");
	
	profile.data = (data.summary|| "") + ". ";

	profile.data += (data.associations || "") + ". ";
	
	if(data.hasOwnProperty('certifications')){
		console.log('tem certifications');
		for(var i=0; i < (data.certifications._total); i++){
		var certification = data.certifications.values[i];
		profile.data += (certification.name || "") + ", ";
	  }
	  profile.data += ". ";
	}
	
	if(data.hasOwnProperty('courses')){
		console.log('tem courses');
		for(var i=0; i < (data.courses._total); i++){
			var course = data.courses.values[i];
			profile.data += (course.name || "") + ", ";
		}
	  profile.data += ". ";
	}
	
	if(data.hasOwnProperty('educations')){
		console.log('tem educations');
		for(var i=0; i < (data.educations._total); i++){
			var education = data.educations.values[i];
			profile.data += (education.fieldOfStudy || "") + ", ";
			profile.data += (education.degree || "") + ", ";
			profile.data += (education.notes || "") + ", ";
		}
	  profile.data += ". ";
	}
	
	if(data.hasOwnProperty('honorsAwards')){
		console.log('tem honor awards');
		for(var i=0; i < (data.honorsAwards._total); i++){
			var award = data.skills.values[i];
			profile.data += (award.name || "") + ", ";
		}
	  profile.data += ". ";
	}
	
	profile.data += (data.industry || "") + ". ";
	profile.data += (data.interests || "") + ". ";    
	
	if(data.hasOwnProperty('languages')){
		console.log('tem languages');
		for(var i=0; i < (data.languages._total); i++){
			var language = data.languages.values[i].language;
			profile.data += (language.name || "") + ", ";
		}
	  profile.data += ". ";
	}
	
	profile.data += (data.location.name || "") + ". ";

	
	if(data.hasOwnProperty('positions')){
		console.log('tem positions');
		for(var i=0; i < (data.positions._total); i++){
			var position = data.positions.values[i];
			profile.data += (position.title || "") + ", ";
			profile.data += (position.summary || "") + ", ";
		}
	  profile.data += ". ";
	}

	if(data.hasOwnProperty('projects')){
	  console.log('tem projects');
	  for(var i=0; i < (data.projects._total); i++){
		var project = data.projects.values[i];
		profile.data += (project.name || "") + ", ";
		profile.data += (project.description || "") + ", ";
	  }
	  profile.data += ". ";
	}
	
	if(data.hasOwnProperty('publications')){
		console.log('tem publications');
		for(var i=0; i < (data.publications._total); i++){
			var publication = data.publications.values[i];
			profile.data += (publication.title || "") + ", ";
			profile.data += (publication.summary || "") + ", ";
		}
	  profile.data += ". ";
	}
	
	if(data.hasOwnProperty('patents')){
		console.log('tem patents');
		for(var i=0; i < (data.patents._total); i++){
			var patent = data.patents.values[i];
			profile.data += (patent.title || "") + ", ";
			profile.data += (patent.summary || "") + ", ";
		}
	  profile.data += ". ";
	}
	
	if(data.hasOwnProperty('recommendationsReceived')){
		console.log('tem recommendationsReceived');
		for(var i=0; i < (data.recommendationsReceived._total); i++){
			var recommendation = data.recommendationsReceived.values[i];
			profile.data += (recommendation.recommendationText || "") + ", ";
		}
	  profile.data += ". ";
	}

	if(data.hasOwnProperty('skills')){
		console.log('tem skills');
		for(var i=0; i < (data.skills._total); i++){
			var skill = data.skills.values[i].skill;
			profile.data += (skill.name || "") + ", ";
		}
	  profile.data += ". ";
	}
	
	profile.data += (data.specialties || "") + ". ";
	
	
	profile.data = profile.data.replace(/(\n)/g, ' ');
	profile.data = profile.data.replace(/\s(\s)+/g, ' ');
	profile.data = profile.data.replace(/\,\s(\,\s)+/g, ', ');
	profile.data = profile.data.replace(/\.\s(\.\s)+/g, '. ');
	profile.data = profile.data.replace(/\.\,/g, '.');
	profile.data = profile.data.replace(/\,\./g, '.');
	profile.data = profile.data.replace(/\,\s\.\s/g, '. ');
	profile.data = profile.data.replace(/\\/g, '');

	return profile;
}

function cleanTextProfile(text){
	
	var profile = {};
	
	//profile.id = data.id;
	//profile.fullName = data.formattedName;
	//profile.headline = data.headline;
//	profile.pictureUrl = (data.pictureUrl || "");
//	profile.publicProfileUrl = (data.publicProfileUrl || "");
//	profile.emailAddress = (data.emailAddress || "");
	
	profile.data = text;
	profile.data = profile.data.replace(/(\n)/g, ' ');
	profile.data = profile.data.replace(/\s(\s)+/g, ' ');
	profile.data = profile.data.replace(/\,\s(\,\s)+/g, ', ');
	profile.data = profile.data.replace(/\.\s(\.\s)+/g, '. ');
	profile.data = profile.data.replace(/\.\,/g, '.');
	profile.data = profile.data.replace(/\,\./g, '.');
	profile.data = profile.data.replace(/\,\s\.\s/g, '. ');
	profile.data = profile.data.replace(/\\/g, '');
	
	return profile;
}


app.listen(port);
console.log('listening at:', port);
