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

 //$(document).ready(function () {
	//$('#continue-btn').click(function () {
		//handleCreation();
	//});
//}); //ready


function handleCreation() {

	$('#loading').show();

	var profile = {};
	profile.text = $('#txt-profile').val();
	profile.name = $('#txt-name').val();

	$.ajax({
		type: 'GET',
		async: false,
		url: '/db/candidates/by-name/' + profile.name.toLowerCase(),
		dataType: 'json',
		success: function (data) {
			if (data.length > 0) {
				console.log(data[0]._id);
				profile.id = data[0]._id;
				redirectToParse(profile);
				// TODO update name and text
			} else {
				insertCandidate(profile);
			}
		},
		error: function (xhr) {
			console.log(xhr);
		}
	}); //get

}

function redirectToParse(data) {
	$.ajax({
		type: 'POST',
		async: true,
		data: data,
		url: '/parse',
		dataType: 'json',
		success: function (data) {
			var url = window.location.protocol + "//" + window.location.host + "/jobsearch";
			window.location.href = url;
		},
		error: function (error) {
			$('#loading').hide();
			console.log(error);
		}
	});
}

function insertCandidate(profile) {
	if (!profile.profile && profile.text) {
		profile.profile = profile.text;
	}
	$.ajax({
		type: "POST",
		url: '/db/candidates',
		data: profile,
		dataType: 'json',
		success: function (data) {
			profile.id = (data._id || data.id);
			console.log(data);
			redirectToParse(profile);
		},
		error: function (err) {
			console.log(err);
		}
	});
}
