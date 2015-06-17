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
 $(document).ready(function () {
	$('#loading').hide();
	$('#loading2').show();
	$('#concepts').hide();
	$('#sug-cand').hide();
	var job_id = $('#job_id').html();
	findJob(job_id);
	findCandidates(job_id);
});

function findJob(id) {
	
	$.ajax({
	    type: 'GET',
	    async: false,
	    url: '/db/jobs/' + id,
	    dataType: 'json',
	    success: function(data) {
	      job = data;
	      $('#job-title').text(data.title + ' - ' + data.code);
	    },
	    error: function(err) {
	      console.error(err);
	    }
	});

	$.ajax({
		type: 'GET',
		async: false,
		url: '/ci/jobs/' + id,
		dataType: 'json',
		success: function (data) {
			$('#job-description').text(data.parts[0].data);
			var table = $('#concepts-list');
			var concepts = [];
			table.empty();

			data.annotations[0].forEach(function (data) {
				//console.log(JSON.stringify(data));
				var obj = {
					"label": decodeURIComponent(data.concept.substring(data.concept.lastIndexOf('/') + 1).replace(/_/g, ' ')),
					"key": data.concept,
					"weight": Math.ceil(data.weight * 100)
				};
				var exists = false;
				for (var i = 0; i < concepts.length; i++) {
					if (concepts[i].key == obj.key) {
						concepts[i].weight += obj.weight;
						exists = true;
						break;
					}
				}
				if (!exists) {
					concepts.push(obj);
				}
			});
			// sort by weight desc to show first the more relevant concepts
			concepts.sort(function (a, b) {
				return a.label.localeCompare(b.label)
			});
			concepts.forEach(function (c) {
				$('<div/>').html(c.label).appendTo(table);
			});		
		},
		error: function (xhr) {
			console.error(xhr);
			r = null;
		},
		complete: function (data) {
			$('#loading').hide();
			$('#concepts').show();
		}
	});
}


function findCandidates(id) {
	$('#loading2').show();
	$('#sug-cand').hide();
	$.ajax({
		type: 'GET',
		async: false,
		url: '/ci/semantic_search/job/' + id + "/12",
		dataType: 'json',
		success: function (data) {
			showCandidates(data);
		},
		error: function (xhr) {
			console.error(xhr);
			r = null;
		},
		complete: function (data) {
			$('#loading2').hide();
			$('#sug-cand').show();
		}
	});
}


function showCandidates(candidates) {
	candidates.results.forEach(function (candidate) {
		
		if(candidate.candidatePictureUrl === "images/user.png" || candidate.candidatePictureUrl === "" || candidate.candidatePictureUrl === undefined )
			candidate.candidatePictureUrl = "/images/user.png";
		
		var score = Math.ceil(candidate.score * 100) + "%";
		$('<div class="col-lg-1"/>')
			.html('<div><a href=\'/user/'+ candidate.id +'\'><img src=\"' + candidate.candidatePictureUrl + '\"/ height=\"80\"></a></div>' 
				+ '<div>' + candidate.label 
				+ '<p class=\'_' + Math.round(candidate.score * 10) + '\'>' 
				+ score + '</p></div>')
			.appendTo("#candidates");
	});
}
