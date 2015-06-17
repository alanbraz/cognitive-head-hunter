/*
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
var express    = require('express'),
    restful = require('node-restful'),
    extend = require('util')._extend,
    config  = require('./config'),
    bluemix = require('./bluemix'),
    mongoose = restful.mongoose;

var conceptSchema = mongoose.Schema({
      key: "string",
      id: "string",
      abstract: "string",
      label: "string",
      type: "string",
      link: "string",
      thumbnail: "string",
      ontology: [ "string" ]
    });

var conceptModel = restful.model('concept', conceptSchema);

var jobSchema = mongoose.Schema({
      code: "string",
      title: "string",
      description: "string",
      concept_id: "string",
      concepts: "number",
      requiredConcepts: [ "string" ]
    });

var jobModel = restful.model('job', jobSchema);

var candidateSchema = mongoose.Schema({
      name: "string",
      profile: "string",
      concept_id: "string",
      jobs: [ mongoose.Schema.Types.ObjectId ]
    });

var candidateModel = restful.model('candidate', candidateSchema);

module.exports = function (app) {

  mongoose.connect(config.services.mongodb); 

  var Concept = app.resource = conceptModel;
  Concept.methods(['get', 'post', 'put', 'delete']);
  Concept.register(app, '/db/concepts');

  var Job = app.resource = jobModel;
  Job.methods(['get', 'post', 'put', 'delete']);
  Job.register(app, '/db/jobs');

  var Candidate = app.resource = candidateModel;
  Candidate.methods(['get', 'post', 'put', 'delete']);
  Candidate.register(app, '/db/candidates');

};

module.exports.addConcept = function addConcept(concept) {
  conceptModel.findOne({ key: concept.key }, function (err, doc) {
    if (err) {
      console.log(err);
    } else {
      if (!doc) {
        console.log("add: " + concept.key);
        doc = new conceptModel;
      } else {
        console.log("update: " + concept.key);
      }
      copyAttributes(concept, doc);
      console.log('instance: ' +  doc);
      doc.save(function (err) {
        if (err) { 
               console.log('Error saving concept: ' + err); 
            } else {
              console.log('Success saving concept'); 
            }
        
      });
    }
  });
};

module.exports.getAllConcepts = function getAllConcepts(cache) {
  conceptModel.find({ }, 'key label ontology', function (err, docs) {
    if (err) {
      console.log(err);
    } else {
      docs.forEach(function(d){
        cache.push(d);
      });
    }
  });
}

function copyAttributes(src, obj) {
    for (var key in src) {
        obj[key] = src[key];
    }
}

module.exports.addJob = function addJob(job) {
  conceptModel.findOne({ concept_id: job.id }, function (err, doc) {
    if (err) {
      console.log(err);
    } else {
      if (!doc) {
        doc = new jobModel;
        doc.code = job.code || job.id;
        doc.concept_id = job.id;
        doc.title = job.label;
        doc.description = job.parts[0].data;
        doc.concepts = job.annotations[0].length;
        //console.log('instance: ' +  doc);
        doc.save(function (err) {
          if (err) { 
                console.log('Error saving job: ' + err); 
              } else {
                console.log('Success saving job'); 
              }
          
        });
      } else {
        console.log("nothing to do ");
      }
    }
  });
};

module.exports.addCandidate = function addCandidate(cand) {
  conceptModel.findOne({ concept_id: cand.id }, function (err, doc) {
    if (err) {
      console.log(err);
    } else {
      if (!doc) {
        console.log("add: " + cand.id);
        doc = new candidateModel;
        doc.name = cand.label;
        doc.concept_id = cand.id;
        doc.description = cand.parts[0].data;
        console.log('instance: ' +  doc);
        doc.save(function (err) {
          if (err) { 
                 console.log('Error saving candidate: ' + err); 
              } else {
                console.log('Success saving candidate'); 
              }
        });
      } else {
        console.log("nothing to do ");
      }
    }
  });

};