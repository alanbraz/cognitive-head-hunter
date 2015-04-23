$(document).ready(function() {

  $('#job-new-btn').click(function(){
    $('#job-new-btn').blur();
    $('#job-add-div').show();
    $('#code').val('');
    $('#title').val('');
    $('#description').val('');
    cleanMessages(); 
  });
  $('#job-cancel-btn').click(function(){
    $('#job-cancel-btn').blur();
    $('#job-add-div').hide();
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
    showSuccess('Not implemented yet');
  });

  /**
   * 1. Create the request
   * 2. Call the API
   * 3. Call the methods to display the results
   */
  //$('.job-add-form').submit(function( event ){

  function loadJobs() {
    $('#jobs-loading').show();
    $("#jobs-list").empty();

    $.ajax({
        type: 'GET',
        url: '/db/jobs',
        dataType: 'json',
        success: function(data) {
          $('#num-jobs').html(data.length + ' jobs');
          data.forEach(function(job) {
            job.id = (job.concept_id || job._id);
            $('<li>'+job.code+' '+'<strong>'+ job.title + '</strong>' + ' ' + 
              (job.requiredConcepts.length==0?'[<a href="/concepts/required/'+job._id+'">set required concepts</a>]':'OK') +
              '&nbsp;[<a href=\'/analyze-jobs/'+job._id+'\' target=\'_blank\'>'+'find candidates'+'</a>]' + 
              //'<span id=\'job-'+job.id+'\'></span>' + 
              '</li>')
            .appendTo($('#jobs-list'));
          });
          //handleJobs(data);
        },
        error: function(err) {
          console.error(err);
          showError(err.error || err);
        },
        complete: function(data) {
          $('#jobs-loading').hide();
        }
    });
	  
  }
  
});

function handleJobs(jobs) {
  $('#jobs-loading').show();
  jobs.forEach(function(job) {
    $.ajax({
      type: 'GET',
      url: '/ci/jobs/'+job.id,
      dataType: 'json',
      success: function(data) {
          $('#job-'+data.id).text(' ' + data.state.stage + ' ' + data.state.status + ' ');
      },
      error: function(err) {
        console.error(err);
        showError(err.error || err);
      },
      complete: function(data) {
        $('#jobs-loading').hide();
      }
    });
  });
}

function handleCandidates(cands) {
    $('#candidates-loading').show();
    cands.forEach(function(c) {
      $.ajax({
        type: 'GET',
        url: '/ci/candidates/'+c,
        dataType: 'json',
        success: function(data) {
          console.log(data.id + ' - ' + data.state.status);
          $('#cand-'+data.id).html('<a href=\'/user/'+data.id+'\' target=\'_blank\'>'+
            data.label + '</a> (' + data.candidateHeadline + ') ' + 
            data.state.stage + ' ' + data.state.status +
            ' > ' + words(data.parts[0].data) + ' words ' + 
            '[<a href=\'javascript:delCandidate(\"'+data.id+'\")\'>delete</a>]');
        },
        error: function(err) {
          console.error(err);
          showError(err.error || err);
        },
        complete: function(data) {
          $('#candidates-loading').hide();
        }
      }); 
      //$('<li><a href=\'/job/'+job+'\' target=\'_blank\'>'+job+'</a></li>').appendTo($('#jobs-list'));
    });
      //candidatesArray.sort(function(a,b) { return a.label.localeCompare(b.label); } );
  } 

var loadCandidates = function() {
  $('#candidates-loading').show();
  cleanMessages(); 
  $("#candidates-list").empty();

  $.ajax({
    type: 'GET',
    url: '/ci/candidates',
    dataType: 'json',
    success: function(data) {
      $('#num-candidates').html(data.length + ' candidates');
      data.forEach(function(c) {
        $('<li>' + c + ' <span id=\'cand-'+c+'\'> </span>' +'</li>').appendTo($('#candidates-list'));
      });
      //handleCandidates(data);
    },
    error: function(err) {
      console.error(err);
      cands = null;
      showError(err.error || err);
    },
    complete: function(data) {
      $('#candidates-loading').hide();
    }
  });
  

}

var words = function(text) {
  return text.match(/\S+/g) ? text.match(/\S+/g).length : 0;
}


var delCandidate = function(id) {
  $.ajax({
    type: 'DELETE',
    async: false,
    url: '/ci/candidates/' + id,
    dataType: 'html',
    success: function(data) {
      showSuccess("Candidate " + id + " removed.");
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

function submitJob() {
  $('.job-add-btn').blur();
  $('#jobs-loading').show();
  cleanMessages(); 
  
  var $input = {
    code: $('#code').val(),
    title: $('#title').val(),
    description: $('#description').val().replace(/(\r\n|\n|\r)/gm," ")
  };

  $.ajax({
    type: "POST",
    url: '/db/jobs',
    data: $input,
    dataType: 'json',
    success: function(data) { 
      $input.id = data._id;
      console.log(data);
      addJobConcept($input);
    },
    error: function(err) {
      showError(err);
    },
    complete: function(data) {
      $('#job-add-div').hide();
      //showSuccess("Job " + $input.code + ' added.' + ' ' + JSON.stringify($input));
      //$('#jobs-loading').hide();
      //event.preventDefault();
    }
  });

}//); //click

function addJobConcept(job) {
  
  $.ajax({
    type: "PUT",
    url: '/ci/jobs',
    data: job,
    dataType: 'html',
    success: function(data) { 
      console.log(data);
      $('#job-required-form').show();
      $('#jobs-required-loading').show();
      $('#job-id').text(job.id);
      $('#job-code').text(job.code);
      var newJob = getJob(job.id);
      console.log(newJob.state || "no newJob yet");
      while (newJob.state.stage != "ready" && newJob.state.status != "done") {
        setTimeout(function() { console.log("wait"); },3000);
        newJob = getJob(job.id);
        console.log(newJob.state || "no newJob yet");
      }
      $('#jobs-required-loading').hide();
    },
    error: function(err) {
      showError(err);
    },
    complete: function(data) {
      showSuccess("Job " + job.code + ' added.' + ' ' + JSON.stringify(job));
      $('#jobs-loading').hide();
    }
  });

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