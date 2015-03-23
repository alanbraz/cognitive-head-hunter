$(document).ready(function() {

	loadCandidates();

});

var loadCandidates = function() {
	$('.loading').show();


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
	$('#total').html(cands.length + ' candidates');
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

		$('.loading').hide();

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