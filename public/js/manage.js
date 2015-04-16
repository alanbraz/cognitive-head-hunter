$(document).ready(function() {

  $('#job-new-btn').click(function(){
    $('#job-new-btn').blur();
    $('#job-add-form').show();
    $('#code').val('');
    $('#title').val('');
    $('#description').val('');
    cleanMessages(); 
  });
  $('#job-cancel-btn').click(function(){
    $('#job-cancel-btn').blur();
    $('#job-add-form').hide();
  });
  $('#candidate-new-btn').click(function(){
    $('#candidate-new-btn').blur();
    $('#candidate-add-form').show();
    $('#name').val('');
    $('#profile').val('');
    cleanMessages(); 
  });
  $('#candidate-cancel-btn').click(function(){
    $('#candidate-cancel-btn').blur();
    $('#candidate-add-form').hide();
  });


  loadJobs();
  loadCandidates();
  
  $('#candidate-add-btn').click(function(){
    $('#candidate-add-btn').blur();
    showSuccess('Candidate created');
  });

$('#jobs.loading').show();
  /**
   * 1. Create the request
   * 2. Call the API
   * 3. Call the methods to display the results
   */
  $('.job-add-btn').click(function(){
    $('.job-add-btn').blur();
    $('#jobs.loading').show();
    cleanMessages(); 
    
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
      dataType: 'html',
      success: function() {
        $('#jobs.loading').hide();
        showSuccess($input.code + ' added.');
        loadJobs(); 
      },
      error: function(err) {
        $('#jobs.loading').hide();
        console.log('Error: ' + JSON.stringify(err) + '\n' + JSON.stringify($input) );
        showError(err.error || err);
      }
    });

  }); //click

  function loadJobs() {

    $("#jobs-list").empty();

    var j = getJobs();
    /*j.forEach(function(job) {
      $('<li><a href=\'/job/'+job+'\' target=\'_blank\'>'+job+'</a></li>').appendTo($('#jobs-list'));
    });*/
    $('#num-jobs').html(j.length + ' jobs');
	j.forEach(function(job) {
		var r;
		$.ajax({
			type: 'GET',
			async: true,
			url: '/job/'+job,
			dataType: 'json',
			success: function(data) {
          $('<li><a href=\'/job/'+data.id+'\' target=\'_blank\'>'+data.id+'</a>' +
           ' ' + data.state.stage + ' ' + data.state.status + '</li>')
          .appendTo($('#jobs-list'));
			},
			error: function(xhr) {
			  console.error(xhr);
      }
		});
      
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
          r = data;
        },
        error: function(err) {
          console.error(err);
          r = null;
        }
    });
    return r;
  }
  
});


var loadCandidates = function() {
  $('#candidates.loading').show();
  cleanMessages(); 

  var cands;
  $.ajax({
    type: 'GET',
    async: false,
    url: '/candidates',
    dataType: 'json',
    success: function(data) {
      cands = data;
    },
    error: function(err) {
      console.error(err);
      cands = null;
    }
  });

  /*cands.forEach(function(c) {
    $('<li><a href=\'/user/'+c+'\' target=\'_blank\'>'+c+'</a></li>').appendTo($('#candidates-list'));
  });*/
  $('#num-candidates').html(cands.length + ' candidates');
  $("#candidates-list").empty();

  cands.forEach(function(c) {
    $.ajax({
      type: 'GET',
      async: false,
      global: true,
      url: '/candidate/'+c,
      dataType: 'json',
      success: function(data) {
        console.log(data.id + ' - ' + data.state.status);
        //candidatesArray.push(data);
        $('<li><a href=\'/user/'+data.id+'\' target=\'_blank\'>'+
          data.label + '</a> (' + data.candidateHeadline + ') ' + 
          data.state.stage + ' ' + data.state.status +
          ' > ' + words(data.parts[0].data) + ' words ' + 
          '[<a href=\'javascript:delCandidate(\"'+data.id+'\")\'>delete</a>]' +
          '</li>').appendTo($('#candidates-list'));
      },
      error: function(xhr) {
        console.error(xhr);
      }
    }); 
    //$('<li><a href=\'/job/'+job+'\' target=\'_blank\'>'+job+'</a></li>').appendTo($('#jobs-list'));
  });
    //candidatesArray.sort(function(a,b) { return a.label.localeCompare(b.label); } );

    $('#candidates.loading').hide();

}

var words = function(text) {
  return text.match(/\S+/g) ? text.match(/\S+/g).length : 0;
}


var delCandidate = function(id) {
  $.ajax({
    type: 'DELETE',
    async: false,
    url: '/candidate/' + id,
    dataType: 'html',
    success: function(data) {
      loadCandidates();
    },
    error: function(err) {
      console.error(err);
    }
  });
}

/**
 * Display an error or a default message
 * @param  {String} error The error
 */
function showError(error) {
  var defaultErrorMsg = 'Error processing the request, please try again later.';
  $('#error').show();
  $('#errorMsg').text(JSON.stringify(error) || defaultErrorMsg);
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
