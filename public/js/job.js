//$(document).ready(function() {

  /**
   * Clear the "textArea"
   */
  $('.job-clear-btn').click(function(){
    $('.job-clear-btn').blur();
    $('#code').val('');
    $('#title').val('');
    $('#description').val('');
    $('#message').html('');
    $('.error').hide();
    $('.loading').hide();
  });

  loadJobs();
  
  /**
   * 1. Create the request
   * 2. Call the API
   * 3. Call the methods to display the results
   */
  $('.job-add-btn').click(function(){
    $('.job-add-btn').blur();
    $('.loading').show();
    $('.error').hide();
    $('#message').html('');
    
    var $input = {
        code: $('#code').val(),
        title: $('#title').val(),
        description: $('#description').val().replace(/(\r\n|\n|\r)/gm," ")
      };
    //console.log(JSON.stringify($input.description));

    //$('#message').html(JSON.stringify($input));

    // TODO alanbra: not working b/c always returning error
    $.ajax({
      type: 'PUT',
      data: $input,
      url: '/job',
      dataType: 'json',
      success: function(data) {
        $('.loading').hide();
        $('#message').html( $input.code + ' added.');
        loadJobs(); 

      },
      error: function(error) {
        $('.loading').hide();
        console.log('Error: ' + JSON.stringify(error) + '\n' + JSON.stringify($input) );
        showError(error.error || error);
      }
    });

  }); //click

  function loadJobs() {
    var j = getJobs();
    j.forEach(function(job) {
      $('<li><a href=\'/job/'+job+'\' target=\'_blank\'>'+job+'</a></li>').appendTo($('#jobs-list'));
    });
    $('#num-jobs').html(j.length + ' jobs');
	j.forEach(function(job) {
		var r;
		$.ajax({
			type: 'GET',
			async: true,
			url: '/job/'+job,
			dataType: 'json',
			success: function(data) {
			  if (!data.error) {
				r = data;
				  console.log(r.id + ' - ' + r.state.status);
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
		r;
      $('<li><a href=\'/job/'+job+'\' target=\'_blank\'>'+job+'</a></li>').appendTo($('#jobs-list'));
    });
	  
  }

  function getJobs() {
    var r;
    $.ajax({
        type: 'GET',
        async: false,
        url: '/jobs',
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
    $('.error').show();
    $('.errorMsg').text(JSON.stringify(error) || defaultErrorMsg);
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

 
  
//});
