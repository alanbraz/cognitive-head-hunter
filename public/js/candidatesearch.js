$(document).ready(function () {
	$('#loading').show();
	$('#loading2').show();
	$('#concepts').hide();
	var job_id = $('#job_id').html();
	findCandidates(job_id);
	findJob(job_id);
});

function findJob(id) {
	$.ajax({
		type: 'GET',
		async: false,
		url: '/ci/jobs/' + id,
		dataType: 'json',
		success: function (data) {
			$('#job-title').text(data.id + ' ' + data.label);
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
			$('#loading2').hide();
			$('#loading').hide();
			$('#concepts').show();
		}
	});
}


function findCandidates(id) {
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
		}
	});
}


function showCandidates(candidates) {
	candidates.results.forEach(function (candidate) {
		var score = Math.ceil(candidate.score * 100) + "%";
		$('<div class="col-lg-1"/>')
			.html('<div><img src=\"' + candidate.candidatePictureUrl + '\"/></div>' 
				+ '<div>' + candidate.label 
				+ '<p class=\'_' + Math.round(candidate.score * 10) + '\'>' 
				+ score + '</p></div>')
			.appendTo("#candidates");
	});
}
