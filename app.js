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
	config  = require('./config/config'),
	watson = require('watson-developer-cloud'),
	extend = require('util')._extend,
	parser = require('./controllers/parser');

// Bootstrap application settings
require('./config/express')(app);
require('./config/personality-insights')(app);
var db = require('./config/db');
db(app);
console.log(config.services);

var conceptsCache = [];

var linkedin_client = require('linkedin-js')
	(	config.services.linkedin.app_key,
		config.services.linkedin.app_secret,
		uri + '/auth');

var full_profile = "proposal-comments,associations,interests,projects," +
	"publications,patents,languages,skills,certifications," +
	"educations,courses,volunteer,recommendations-received,honors-awards";

var basic_profile = "id,formatted-name,headline,location,industry,summary,specialties," +
	"positions,picture-url,public-profile-url,email-address";

var corpus = {
	jobs: 'jobs',
	candidates: 'candidates'
};

var accountId = "";

// Create the service wrapper
var ci_credentials = config.services.concept_insights;
var conceptInsights = watson.concept_insights(ci_credentials);

// create both corpus automatically
//Already adapted to V2
conceptInsights.accounts.getAccountsInfo({}, function(error, data){
	if (error) {
		return res.status(error.error ? error.error.code || 500 : 500).json(error);
	}
	accountId = data.accounts[0].account_id;
	console.log("account : " + accountId);

	corpus.jobs = "/corpora/"+accountId+"/"+corpus.jobs;
	corpus.candidates = "/corpora/"+accountId+"/"+corpus.candidates;

	 var params = {
	 	user: ci_credentials.username,
	 	corpus: corpus.jobs,
	 	access: "private",
	   	users: [
	 	    {
	 	      uid: ci_credentials.username,
	 	      permission: "ReadWriteAdmin"
	 	    }
	   	]
	 };

	 conceptInsights.corpora.createCorpus(params, function (error, result) {
		if (error) {
			console.log(JSON.stringify(error));
		} else {
			console.log(JSON.stringify(result));
		}
	 });

	  params.corpus = corpus.candidates;
		conceptInsights.corpora.createCorpus(params, function (error, result) {
		 	if (error) {
		 		console.log(JSON.stringify(error));
		 	} else {
		 		console.log(JSON.stringify(result));
		 	}
	 });
});


app.get('/', function (req, res) {
	res.render('home');
});

app.get('/about', function (req, res) {
	res.render('about');
});

app.get('/tos', function (req, res) {
	res.render('tos');
});

app.get('/jobs/import', function (req, res) {
	res.render('import-jobs');
});
//
// app.get('/candidates/import', function (req, res) {
// 	res.render('import-candidates');
// });

app.get('/analyze', function (req, res) {
	res.render('analyze');
});

app.get('/concepts/required/:id', function (req, res) {
	res.render('req-concepts', {
		job_id: req.params.id
	});
});

//Already adapted to V2
app.get('/analyze-jobs/:id', function (req, res) {

	var params = {
		id: corpus.jobs +"/documents/"+ req.params.id
	};

	console.log(params.id);
	conceptInsights.corpora.getDocument(params, function (error, document) {
		if (error) {
			return res.status(error.error ? error.error.code || 500 : 500).json(error);
		} else {

			conceptInsights.corpora.getDocumentAnnotations(params, function (error, annotations) {
				if (error) {
					return res.status(error.error ? error.error.code || 500 : 500).json(error);
				} else {

					var jobFull = extend(document, annotations);
					console.log(jobFull);
					req.session.job = jobFull;
					res.render('analyze-jobs', {
						job: jobFull
					});
				}
			});
		}
	});
});

app.get('/jobsearch', function (req, res) {
	clearSession(req.session);
	res.render('user-dashboard', {
		user: req.session.user
	});
});

app.get('/candidatesearch/:jobid', function (req, res) {
	res.render('job-dashboard', {
		jobid: req.params.jobid
	});
});

app.get('/manage', function (req, res) {
	res.render('manage');
});

app.get('/auth', function (req, res) {

	linkedin_client.getAccessToken(req, res, function (error, token) {

		if (error) {
			return console.error(error);
		} else {
			req.session.token = token;
			return res.redirect('/profile');
		}

	});
});
app.post('/parse', function (req, res) {
	req.session.user = cleanTextProfile(req.body);
	return res.json(req.session.user);
});

app.get('/profile', function (req, res) {
	// the first time will redirect to linkedin
	if (req.session.token) {
		linkedin_client.apiCall('GET', '/people/~:' +
			  '(' + basic_profile + ')', {
				token: req.session.token
			},
			function (error, result) {
				if (error) {
					res.json(error);
				} else {

					req.session.user = transformProfile(result);
					parser.getLinkedInFullProfile(req.session.user.publicProfileUrl, req, res, function(req, res, data){
						if (data) {
							req.session.user.data = clearText(data);
							console.log(req.session.user);
						}
						res.redirect('/jobsearch');
					});
				}
			});
	} else {
		res.redirect('/');
	}
});

conceptsCache.forEach(function (c) {
	console.log(JSON.stringify(c));
});

function getConcept(key) {
	var res = conceptsCache.filter(function (ob) {
		return ob.key === key;
	});
}

function getConceptDetails(id, callback) {
	var payload = {
		user: ci_credentials.username
	};
	payload.ids = [id];
	var concept;

	conceptInsights.getConceptsMetadata(payload, function (error, result) {
		if (error)
			console.log(error.error ? error.error.code || 500 : 500);
		else {
			result[0].key = id;
			callback(result[0]);
		}
	});
	return concept;
}

//Already adapted to V2
app.put('/ci/jobs', function (req, res) {

	var input = req.body;
	var params = {
		id: corpus.jobs + "/documents/" + input.id,
		document: {
			id: input.id,
			label: input.title,
			parts: [
				{
					data: input.description,
					name: "Job description",
					"content-type": "text/plain"
			}
		]
		},
		user: ci_credentials.username,
		corpus: corpus.jobs,
		documentid: input.id
	};
	conceptInsights.corpora.createDocument(params, function (error, result) {
		if (error)
			return res.status(error.error ? error.error.code || 500 : 500).send(error);
		else
			return res.status(200).send("OK");
	});
});


//Already adapted to V2
app.post('/ci/jobs', function (req, res) {

	var input = req.body;
	var params = {
		id: corpus.jobs + "/documents/" + input.id,
		document: {
			id: input.code,
			label: input.title,
			parts: [
				{
					data: input.description,
					name: "Job description",
					"content-type": "text/plain"
			}
		]
		},
		user: ci_credentials.username,
		corpus: corpus.jobs,
		documentid: input.code
	};
	conceptInsights.corpora.updateDocument(params, function (error, result) {
		if (error)
			return res.status(error.error ? error.error.code || 500 : 500).json(error);
		else
			return res.json(result);
	});
});

//Already adapted to V2
app.get('/ci/jobs', function (req, res) {

	var params = {
		user: ci_credentials.username,
		corpus: corpus.jobs //+"?limit=0",
	};

	conceptInsights.corpora.listDocuments(params, function (error, result) {
		if (error)
			return res.status(error.error ? error.error.code || 500 : 500).json(error);
		else
			return res.json(result);
	});
});

//Already adapted to V2
app.get('/ci/jobs/:id', function (req, res) {
	var params = {
		id: corpus.jobs +"/documents/"+ req.params.id
	};

	console.log(params.id);

	conceptInsights.corpora.getDocument(params, function (error, document) {
		if (error)
			return res.status(error.error ? error.error.code || 500 : 500).json(error);
		else {

			conceptInsights.corpora.getDocumentAnnotations(params, function (error, annotations) {
				if (error) {
					return res.status(error.error ? error.error.code || 500 : 500).json(error);
				} else {

					var jobFull = extend(document, annotations);
					return res.json(jobFull);
				}
			});
		}
	});
});

//New V2 Method
app.get('/ci/jobs/:id/annotations', function (req, res) {
	var params = {
		id: corpus.jobs +"/documents/"+ req.params.id
	};

	console.log(params.id);

	conceptInsights.corpora.getDocumentAnnotations(params, function (error, result) {
		if (error)
			return res.status(error.error ? error.error.code || 500 : 500).json(error);
		else
			return res.json(result);
	});
});

//Already adapted to V2
app.delete('/ci/jobs/:id', function (req, res) {
	var params = {
		id: corpus.jobs +"/documents/"+ req.params.id
	};
	console.log(params.id);


	conceptInsights.corpora.deleteDocument(params, function (error, result) {
		if (error)
			return res.status(error.error ? error.error.code || 500 : 500).json(error);
		else
			return res.json(result);
	});
});

//Already adapted to V2
app.get('/ci/candidates', function (req, res) {
	var params = {
		user: ci_credentials.username,
		corpus: corpus.candidates //+"?limit=0"
	};

	conceptInsights.corpora.listDocuments(params, function (error, result) {
		if (error)
			return res.status(error.error ? error.error.code || 500 : 500).json(error);
		else
			return res.json(result);
	});
});

//Already adapted to V2; Need to check in the UI for possible problems
app.get('/user/:id', function (req, res) {
	var params = {
		id: corpus.candidates +"/documents/"+ req.params.id
	};
	console.log(params.id);


	conceptInsights.corpora.getDocument(params, function (error, result) {
		if (error)
			return res.status(error.error ? error.error.code || 500 : 500).json(error);
		else {
			var temp = JSON.parse(JSON.stringify(result));
			console.log("id: " +temp.id);
			var newUser = {};

			newUser.id = temp.id;
			newUser.fullName = temp.label;
			newUser.pictureUrl = temp.candidatePictureUrl || "/images/user.png";
			newUser.headline = temp.candidateHeadline || '';
			newUser.publicProfileUrl = temp.candidatePublicProfileUrl;
			newUser.data = temp.parts[0].data;

			return res.render('user-dashboard', {
				user: newUser
			});
		}
	});
});

//Already adapted to v2
app.get('/ci/candidates/:id', function (req, res) {
	var params = {
		id: corpus.candidates +"/documents/"+ req.params.id
	};

	console.log(params.id);
	conceptInsights.corpora.getDocument(params, function (error, document) {
		if (error)
			return res.status(error.error ? error.error.code || 500 : 500).json(error);
		else {

			conceptInsights.corpora.getDocumentAnnotations(params, function (error, annotations) {
				if (error) {
					return res.status(error.error ? error.error.code || 500 : 500).json(error);
				} else {

					var candidateFull = extend(document, annotations);
					return res.json(candidateFull);
				}
			});
		}
	});
});

//NEW Method: Now getDocument document didn't contains annotations; Need to get it manually
app.get('/ci/candidates/:id/annotations', function (req, res) {
	var params = {
		id: corpus.candidates +"/documents/"+ req.params.id
	};

	console.log(params.id);
	conceptInsights.corpora.getDocumentAnnotations(params, function (error, result) {
		if (error)
			return res.status(error.error ? error.error.code || 500 : 500).json(error);
		else
			return res.json(result);
	});
});

//Already adapted to V2
app.delete('/ci/candidates/:id', function (req, res) {
	var params = {
		id: corpus.candidates +"/documents/"+ req.params.id
	};

	console.log(params.id);
	conceptInsights.corpora.deleteDocument(params, function (error, result) {
		if (error)
			return res.status(error.error ? error.error.code || 500 : 500).json(error);
		else
			return res.json(result);
	});
});

//Already adapted to V2
app.post('/ci/candidates', function (req, res) {

	var input = req.body;
	var params = {
		id: corpus.candidates + "/documents/" + input.id,
		document: {
			id: input.id,
			label: input.fullName,
			parts: [
				{
					data: input.data,
					name: "Candidate",
					"content-type": "text/plain"
				}
			],
			candidatePictureUrl: input.pictureUrl,
			candidatePublicProfileUrl: input.publicProfileUrl,
			candidateEmailAddress: input.emailAddress,
			candidateHeadline: input.headline
		},
		user: ci_credentials.username,
		corpus: corpus.candidates,
		documentid: input.id
	};

	conceptInsights.corpora.updateDocument(params, function (error, result) {
		if (error)
			return res.status(error.error ? error.error.code || 500 : 500).json(error);
		else
			return res.json(result);
	});

});

//Already adapted to V2
app.put('/ci/candidates', function (req, res) {

	var input = req.body;
	var params = {
		id: corpus.candidates + "/documents/" + input.id,
		document: {
			id: input.id,
			label: input.fullName,
			parts: [
				{
					data: input.data,
					name: "Candidate",
					"content-type": "text/plain"
				}
			],
			candidatePictureUrl: input.pictureUrl,
			candidatePublicProfileUrl: input.publicProfileUrl,
			candidateEmailAddress: input.emailAddress,
			candidateHeadline: input.headline
		},
		user: ci_credentials.username,
		corpus: corpus.candidates,
		documentid: input.id
	};

	conceptInsights.corpora.createDocument(params, function (error, result) {
		if (error)
			return res.status(error.error ? error.error.code || 500 : 500).json(error);
		else
			return res.json(result);
	});

});

//Already adapted to v2

app.get('/ci/semantic_search/candidate/:candidate/:limit', function (req, res) {

	var candidateId = corpus.candidates + "/documents/" + req.params.candidate;
	var params = {
		corpus: corpus.jobs,
		ids: [candidateId],
		limit: req.params.limit
	}

	console.log(JSON.stringify(params));
	conceptInsights.corpora.getRelatedDocuments(params, function (error, result) {
		if (error)
			return res.status(error.error ? error.error.code || 500 : 500).json(error);
		else {
			console.log("result of search on candidate side : ");
			console.log(JSON.stringify(result));
			return res.json(result);
		}
	});
});

//Already adapted to V2
app.get('/ci/semantic_search/job/:job/:limit', function (req, res) {
	var jobId = corpus.jobs + "/documents/" + req.params.job;
	var params = {
		corpus: corpus.candidates,
		ids: [jobId],
		limit: req.params.limit
	}

	console.log(JSON.stringify(params));
	conceptInsights.corpora.getRelatedDocuments(params, function (error, result) {
		if (error)
			return res.status(error.error ? error.error.code || 500 : 500).json(error);
		else {
			console.log("result of search on hr manager side : ");
			console.log(JSON.stringify(result));
			return res.json(result);
		}
	});
});

//Already adapted to v2
app.get('/ci/graph_search/:id', function (req, res) {
	var params = {
		id: "/graphs/wikipedia/en-20120601/concepts/" + req.params.id
	}

	console.log(params.id);
	conceptInsights.graphs.getConcept(params, function (error, result) {
		if (error)
			return res.status(error.error ? error.error.code || 500 : 500).json(error);
		else
			return res.json(result);
	});
});


function transformProfile(data) {

	var profile = {};

	profile.id = data.id;
	profile.fullName = data.formattedName;
	profile.headline = data.headline;
	profile.pictureUrl = (data.pictureUrl || "");
	profile.publicProfileUrl = (data.publicProfileUrl || "");
	profile.emailAddress = (data.emailAddress || "");

	profile.data = (data.summary || "") + ". ";

	profile.data += (data.associations || "") + ". ";

	if (data.hasOwnProperty('certifications')) {
		console.log('tem certifications');
		for (var i = 0; i < (data.certifications._total); i++) {
			var certification = data.certifications.values[i];
			profile.data += (certification.name || "") + ", ";
		}
		profile.data += ". ";
	}

	if (data.hasOwnProperty('courses')) {
		console.log('tem courses');
		for (var i = 0; i < (data.courses._total); i++) {
			var course = data.courses.values[i];
			profile.data += (course.name || "") + ", ";
		}
		profile.data += ". ";
	}

	if (data.hasOwnProperty('educations')) {
		console.log('tem educations');
		for (var i = 0; i < (data.educations._total); i++) {
			var education = data.educations.values[i];
			profile.data += (education.fieldOfStudy || "") + ", ";
			profile.data += (education.degree || "") + ", ";
			profile.data += (education.notes || "") + ", ";
		}
		profile.data += ". ";
	}

	if (data.hasOwnProperty('honorsAwards')) {
		console.log('tem honor awards');
		for (var i = 0; i < (data.honorsAwards._total); i++) {
			var award = data.skills.values[i];
			profile.data += (award.name || "") + ", ";
		}
		profile.data += ". ";
	}

	profile.data += (data.industry || "") + ". ";
	profile.data += (data.interests || "") + ". ";

	if (data.hasOwnProperty('languages')) {
		console.log('tem languages');
		for (var i = 0; i < (data.languages._total); i++) {
			var language = data.languages.values[i].language;
			profile.data += (language.name || "") + ", ";
		}
		profile.data += ". ";
	}

	profile.data += (data.location.name || "") + ". ";


	if (data.hasOwnProperty('positions')) {
		console.log('tem positions');
		for (var i = 0; i < (data.positions._total); i++) {
			var position = data.positions.values[i];
			profile.data += (position.title || "") + ", ";
			profile.data += (position.summary || "") + ", ";
		}
		profile.data += ". ";
	}

	if (data.hasOwnProperty('projects')) {
		console.log('tem projects');
		for (var i = 0; i < (data.projects._total); i++) {
			var project = data.projects.values[i];
			profile.data += (project.name || "") + ", ";
			profile.data += (project.description || "") + ", ";
		}
		profile.data += ". ";
	}

	if (data.hasOwnProperty('publications')) {
		console.log('tem publications');
		for (var i = 0; i < (data.publications._total); i++) {
			var publication = data.publications.values[i];
			profile.data += (publication.title || "") + ", ";
			profile.data += (publication.summary || "") + ", ";
		}
		profile.data += ". ";
	}

	if (data.hasOwnProperty('patents')) {
		console.log('tem patents');
		for (var i = 0; i < (data.patents._total); i++) {
			var patent = data.patents.values[i];
			profile.data += (patent.title || "") + ", ";
			profile.data += (patent.summary || "") + ", ";
		}
		profile.data += ". ";
	}

	if (data.hasOwnProperty('recommendationsReceived')) {
		console.log('tem recommendationsReceived');
		for (var i = 0; i < (data.recommendationsReceived._total); i++) {
			var recommendation = data.recommendationsReceived.values[i];
			profile.data += (recommendation.recommendationText || "") + ", ";
		}
		profile.data += ". ";
	}

	if (data.hasOwnProperty('skills')) {
		console.log('tem skills');
		for (var i = 0; i < (data.skills._total); i++) {
			var skill = data.skills.values[i].skill;
			profile.data += (skill.name || "") + ", ";
		}
		profile.data += ". ";
	}

	profile.data += (data.specialties || "") + ". ";


	profile.data = clearText(profile.data);

	return profile;
}

function cleanTextProfile(data) {

	var profile = {};

	profile.id = data.id || "";
	profile.fullName = data.name;
	profile.pictureUrl = (data.pictureUrl || "/images/user.png");
	profile.publicProfileUrl = (data.publicProfileUrl || "");
	profile.emailAddress = (data.emailAddress || "");

	profile.data = clearText(data.text);

	return profile;
}

function clearSession(session) {

	if (session.token) {
		session.token = null;
	}

	if (session.text) {
		session.text = null;
	}
}

function clearText(text){

	var cleanText = text;
	cleanText = cleanText.replace(/(\n)/g, ' ');
	cleanText = cleanText.replace(/\s(\s)+/g, ' ');
	cleanText = cleanText.replace(/\,\s(\,\s)+/g, ', ');
	cleanText = cleanText.replace(/\.\s(\.\s)+/g, '. ');
	cleanText = cleanText.replace(/\.\,/g, '.');
	cleanText = cleanText.replace(/\,\./g, '.');
	cleanText = cleanText.replace(/\,\s\.\s/g, '. ');
	cleanText = cleanText.replace(/\\/g, '');

	return cleanText;
}

app.listen(port);
