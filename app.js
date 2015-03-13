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

// if bluemix credentials exists, then override local
var credentialsStage1 = extend({
  version: 'v1',
  url: 'https://gateway-s.watsonplatform.net/concept-insights-beta/api',
  username: '128ee64b-f3cf-47c1-abe6-a30e8f6e39a0',
  password: 'hVDkrMx75De9'
}, bluemix.getServiceCreds('concept-insights')); // VCAP_SERVICES

var credentials = {
  version: 'v1',
  url: 'https://gateway.watsonplatform.net/concept-insights-beta/api',
  username: '58236fbc-904e-4317-ad6d-c98a34744e9c',
  password: 'J4DjaOigWNuU',
  use_vcap_services: false,
  corpus_jobs: 'testmatchmyjob',
  corpus_candidates: 'candidates'
}; // Bluemix externo, bind manual


// Create the service wrapper
var conceptInsights = watson.concept_insights(credentials);

app.get('/', function(req, res){
    res.render('index');
});

/*app.get('/label_search', function (req, res) {
  var payload = extend({
    func:'labelSearch',
    limit: 4,
    prefix:true,
    concepts:true,
  }, req.query);

  conceptInsights.labelSearch(payload, function(error, result) {
    if (error)
      return res.status(error.error ? error.error.code || 500 : 500).json(error);
    else
      return res.json(result);
  });
});

app.get('/semantic_search', function (req, res) {
  var payload = extend({
    func:'semanticSearch',
  }, req.query);

  // ids needs to be stringify
  payload.ids = JSON.stringify(payload.ids);

  conceptInsights.semanticSearch(payload, function(error, result) {
    if (error)
      return res.status(error.error ? error.error.code || 500 : 500).json(error);
    else
      return res.json(result);
  });
});*/


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
    user: credentials.username,
    corpus: credentials.corpusname,
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
	console.log(credentials);
  console.log(req.query);

  var params = { 
      user: credentials.username,
      corpus: credentials.corpus_jobs
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
      user: credentials.username,
      corpus: credentials.corpus_jobs,
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
	console.log('inside .get /jobs');
	console.log(credentials);
  console.log(req.query);

  var params = { 
      user: credentials.username,
      corpus: credentials.corpus_candidates
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
      user: credentials.username,
      corpus: credentials.corpus_candidates,
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
        candidatePictureUrl: input.picture-url;
        candidatePublicProfileUrl: input.public-profile-url;
    },
    user: credentials.username,
    corpus: credentials.corpus_candidates,
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
    user: credentials.username,
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


var port = process.env.VCAP_APP_PORT || 3000;
app.listen(port);
console.log('listening at:', port);
