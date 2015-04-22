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

var conceptsCache = {};

$(document).ready(function() {

  var widgetId = 'vizcontainer', // Must match the ID in index.jade
    widgetWidth = 700, widgetHeight = 700, // Default width and height
    personImageUrl = '/images/Cognitive-Head-Hunter.png', // Can be blank
    minWords = 50;
  
  // Jquery variables
  var $content = $('.content'),
    $loading = $('.loading1'),
    $error = $('.error'),
    $errorMsg = $('.errorMsg'),
    $results = $('.results'),
	  $personality = $('.personality');

  /**
   * Clear the "textArea"
   */
  $('.clear-btn').click(function(){
    $('.clear-btn').blur();
    $content.val('');
    $('#txt-id').val('');
    $('#txt-name').val('');
    $('#txt-profile').val('');
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

  $('#continue-btn').click(function(){
	    
    $('#loading').show();
    var url = window.location.protocol + "//" + window.location.host + "/candidatesearch";
    window.location.href = url;
	    
  });//click

  /**
   * 1. Create the request
   * 2. Call the API
   * 3. Call the methods to display the results
   */
  $('#analyze-job').click(function(){
   
	  $('#loading').show();
    
    // check job
	  
	  var job = JSON.parse($('#raw').html());   
	    console.log(job);
	    
	    // consolidate repetead candidate concepts
	    var concepts = [];
	    var conceptsArray = [];
	    // 0 is the candidate cv full text
	    // will have to change if we store grad-level, language, location separated
	    $.each(job.annotations[0], function (i, data){
	    	
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
	    // sort by weight desc to show first the more relevant concepts
	    concepts.sort(function(a,b) { return parseInt(b.weight) - parseInt(a.weight) } );
		  
	    $.ajax({
	        type: 'GET',
	        async: false,
		    url: '/ci/semantic_search/job/' + job.id + "/20", // ab: 20 to degub, old value was 10
	        dataType: 'json',
	        success: function(data) {
	          //console.log(JSON.stringify(data));
	          //positionsToHtml(data.results);
	        	console.log(data);
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

  }); //click analyze button

  function conceptsToHtml(concepts) {
    for (var i = 0,show = concepts.length, length = concepts.length; (i < length && show > 0); i++) {
        var label = concepts[i].label;
        var weight = concepts[i].weight;
        var ont = concepts[i].ontology;
        
        var ignore = false;
        ignore = ignore || ($.inArray("Year",ont)>-1);
        ignore = ignore || ($.inArray("Place",ont)>-1);
        
        //console.log(concepts[i]);
        if (!ignore) {
          $('#concepts .content').append($('<div>' + label + 
              //' (debug: '+ weight +' ' + 
              (ont || ' ') +//' ' +')' + // TODO
              '</div>'));
          show--;
        }
    }
  }
  
  function positionsToHtml(positions) {
    var tags;
    var html;
    var position;
    var score;


    $('#positions .content').show();
	  $('#loading').hide();
    $('#positions').show();
  }
  
  function printLabels(id, labels) {
		console.log("labels: " + labels);
    $(id).text(labels);
  }

  function getJob(id) {
    var r;
    $.ajax({
        type: 'GET',
        async: false,
        url: '/ci/jobs/' + id,
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

  function updateWordsCount() {
    var text = $content.val();
    var wordsCount = text.match(/\S+/g) ? text.match(/\S+/g).length : 0;
    $('.wordsCount').css('color',wordsCount < minWords ? 'red' : 'gray');
    $('.wordsCount').text(wordsCount + ' words');
    if (wordsCount < minWords) {
      $('.analysis-btn').attr('disabled','disabled');
    } else {
      $('.analysis-btn').removeAttr('disabled');
    }
  }
  $content.keyup(updateWordsCount);
  updateWordsCount();
});
