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

// Module dependencies
var express    = require('express'),
    restful = require('node-restful'),
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

module.exports = function (app) {

  //mongoose.connect("mongodb://f97de2c4-f673-40a0-866d-9b9bc43bf77b:e436a3a3-acf5-487c-83d9-8c771d2d6b6e@192.155.236.148:10201/db");
  mongoose.connect("mongodb://localhost/chh");

  var Concept = app.resource = conceptModel;
  Concept.methods(['get', 'post', 'put', 'delete']);
  Concept.register(app, '/concepts');

};

module.exports.Concept = conceptModel;

/*
  http://mongoosejs.com/docs/guide.html

  var blogSchema = new Schema({
    title:  String,
    author: String,
    body:   String,
    comments: [{ body: String, date: Date }],
    date: { type: Date, default: Date.now },
    hidden: Boolean,
    meta: {
      votes: Number,
      favs:  Number
    }
  });

  The permitted SchemaTypes are

      String
      Number
      Date
      Buffer
      Boolean
      Mixed
      ObjectId
      Array
  */