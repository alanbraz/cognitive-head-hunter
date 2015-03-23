$('#jobs-page').ready(function() {

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
      dataType: 'html',
      success: function() {
        $('.loading').hide();
        $('#message').html( $input.code + ' added.');
        loadJobs(); 

      },
      error: function(err) {
        $('.loading').hide();
        console.log('Error: ' + JSON.stringify(err) + '\n' + JSON.stringify($input) );
        showError(err.error || err);
      }
    });

  }); //click

  function loadJobs() {
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
          $('<li><a href=\'/job/'+data.id+'\' target=\'_blank\'>'+data.id+'</a>' + ' ' + data.state.stage + ' ' + data.state.status + '</li>').appendTo($('#jobs-list'));
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

  /**
   * Display an error or a default message
   * @param  {String} error The error
   */
  function showError(error) {
    var defaultErrorMsg = 'Error processing the request, please try again later.';
    $('.error').show();
    $('.errorMsg').text(JSON.stringify(error) || defaultErrorMsg);
  } 
  
});
