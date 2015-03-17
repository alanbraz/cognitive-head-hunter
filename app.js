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


var express = require('express'),
  app = express(),
  bluemix = require('./config/bluemix'),
  watson = require('watson-developer-cloud'),
  extend = require('util')._extend;

// Bootstrap application settings
require('./config/express')(app);

var appKey = '781og0rurwqsom', 
    appSecret = '9FnyK7slh4CuPxFo', 
    token = {
      oauth_token: '812992a9-6e42-4ba3-8c47-3eb6309a8c1a', 
      oauth_token_secret: '4ab51366-ddd9-461e-b09a-e144810de822'
    };


var linkedin_client = require('linkedin-js')
  ("7520yhhithxeg8", "fvrctKbDcwYtJJKF", 'http://localhost:3000/auth');

app.get('/', function(req, res){
    res.render('index', { user: req.session.user });
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

app.get('/profile', function (req, res) {
	  // the first time will redirect to linkedin
	console.log(req.session);
	linkedin_client.apiCall('GET', '/people/~:' + 
    '(id,formatted-name,first-name,last-name,headline,skills:(skill:(name)),' + 
      'educations,languages:(language:(name)),twitter-accounts,industry,' + 
      'three-current-positions,three-past-positions,volunteer,' + 
      'interests,summary,positions,specialties,picture-url,public-profile-url,' + 
      'publications,patents,certifications,' + 
      'courses,recommendations-received,honors-awards)', 
      { token : req.session.token }, 
    function(error, result) {
		
		console.log('api call callback');
		if (error) {
			res.json(error);
		} else {
			req.session.user = transformProfile(result);
			console.log(result.hasOwnProperty('publications'));
			res.redirect('/');
		}
	});
});

app.post('/message', function (req, res) {
    console.log("message \n" + req.session.token);
	  linkedin_client.apiCall('POST', '/people/~/shares',
	    {
	      token: req.session.token,
	      share: {
	        comment: req.param('message'),
	        visibility: {code: 'anyone'}
	      }
	    }
	  , function (error, result) {
  		  console.log(error);
  		  res.json(result);
	    }
	  );
	}); 

var ci_credentials = {
  version: 'v1',
  url: 'https://gateway.watsonplatform.net/concept-insights-beta/api',
  username: '58236fbc-904e-4317-ad6d-c98a34744e9c',
  password: 'J4DjaOigWNuU',
  use_vcap_services: false,
  corpus_jobs: 'testmatchmyjob',
  corpus_candidates: 'candidates'
}; // Bluemix externo, bind manual


// Create the service wrapper
var conceptInsights = watson.concept_insights(ci_credentials);

app.put('/job', function(req, res) {
	/* { code: 'RES-91203213', title: 'Software intern',
    description: 'la la la' } */
  // TODO transform body 
  // TODO test
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
      corpus: ci_credentials.corpus_jobs
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

app.put('/candidate', function(req, res) {

  var input = req.body;
  var params = {
    document: {
        id: input.id,
        label: input.full-name,
        parts: [
            {
                data: input.data,
                name: "Candidate",
                type: "text"
            }
        ],
        candidatePictureUrl: input.picture-url,
        candidatePublicProfileUrl: input.public-profile-url
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
	
app.get('/semantic_search/:corpus', function (req, res) {
  var payload = extend({
    func:'semanticSearch',
    user: ci_credentials.username,
    corpus: req.params.corpus
  }, req.query);
  console.log(req.params);
  console.log(req.query);
  console.log(payload);

  // ids needs to be stringify
  payload.ids = JSON.stringify(payload.ids);

  conceptInsights.semanticSearch(payload, function(error, result) {
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

// render index page
app.get('/', function(req, res) {
  res.render('index', { content: 'alan braz' });
});

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



var port = process.env.VCAP_APP_PORT || 3000;
app.listen(port);
console.log('listening at:', port);

var transformProfile = function(data){
  	
  	var profile = {};
  	var textData = "";
  	var positionData = "";
  	var publicationData = "";
  	var patentData = "";
  	var languageData = "";
  	var skillData = "";
  	var certificationData = "";
  	var educationData = "";
  	var courseData = "";
  	var recommendationData = "";
  	
  	profile.id = data.id;
  	profile.fullName = data.formattedName;
  	textData += (data.interests || "") + ".";
  	textData += (data.summary || "") + ".";
  	textData += (data.specialties || "") + ".";
  	textData += (data.industry || "") + ".";
  	profile.pictureUrl = (data.pictureUrl || "");
  	profile.publicProfileUrl = (data.publicProfileUrl || "");
  	
  	if(data.hasOwnProperty('positions')){
  		console.log('tem positions');
  		for(var i=0; i < (data.positions._total); i++){
  	  		var position = data.positions.values[i];
  	  		positionData += (position.title || "") + ".";
  	  		positionData += (position.summary || "") + ".";
  	  	}
  	}
  	
  	if(data.hasOwnProperty('publications')){
  		console.log('tem publications');
  		for(var i=0; i < (data.publications._total); i++){
  	  		var publication = data.publications.values[i];
  	  		publicationData += (publication.title || "") + ".";
  	  		publicationData += (publication.summary || "") + ".";
  	  	}
  	}
  	
  	if(data.hasOwnProperty('patents')){
  		console.log('tem patents');
  		for(var i=0; i < (data.patents._total); i++){
  	  		var patent = data.patents.values[i];
  	  		patentData += (patent.title || "") + ".";
  	  		patentData += (patent.summary || "") + ".";
  	  	}
  	}
  	
  	if(data.hasOwnProperty('languages')){
  		console.log('tem languages');
  		for(var i=0; i < (data.languages._total); i++){
  	  		var language = data.languages.values[i].language;
  	  		languageData += (language.name || "") + ".";
  	  	}
  	}
  	
  	if(data.hasOwnProperty('skills')){
  		console.log('tem skills');
  		for(var i=0; i < (data.skills._total); i++){
  	  		var skill = data.skills.values[i].skill;
  	  		skillData += (skill.name || "") + ".";
  	  	}
  	}
  	
  	if(data.hasOwnProperty('certifications')){
  		console.log('tem certifications');
  		for(var i=0; i < (data.certifications._total); i++){
  	  		var certification = data.certifications.values[i];
  	  		certificationData += (certification.name || "") + ".";
  	  	}
  	}
  	
  	if(data.hasOwnProperty('educations')){
  		console.log('tem educations');
  		for(var i=0; i < (data.educations._total); i++){
  	  		var education = data.educations.values[i];
  	  		
  	  		//educationData += (education.field-of-study || "") + ".";
  	  		educationData += (education.degree || "") + ".";
  	  		//educationData += (education.activities || "") + ".";
  	  	}
  	}
  	
  	if(data.hasOwnProperty('courses')){
  		console.log('tem courses');
  		for(var i=0; i < (data.courses._total); i++){
  	  		var course = data.courses.values[i];
  	  		courseData += (course.name || "") + ".";
  	  	}
  	}
  	
  	if(data.hasOwnProperty('recommendationsReceived')){
  	 	console.log('tem recommendationsReceived');
  		for(var i=0; i < (data.recommendationsReceived._total); i++){
  	  		var recommendation = data.recommendationsReceived.values[i];
  	  		recommendationData += (recommendation.recommendation-text || "") + ".";
  	  	}
  	}
  	
  	
  	profile.data = textData + "." + positionData + "." + 
  	publicationData + "." + 
  	patentData + "." + 
  	languageData + "." + 
  	skillData + "." + 
  	certificationData + "." + 
  	educationData + "." + 
  	courseData + "." + 
  	recommendationData + ".";
  	
  	return profile;
  };