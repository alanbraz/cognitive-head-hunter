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

$(document).ready(function() {

  var widgetId = 'vizcontainer', // Must match the ID in index.jade
    widgetWidth = 700, widgetHeight = 700, // Default width and height
    personImageUrl = 'images/app.png'; // Can be blank
  
  // Jquery variables
  var $content = $('.content'),
    $loading = $('.loading1'),
    $error = $('.error'),
    $errorMsg = $('.errorMsg'),
    $traits = $('.traits'),
    $results = $('.results');

  /**
   * Clear the "textArea"
   */
  $('.clear-btn').click(function(){
    $('.clear-btn').blur();
    $content.val('');
    updateWordsCount();
  });

  /**
   * Update words count on change
   */
  $content.change(updateWordsCount);

  /**
   * Update words count on copy/past
   */
  $content.bind('paste', function(e) {
    setTimeout(updateWordsCount, 100);
  });

  /**
   * 1. Create the request
   * 2. Call the API
   * 3. Call the methods to display the results
   */
  $('.analysis-btn').click(function(){
    $('.analysis-btn').blur();
    $loading.show();
    $error.hide();
    $traits.hide();
    $results.hide();

    var $user = JSON.parse($('#raw').html());

    $('#concepts').show();
    $('#concepts .loading').show();
    $('#concepts .content').hide();

    $('#positions').show();
    $('#positions .loading').show();
    $('#positions .content').hide();

    $.ajax({
      type: 'POST',
      async: true,
      data: {
        text: $content.val()
      },
      url: '/',
      dataType: 'json',
      success: function(data) {
        $loading.hide();

        if (data.error) {
          showError(data.error);
        } else {
          $results.show();
          showTraits(data);
          showTextSummary(data);
          showVizualization(data);
        }

      },
      error: function(xhr) {
        $loading.hide();
        var error;
        try {
          error = JSON.parse(xhr.responseText);
        } catch(e) {}
        showError(error.error || error);
      }
    });
  
    // check candidate
    var candidate = getCandidate($user.id);    
    console.log(candidate);

    // alanbraz: only insert if not there, will not consider update this time.
    if (!candidate) {
      // add or update
      $.ajax({
          type: 'PUT', //(candidate)?'POST':'PUT'
          async: false,
          data: $user,
          url: '/candidate',
          dataType: 'json',
          success: function(data) {
            console.log(JSON.stringify(data));
          },
          error: function(xhr) {
            console.error(xhr);
          }
      });
    
      // get update to show concepts
      // call until state.status == "done" and state.stage == "ready"
      candidate = getCandidate($user.id);
      console.log(candidate.state || "no candidate");
      while (candidate.state.stage != "ready" && candidate.state.status != "done") {
        setTimeout(function() { console.log("wait"); },3000);
        candidate = getCandidate($user.id);
        console.log(candidate.state || "no candidate");
      }
    }
 
    var concepts = [];
    var conceptsArray = [];
    $.each(candidate.annotations[0], function (i, data){
    	
    	var obj = {
			"id": data.concept.substring(data.concept.lastIndexOf('/') + 1),
			"weight": Math.ceil(data.weight * 100)
    	};
      var exists = false;
      for(var i=0; i < concepts.length; i++) {
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

    concepts.sort(function(a,b) { return parseInt(b.weight) - parseInt(a.weight) } );
    
	$.get('/graph_search', {
	      ids: conceptsArray
	  }, function(conceptsWiki){ 
		console.log(conceptsWiki);
		for(var i=0; i < concepts.length; i++){
			for(var j=0; j < conceptsWiki.length; j++){
				if(concepts[i].id == conceptsWiki[j].id){
					concepts[i].summary = conceptsWiki[j].abstract;
					concepts[i].label = conceptsWiki[j].label;
					concepts[i].link = conceptsWiki[j].link;
          concepts[i].ontology = conceptsWiki[j].ontology;
          break;
				}
			}
		}
		populateConcepts(concepts);
	});
	  
    $.ajax({
        type: 'GET',
        async: false,
        url: '/semantic_search/' + $user.id + "/10",
        dataType: 'json',
        success: function(data) {
          console.log(JSON.stringify(data));
          positionsToHtml(data.results);
        },
        error: function(xhr) {
          var error;
          try {
            error = JSON.parse(xhr.responseText);
          } catch(e) {}
          console.log(error.error || error);
          showError(error.error || error);
        } 
    });

  }); //click

  function populateConcepts(concepts){
	  $('#concepts .loading').hide();
	  conceptsToHtml(concepts);
	  $('#concepts .content').show();
  }
  
  function conceptsToHtml(concepts) {
    for (var i = 0,show = 10, length = concepts.length; (i < length && show > 0); i++) {
        var label = concepts[i].label;
        var weight = concepts[i].weight;
        var ont = concepts[i].ontology;
        
        var ignore = false;
        ignore = ignore || ($.inArray("Year",ont)>-1);
        ignore = ignore || ($.inArray("Place",ont)>-1);
        
        console.log(concepts[i]);
        if (!ignore) {
          $('#concepts .content').append($('<div>' + label + 
              //' (debug: '+ weight +' ' + ont +' ' +')' +
              '</div>'));
          show--;
        }
    }
  }
  
  function positionsToHtml(positions) {
    var tags;
    var html;
    var position;
    $('#positions .loading').hide();
    for (var i = 0, length = positions.length; i < length; i++) {
        position = positions[i];
        html = $('<div id=' + position.id + '>['+ position.id + '] ' + position.label +'</div>');
        tags = position.tags;
        /*for (var j = 0, length2 = tags.length; j < length2; j++) {
            $('<span>' + tags[j].concept + '</span>').appendTo(html);
        }*/
        $('#positions .content').append(html);
    }
    $('#positions .content').show();
  }
  
  function getCandidate(id) {
    var r;
    $.ajax({
        type: 'GET',
        async: false,
        url: '/candidate/' + id,
        dataType: 'json',
        success: function(data) {
          if (!data.error) {
            r = data;
          } else {
            console.error(data);
            r = null;
          }
        },
        error: function(xhr) {
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
   * Displays the traits received from the
   * Personality Insights API in a table,
   * just trait names and values.
   */
  function showTraits(data) {
    console.log('showTraits()');
    $traits.show();

    var traitList = flatten(data.tree),
      table = $traits;

    table.empty();

    // Header
    $('#header-template').clone().appendTo(table);

    // For each trait
    for (var i = 0; i < traitList.length; i++) {
      var elem = traitList[i];

      var Klass = 'row';
      Klass += (elem.title) ? ' model_title' : ' model_trait';
      Klass += (elem.value === '') ? ' model_name' : '';

      if (elem.value !== '') { // Trait child name
        $('#trait-template').clone()
          .attr('class', Klass)
          .find('.tname')
          .find('span').html(elem.id).end()
          .end()
          .find('.tvalue')
            .find('span').html(elem.value === '' ?  '' : (elem.value + ' (± '+ elem.sampling_error+')'))
            .end()
          .end()
          .appendTo(table);
      } else {
        // Model name
        $('#model-template').clone()
          .attr('class', Klass)
          .find('.col-lg-12')
          .find('span').html(elem.id).end()
          .end()
          .appendTo(table);
      }
    }
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
    paragraphs.forEach(function(sentences) {
      $('<p></p>').text(sentences.join(' ')).appendTo(div);
    });
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
    switchState: function() {
      console.log('[switchState]');
    },
    _layout: function() {
      console.log('[_layout]');
    },
    showTooltip: function() {
      console.log('[showTooltip]');
    },
    id: 'SystemUWidget',
    COLOR_PALLETTE: ['#1b6ba2', '#488436', '#d52829', '#F53B0C', '#972a6b', '#8c564b', '#dddddd'],
    expandAll: function() {
      this.vis.selectAll('g').each(function() {
        var g = d3.select(this);
        if (g.datum().parent && // Isn't the root g object.
          g.datum().parent.parent && // Isn't the feature trait.
          g.datum().parent.parent.parent) { // Isn't the feature dominant trait.
          g.attr('visibility', 'visible');
        }
      });
    },
    collapseAll: function() {
      this.vis.selectAll('g').each(function() {
        var g = d3.select(this);
        if (g.datum().parent !== null && // Isn't the root g object.
          g.datum().parent.parent !== null && // Isn't the feature trait.
          g.datum().parent.parent.parent !== null) { // Isn't the feature dominant trait.
          g.attr('visibility', 'hidden');
        }
      });
    },
    addPersonImage: function(url) {
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
      f = function(t, level) {
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
    $('.wordsCount').css('color',wordsCount < 100 ? 'red' : 'gray');
    $('.wordsCount').text(wordsCount + ' words');
  }
  $content.keyup(updateWordsCount);
  updateWordsCount();
});
