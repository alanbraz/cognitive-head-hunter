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
var express    = require('express'),
    extend = require('util')._extend,
    _ = require("underscore"),
    config  = require('./config'),
    bluemix = require('./bluemix'),
    cradle = require('cradle');

cradle.setup({
    host: config.services.cloudant.host,
    cache: true,
    raw: false,
    forceSave: true
  });

var connection = new(cradle.Connection)(config.services.cloudant.host, config.services.cloudant.port, {
      secure: true,
      cache: true,
      raw: false,
      forceSave: true,
      auth: {
        username: config.services.cloudant.username,
        password: config.services.cloudant.password
      }
});

var dbJobs = connection.database('jobs');
var dbCandidates = connection.database('candidates');

dbJobs.exists(function (err, exists) {
  if (err) {
    console.log('error', err);
  } else if (exists) {
    console.log('the jobs db is already here.');
  } else {
    console.log('jobs database does not exists.');
    db.create();
    db.save('_design/design', {
      views: {
        'by-code': {
          map: 'function (doc) {  emit(doc.code, 1); }'
        },
        'by-title': {
          map: 'function (doc) {  emit(doc.title, 1); }'
        }
      }
    });
  }
});

dbCandidates.exists(function (err, exists) {
  if (err) {
    console.log('error', err);
  } else if (exists) {
    console.log('the candidates db is already here.');
  } else {
    console.log('candidates database does not exists.');
    db.create();
    db.save('_design/design', {
      views: {
        'by-name': {
          map: 'function (doc) {  emit(doc.name.toLowerCase(), 1); }'
        }
      }
    });
  }
});

module.exports = function (app) {

  makeRoutes(app, "jobs", "by-code", dbJobs);
  makeRoutes(app, "candidates", "by-name", dbCandidates);

  function makeRoutes(app, name, view, db) {

    app.get('/db/'+name+'/'+view+'/:keyValue', function (req, res) {
      console.log("get from view " + view + " key: " + req.params.keyValue );
      db.view("design/"+view, { "key": req.params.keyValue.toLowerCase(), "include_docs": true }, function (err, docs) {
        if (err) {
          console.log(err);
          res.status(500).json(error);
        } else {
          res.status(200).json(_.map(docs, function(d) { return d.doc; }));
        }
      });
    });

    app.get('/db/'+name+'/:id', function (req, res) {
      console.log("get from " + name + " : " + req.params.id );
      db.get( req.params.id, function (err, doc) {
        if (err) {
          console.log(err);
          return res.status(500).json(error);
        }
        return res.status(200).json(doc);
      });
    });

    app.get('/db/'+name, function (req, res) {
      console.log("get all " + name );
      db.view("design/"+view, { "include_docs": true }, function (err, docs) {
        if (err) {
          console.log(err);
          return res.status(500).json(error);
        }
        var jobs = _.compact(
          _.map(docs, function(d) {
            return d.doc;
          })
        );
        return res.status(200).json(jobs);
      });
    });

    app.delete('/db/'+name+'/:id', function (req, res) {
      console.log("del from " + name + " : " + req.params.id);
      db.get( req.params.id, function (err, doc) {
        if (err) {
          console.log(err);
          return res.status(500).json(error);
        }
        db.remove(doc._id, doc._rev, function (error, doc) {
          if (err) {
            console.log(err);
            return res.status(500).json(error);
          }
          return res.status(200).json(doc);
        });
      });
    });
    app.post('/db/'+name, function (req, res) {
      console.log("post to " + name + "/n" + JSON.stringify(req.body));
      db.save( req.body, function (err, doc) {
        if (err) {
          console.log(err);
          res.status(500).json(error);
        } else {
          res.status(200).json(doc);
        }
      });
    });
  };

};
