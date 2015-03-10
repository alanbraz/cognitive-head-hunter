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
/*global $:false */

'use strict';

$(document).ready(function() {

  var autocomplete;

  // Keyword search
  var onKeywordChange = function(e) {
    $('.suggestions').removeClass('open');
    var query = $('.query').val().trim();
    if (query && query.length > 2) {
      label_search(query);
    }
  };
  $('.query').keyup(onKeywordChange);

  var label_search = function(keyword) {
    $('.results').hide();
    // prevent previous autocomplete
    if (autocomplete)
      autocomplete.abort();

    autocomplete = $.get('/label_search', {
      corpus:'testmatchmyjob',
      user: '58236fbc-904e-4317-ad6d-c98a34744e9c',
      query: keyword,
      limit: 4
    }, function(results) {
    	console.log(results);
      $('.errorMsg').hide();
      $('.suggestions').addClass('open');
      $('.suggestions').trigger('click.bs.dropdown');
      populateDropdown(results);
    });

  };

  // populate dropdown list
  var populateDropdown = function(results) {
    var listContainer = $('.suggestions ul');

    listContainer.empty();

    var htmlString = '';
    results.forEach(function(item) {
      htmlString += createSuggestion(item);
    });

    if (results.length === 0) {
      $('.suggestions').addClass('noresult');
      htmlString+= createSuggestion({id:'', type:'', label: 'Sorry, no results found.'});
    } else {
      $('.suggestions').removeClass('noresult');
    }

    listContainer.append(htmlString);
  };

  $('body').click(function(e) {
    if ($(e.target).closest('.suggestions').length === 0) {
      $('.suggestions').removeClass('open');
    }
  });

  // click on dropdown item
  $(document).on('click', '.suggestions a', function() {
    $('.suggestions').removeClass('open');
    var data = $(this).data();

    // Click on the no results
    if (!data.id)
      return;

    var newTag = createTag(data.id, $(this).find('.concept-name').text());
    $('.tags-container').append(newTag);
    // apply load-in 100 ms from now
    setTimeout(function() {
      $(newTag).addClass('load-in');
    }, 100);
    updateInputPlaceholder();
    // ibmresearcher
    getResults([data.id].concat(getIdsFromTags()), loadResults);

    // empty text in field
    $('.query').val('');

  });

  // get results query
  var getResults = function(ids, callback) {
    $('.result').hide();

    if (ids && ids.length === 0)
      return;

    $('.loading').show();

    var dataObj = {
      ids: ids,
      corpus: 'testmatchmyjob',
      user: '58236fbc-904e-4317-ad6d-c98a34744e9c',
      limit: 20
    };

    $.get('semantic_search', dataObj, callback);
  };

  // on success, load results into html
  var loadResults = function(results) {
    $('.loading').hide();
    populateResults(results.results);
  };

  // update the text input placeholder if there are tags selected
  var updateInputPlaceholder = function(){
    var tags = getIdsFromTags();
    if (tags && tags.length > 0){
      $('.query').attr('placeholder','Add more concepts...');
    }
    else{
      $('.query').attr('placeholder','Type a keyword to search the IBM Research Domain');
    }
  };

  // return array of ids from .tag-text
  var getIdsFromTags = function() {
    var dataIds = [];
    $('.tag-text').each(function() {
      dataIds.push($(this).data('id'));
    });
    return dataIds;
  };

  var createTag = function(id, name) {
    var aLink = $('<a></a>').addClass('tag-close')
      .attr('href','#').append('&times;');
    return $('<span></span>').addClass('tag-text').attr('data-id', id).append(name).append(aLink);
  };

  $(document).on('click', '.tag-close', function() {
    $(this).parent().remove();
    updateInputPlaceholder();
    getResults(getIdsFromTags(), loadResults);
  });

  $(document).ajaxError(function(event, request, settings) {
    $('.loading').hide();
    if (request.status == 500 && settings.url !== '/feedback') {
      $('.errorMsg').show();
    }
  });

  // a.substr(a.lastIndexOf('/')+1).replace('_',' ')
  // populate results
  var populateResults = function(results) {
    $('.result').empty();
    var htmlString = '';
    for (var i = 0; i < results.length; i++) {
      htmlString += '<div class="col-lg-6 col-md-6 col-xs-12">';
      htmlString += '<div class="employee-card row" data-id="';
      htmlString += results[i].id;
      htmlString += '">';
      htmlString += '<div class="overflow-container">'
      htmlString += '<div class="expert-image col-lg-3 col-md-3 col-xs-3">';
      htmlString += '<div class="img-container">';
      htmlString += '<img src="'+ results[i].user.thumbnail + '"/>';
      htmlString += '</div>';
      htmlString += '</div>';
      htmlString += '<div class="expert-info col-lg-9 col-md-9 col-xs-9">';
      htmlString += '<a class="expert-result" href="http://researcher.ibm.com/researcher/view.php?person=' + results[i].id + '" target="_blank">';
      htmlString += '<h2 class="expert-name">';
      htmlString += results[i].label;
      htmlString += '</h2>';
      htmlString += '</a>';
      htmlString += '<hr>';
      htmlString += '<ul class="expertise">';
      for (var j = 0; j < results[i].tags.length; j++) {
        var concept = results[i].tags[j].concept;
        var name = concept.split('/').slice(4).join('/').replace(/_/g,' ');;
        htmlString += '<li>';
        htmlString += '<a class="expertise-tag" href="javascript:void(0);" title="'+name+'" data-id="'+concept+'" data-name="'+name+'" >';
        htmlString += name;
        htmlString += '</a>';
        htmlString += '</li>';
      }

      htmlString += '</ul>';
      htmlString += '</div>';
      htmlString += '</div>';
      htmlString += '</div>';
      htmlString += '</div>';
    }
    $('.result').append(htmlString);
    $('.result').show();
  };

  $(document).on('click', '.expertise-tag', function() {
    var data = $(this).data();
    var existingTags = getIdsFromTags();
    if ($.inArray(data.id, existingTags) !== -1)
      return;

    var newTag = createTag(data.id, data.name);
    $('.tags-container').append(newTag);
    setTimeout(function() {
      $(newTag).addClass('load-in');
    }, 100);
    updateInputPlaceholder();
    getResults(getIdsFromTags(), loadResults);
  });

  // $(document).on('click', '.employee-card', function() {
  //   var data = $(this).data();
  //   location.href = 'http://researcher.ibm.com/researcher/view.php?person=' + data.id;
  // });
  /**
   * Create a dropdown elemtn
   * @param  {String} type  Concept or Researcher
   * @param  {String} label The label
   * @param  {String} id    The element id
   * @return {String}       The html string to be used by the dropdown
   */
  var createSuggestion = function (item) {
      var htmlString = '<a href="javascript:void(0);" data-id="';

      if (item.type === '/58236fbc-904e-4317-ad6d-c98a34744e9c/testmatchmyjob') {
        htmlString += '/corpus/58236fbc-904e-4317-ad6d-c98a34744e9c/testmatchmyjob/'; // if researcher
      } else {
        htmlString += '/graph/wikipedia/en-20120601/'; // if concept
      }

      htmlString += item.id;
      htmlString += '">';
      htmlString += '<li>';
      htmlString += '<h4 class="concept-name" title="'+ item.label +'">';
      htmlString += item.label;
      htmlString += '</h4>';
      htmlString += '<span class="concept-type '+ (item.type === 'concept' ? 'type-concept' : 'type-researcher')+'">';
      if (item.type == '/58236fbc-904e-4317-ad6d-c98a34744e9c/testmatchmyjob') {
        htmlString += '(IBM Researcher)';
      } else {
        htmlString += '(' + item.type + ')';
      }
      htmlString += '</span>';
      if (item.result != null) {
        htmlString += '<p class="more-info" title="' + (item.result.abstract || item.label) + '">';
        htmlString += item.result.abstract || item.label;
        htmlString += '</p>';
      }
      htmlString += '</li>';
      htmlString += '</a>';
      return htmlString;
  };

});