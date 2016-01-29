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

	$('#loading').show();
	$('#concepts').hide();

	$.ajax({
		type: 'GET',
		url: '/db/jobs/' + $('#job_id').html(),
		dataType: 'json',
		success: function (data) {
			if (data) {
				$('#job-title').text(data.code + ' ' + data.title);
				$('#job-description').text(data.description);
				var table = $('#concepts-list');
				table.empty();
				var job = getJob(data.concept_id || data._id);
				//table.html(JSON.stringify(job));

				var concepts = [];
				job.annotations[0].forEach(function (data) {
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
					$('#template').clone()
						.find('.checkbox')
						.find('input')
						.attr('value', c.key)
						.attr('id', c.key)
						.end()
						.find('label')
						.html(c.label)
						.attr('for', c.key)
						.end()
						.end()
						.appendTo(table);
				});
			}
			/*$('#num-jobs').html(data.length + ' jobs');
			data.forEach(function(job) {
			  job.id = (job.concept_id || job._id);
			  $('<li>'+job.code+' '+'<strong>'+ job.title + '</strong>' + ' ' +
			    (job.requiredConcepts.length==0?'[set required concepts]':'OK') +
			    '&nbsp;<a href=\'/analyze-jobs/'+job._id+'\' target=\'_blank\'>'+'[find candidates]'+'</a>' +
			    //'<span id=\'job-'+job.id+'\'></span>' +
			    '</li>')
			  .appendTo($('#jobs-list'));
			});*/
			//handleJobs(data);
		},
		error: function (err) {
			console.error(err);
			showError(err.error || err);
		},
		complete: function (data) {
			$('#loading').hide();
			$('#concepts').show();
		}
	});

});

/**
 * Display an error or a default message
 * @param  {String} error The error
 */
function showError(error) {
	var defaultErrorMsg = 'Error processing the request, please try again later.';
	$('#error').show();
	$('#errorMsg').text((typeof error === "string") ? error : JSON.stringify(error) || defaultErrorMsg);
}

function showSuccess(message) {
	$('#success').show();
	$('#successMsg').text(message);
}

function cleanMessages() {
	$('#success').hide();
	$('#successMsg').text('');
	$('#error').hide();
	$('#errorMsg').text('');
}

function submitJob() {
		$('.btn').blur();
		$('#loading').show();
		cleanMessages();

		var con = [];
		console.log(JSON.stringify($("#concepts-form input:checkbox:checked").val()));

		$("#concepts-form input:checkbox:checked").each(function () {
			con.push($(this).val()); // add $(this).val() to your array
		});

		if (con.length == 0) {
			showError('Please select at least one concept.');
			$('#loading').hide();
			return;
		}

		//alert(JSON.stringify(con));

		$.ajax({
			type: "POST",
			url: '/db/jobs/' + $('#job_id').val(),
			data: {
				requiredConcepts: con
			},
			dataType: 'json',
			success: function (data) {
				console.log(data);
			},
			error: function (err) {
				showError(err);
			},
			complete: function (data) {
				$('#loading').hide();
				alert("Job updated successfuly!")
				var url = window.location.protocol + "//" + window.location.host + "/manage";
				window.location.href = url;
			}
		});

	} //); //click

function getJob(id) {
	var r;
	$.ajax({
		type: 'GET',
		async: false,
		url: '/ci/jobs/' + id,
		dataType: 'json',
		success: function (data) {
			if (!data.error) {
				r = data;
			} else {
				console.error(data);
				r = null;
			}
		},
		error: function (xhr) {
			console.error(xhr);
			r = null;
		}
	});
	return r;
}
