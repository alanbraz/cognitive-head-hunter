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

 var NUM_OF_JOBS = 32;

$(document).ready(function () {

	var widgetId = 'vizcontainer', // Must match the ID in index.jade
		widgetWidth = 700,
		widgetHeight = 700, // Default width and height
		personImageUrl = '/images/Cognitive-Head-Hunter.png', // Can be blank
		minWords = 200;

	// Jquery variables
	var $content = $('#txt-profile'),
		$loading = $('.loading1'),
		$error = $('.error'),
		$errorMsg = $('.errorMsg'),
		$results = $('.results'),
		$personality = $('.personality');

	/**
	 * Clear the "textArea"
	 */
	$('#clear-btn').click(function () {
		$('#clear-btn').blur();
		$content.val('');
		$('#txt-name').val('');
		updateWordsCount();
	});

	/**
	 * Update words count on change
	 */
	$content.change(updateWordsCount);

	/**
	 * Update words count on copy/past
	 */
	$content.bind('paste', function (e) {
		setTimeout(updateWordsCount, 100);
	});

	/**
	 * 1. Create the request
	 * 2. Call the API
	 * 3. Call the methods to display the results
	 */
	$('#analysis-btn').click(function () {

		$('#summary').hide();
		$('#loading').show();
		// usando desse #raw escondido, acho q o melhor é usar o conteudo do textbox
		// $content.val()
		var $user = JSON.parse($('#raw').html());
		$user.data = $content.val().trim();
    $user.id = $user.id.split("/").pop();

		$('#concepts .content').hide();

		$.ajax({
			type: 'POST',
			async: true,
			data: {
				text: $content.val()
			},
			url: '/pi/',
			dataType: 'json',
			success: function (data) {
				$loading.hide();

				if (data.error) {
					showError(data.error);
				} else {
					$results.show();
					$personality.show();
					showTextSummary(data);
					showVizualization(data);
					showVizualizationSumamry(data);
				}

			},
			error: function (xhr) {
				$loading.hide();
				var error;
				try {
					error = JSON.parse(xhr.responseText);
				} catch (e) {}
				showError(error.error || error);
			}
		});

		// check candidate
		var candidate = getCandidate(($user.id || $user._id));


		if (!candidate) {
			// add or update
			$.ajax({
				type: (candidate)?'POST':'PUT',
				async: false,
				data: $user,
				url: '/ci/candidates',
				dataType: 'html',
				success: function (data) {
					console.log(JSON.stringify(data));
				},
				error: function (xhr) {
					console.error(xhr);
				}
			});

			// get update to show concepts
			candidate = getCandidate($user.id);

		}

		// call until state.status == "done" and state.stage == "ready"
		console.log(candidate.annotations || "no candidate");
		while (!candidate.annotations) {
			setTimeout(function () {
				console.log("wait");
			}, 3000);
			candidate = getCandidate($user.id);
			console.log(candidate.annotations || "no candidate");
		}

		// consolidate repetead candidate concepts
		var concepts = [];
		var conceptsArray = [];
    var conceptsToPopulate = [];
		// 0 is the candidate cv full text
		// will have to change if we store grad-level, language, location separated
		$.each(candidate.annotations[0], function (i, data) {

			var obj = {
				"id": data.concept.id,
				"weight": Math.ceil(data.score * 100)
			};
			var exists = false;
			for (var i = 0; i < concepts.length; i++) {
				if (concepts[i].id == obj.id) {
					concepts[i].weight += obj.weight;
					exists = true;
					break;
				}
			}
			if (!exists) {
				conceptsArray.push(data.concept);
				concepts.push(obj);
			}

		});
		// sort by weight desc to show first the more relevant concepts
		concepts.sort(function (a, b) {
			return parseInt(b.weight) - parseInt(a.weight)
		});

		// get all concept for the candidate

    for(var i = 0; i < conceptsArray.length; i++){
      $.get('/ci/graph_search/' + conceptsArray[i].id.split("/").pop(), function(concept){
        for (var j = 0; j < concepts.length; j++){
          if (concepts[j].id == concept.id) {

						concepts[j].summary = concept.abstract;
						concepts[j].label = concept.label;
						concepts[j].link = concept.link;
						concepts[j].ontology = concept.ontology; //used to clean up cities and dates
            conceptsToPopulate.push(concepts[j]);
            if(conceptsToPopulate.length == 5){
              populateConcepts(conceptsToPopulate);
						}
            break;
					}
        }
      });
    }

		 $.ajax({
		 	type: 'GET',
		 	async: true,
		 	url: '/ci/semantic_search/candidate/' + $user.id + "/" + NUM_OF_JOBS, // ab: 20 to degub, old value was 10
		 	dataType: 'json',
		 	success: function (data) {
		 		console.log("Result of semantic_search by candidate side");
        console.log(JSON.stringify(data));
		 		positionsToHtml(data.results);
		 	},
		 	error: function (xhr) {
		 		var error;
		 		try {
		 			error = JSON.parse(xhr.responseText);
		 		} catch (e) {}
		 		console.log(error.error || error);
		 		showError(error.error || error);
		 	}
		 });
	}); //click analyze button

	function populateConcepts(concepts) {
		$('#concepts .loading').hide();
		//console.log(concepts);
		conceptsToPie(concepts);
		$('#concepts').show();
		$('#concepts .content').show();
	}

	function conceptsToHtml(concepts) {
		var top = 10; //concepts.length
		for (var i = 0, show = top, length = concepts.length;
			(i < length && show > 0); i++) {
			var label = concepts[i].label;
			var weight = concepts[i].weight;
			var ont = concepts[i].ontology;

			var ignore = false;
			ignore = ignore || ($.inArray("Year", ont) > -1);
			ignore = ignore || ($.inArray("Place", ont) > -1);

			//console.log(concepts[i]);
			if (!ignore) {
				$('#concepts .content').append($('<div>' + label +
					//' (debug: '+ weight +' ' +
					//(ont || ' ') +//' ' +')' + // TODO
					'</div>'));
				show--;
			}
		}
	}
	function conceptsToPie(concepts) {
		var top = 4; //concepts.length
		var conceptsToShow = [];
		for (var i = 0, show = top, length = concepts.length;
			(i < length && show > 0); i++) {

			var label = concepts[i].label;
			var weight = concepts[i].weight;
			var ont = concepts[i].ontology;

			var ignore = false;
			// Removing location and dates
			ignore = ignore || ($.inArray("Year", ont) > -1);
			ignore = ignore || ($.inArray("Place", ont) > -1);
			ignore = ignore || ($.inArray("Organisation", ont) > -1);
			ignore = ignore || ($.inArray("Company", ont) > -1);

			if (!ignore) {
				var c = { label: label, weight: weight };
				conceptsToShow.push(c);
        show--;
			}
		}
		for( var j=0; j < conceptsToShow.length; j++) {
			var c = conceptsToShow[j];
			var rawPercentage = (c.weight*100)/conceptsToShow[0].weight;
      var percentage = rawPercentage > 100 ? 100 : rawPercentage; 
			var conceptPie = $('#concept' + (j+1));
			conceptPie.attr("data-percent", percentage);
			conceptPie.attr("data-text", Math.round(percentage)+"%");
			conceptPie.attr("data-info", c.label);
			conceptPie.circliful();
		}
	}

	function positionsToHtml(positions) {
		var tags;
		var html;
		var position;
		var score;

		for (var i = 0, length = positions.length; i < length; i++) {
			position = positions[i];
			score = Math.ceil(position.score * 100) + "%";
			html = '<div id=' + position.id.split("/").pop() + ' class="row">' +
				'<div class=\'_' + Math.round(position.score * 10) + ' col-xs-2 col-md-1\'>' + score + '</div>' +
				'<div class=\'col-xs-10 col-md-11\'><strong> ' +
					'<a href="/candidatesearch/'+ position.id.split("/").pop() +'">' +
					 position.label +
				'</a></strong><br/>' +
				'<small class=\'row\' id=\'tags-' + position.id.split("/").pop() + '\' style=\'display:block;\'></small>' +
				'</div>' +
//				'<div class=\'col-lg-2\'>' +
//				'<a href=\'https://jobs3.netmedia1.com/cp/faces/job_summary?job_id=' + position.id + '\' target=\'_blank\' >' + position.id + '</a>' +
				'</div>';
			html += '</div>';

			$('#positions .content').append(html);
			tags = [];
			var t;
			for (var j = 0; j < position.explanation_tags.length; j++) {
				var c = position.explanation_tags[j].concept.label;
				tags.push(c);
			}
			console.log("tags: " + tags);
			printLabels('#tags-' + position.id.split("/").pop(), tags);
		}
		$('#positions .content').show();
		$('#loading').hide();
		$('#positions').show();
	}

	function printLabels(id, labels) {
		//console.log("labels: " + labels);
		$(id).text(labels.toString().replace(/,/g, ', '));
	}

	function getCandidate(id) {
			var r;
			$.ajax({
				type: 'GET',
				async: false,
				url: '/ci/candidates/' + id,
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
		/**
		 * Display an error or a default message
		 * @param  {String} error The error
		 */
	function showError(error) {
		var defaultErrorMsg = 'Error processing the request, please try again later.';
		$error.show();
		$errorMsg.text(error || defaultErrorMsg);
	}

	/**
	 * Construct a text representation for big5 traits crossing, facets and
	 * values.
	 */
	function showTextSummary(data) {
		console.log('showTextSummary()');
		var paragraphs = [
      assembleTraits(data.tree.children[0]),
      assembleFacets(data.tree.children[0]),
      assembleNeeds(data.tree.children[1]),
      assembleValues(data.tree.children[2])
    ];
		var div = $('.summary-div');
		div.empty();
		paragraphs.forEach(function (sentences) {
			$('<p></p>').text(sentences.join(' ')).appendTo(div);
		});
	}

	function createBar(chartElement, values) {

		function sortObj(a, b) {
			return a.percentage < b.percentage ? 0 : 1;
		}

		values.sort(sortObj);
		var highest = values[values.length - 1];
		var highest_percentage = Math.round(highest.percentage * 100);
		var lowest = values[0];
		var lowest_percentage = Math.round(lowest.percentage * 100);

		var h_div = $("<div/>");
		h_div.append($("<div/>").text(highest_percentage + "% - " + highest.name).css({
			'width': (highest.percentage * 100) + '%'
		}));
		chartElement.append(h_div);

		var l_div = $("<div/>");
		l_div.append($("<div/>").text(lowest_percentage + "% - " + lowest.name).css({
			'width': (lowest.percentage * 100) + '%'
		}));
		chartElement.append(l_div);
	}

	function showVizualizationSumamry(theProfile) {
		var big5 = theProfile.tree.children[0];
		var needs = theProfile.tree.children[1];
		var values = theProfile.tree.children[2];

		var big5_items = big5.children[0].children;
		var needs_items = needs.children[0].children;
		var values_items = values.children[0].children;

		var chartDiv = $('#chart');



		createBar(chartDiv, big5_items);
		createBar(chartDiv, needs_items);
		createBar(chartDiv, values_items);
	}


	/**
	 * Renders the sunburst visualization. The parameter is the tree as returned
	 * from the Personality Insights JSON API.
	 * It uses the arguments widgetId, widgetWidth, widgetHeight and personImageUrl
	 * declared on top of this script.
	 */
	function showVizualization(theProfile) {
		console.log('showVizualization()');

		$('#' + widgetId).empty();
		var d3vis = d3.select('#' + widgetId).append('svg:svg');
		var widget = {
			d3vis: d3vis,
			data: theProfile,
			loadingDiv: 'dummy',
			switchState: function () {
				console.log('[switchState]');
			},
			_layout: function () {
				console.log('[_layout]');
			},
			showTooltip: function () {
				console.log('[showTooltip]');
			},
			id: 'SystemUWidget',
			COLOR_PALLETTE: ['#1b6ba2', '#488436', '#d52829', '#F53B0C', '#972a6b', '#8c564b', '#dddddd'],
			expandAll: function () {
				this.vis.selectAll('g').each(function () {
					var g = d3.select(this);
					if (g.datum().parent && // Isn't the root g object.
						g.datum().parent.parent && // Isn't the feature trait.
						g.datum().parent.parent.parent) { // Isn't the feature dominant trait.
						g.attr('visibility', 'visible');
					}
				});
			},
			collapseAll: function () {
				this.vis.selectAll('g').each(function () {
					var g = d3.select(this);
					if (g.datum().parent !== null && // Isn't the root g object.
						g.datum().parent.parent !== null && // Isn't the feature trait.
						g.datum().parent.parent.parent !== null) { // Isn't the feature dominant trait.
						g.attr('visibility', 'hidden');
					}
				});
			},
			addPersonImage: function (url) {
				if (!this.vis || !url) {
					return;
				}
				var icon_defs = this.vis.append('defs');
				var width = this.dimW,
					height = this.dimH;

				// The flower had a radius of 640 / 1.9 = 336.84 in the original, now is 3.2.
				var radius = Math.min(width, height) / 16.58; // For 640 / 1.9 -> r = 65
				var scaled_w = radius * 2.46; // r = 65 -> w = 160

				var id = 'user_icon_' + this.id;
				icon_defs.append('pattern')
					.attr('id', id)
					.attr('height', 1)
					.attr('width', 1)
					.attr('patternUnits', 'objectBoundingBox')
					.append('image')
					.attr('width', scaled_w)
					.attr('height', scaled_w)
					.attr('x', radius - scaled_w / 2) // r = 65 -> x = -25
					.attr('y', radius - scaled_w / 2)
					.attr('xlink:href', url)
					.attr('opacity', 1.0)
					.on('dblclick.zoom', null);
				this.vis.append('circle')
					.attr('r', radius)
					.attr('stroke-width', 0)
					.attr('fill', 'url(#' + id + ')');
			}
		};

		widget.dimH = widgetHeight;
		widget.dimW = widgetWidth;
		widget.d3vis.attr('width', widget.dimW).attr('height', widget.dimH);
		widget.d3vis.attr('viewBox', "0 0 " + widget.dimW + ", " + widget.dimH);
		renderChart.call(widget);
		widget.expandAll.call(widget);
		if (personImageUrl)
			widget.addPersonImage.call(widget, personImageUrl);
	}

	/**
	 * Returns a 'flattened' version of the traits tree, to display it as a list
	 * @return array of {id:string, title:boolean, value:string} objects
	 */
	function flatten( /*object*/ tree) {
		var arr = [],
			f = function (t, level) {
				if (!t) return;
				if (level > 0 && (!t.children || level !== 2)) {
					arr.push({
						'id': t.name,
						'title': t.children ? true : false,
						'value': (typeof (t.percentage) !== 'undefined') ? Math.floor(t.percentage * 100) + '%' : '',
						'sampling_error': (typeof (t.sampling_error) !== 'undefined') ? Math.floor(t.sampling_error * 100) + '%' : ''
					});
				}
				if (t.children && t.id !== 'sbh') {
					for (var i = 0; i < t.children.length; i++) {
						f(t.children[i], level + 1);
					}
				}
			};
		f(tree, 0);
		return arr;
	}

	function updateWordsCount() {
		var text = $content.val();
		var wordsCount = text.match(/\S+/g) ? text.match(/\S+/g).length : 0;
		$('.wordsCount').css('color', wordsCount < minWords ? 'red' : 'gray');
		$('.wordsCount').text(wordsCount + ' word' + (wordsCount>1?'s':''));
		if (wordsCount < minWords) {
			$('#analysis-btn').attr('disabled', 'disabled');
      $('#continue-btn').attr('disabled', 'disabled');
      $('#candidate-add-btn').attr('disabled', 'disabled');
		} else {
			$('#analysis-btn').removeAttr('disabled');
      $('#continue-btn').removeAttr('disabled');
      $('#candidate-add-btn').removeAttr('disabled');
		}
	}
	$content.keyup(updateWordsCount);
	updateWordsCount();

});
