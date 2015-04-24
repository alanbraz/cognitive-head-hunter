$(document).ready(function() {

  $('#continue-btn').click(function() {handleCreation()});




});//ready


function handleCreation(){

  $('#loading').show();

  var profile = {};
  profile.text = $('#txt-profile').val();
  profile.name = $('#txt-name').val();

  $.ajax({
    type: 'GET',
    async: false,
    url: '/db/candidates?name='+ profile.name.toLowerCase(),
    dataType: 'json',
    success: function(data) {
      if(data.length > 0){
        console.log(data[0]._id);
        profile.id = data[0]._id;
        redirectToParse(profile);
        // TODO update name and text
      } else {
        insertCandidate(profile);
      }
    },
    error: function(xhr) {
      console.log(xhr);
    }
  });//get

}

function insertCandidate(profile) {
  if (!profile.profile && profile.text) {
    profile.profile = profile.text;
  }
  $.ajax({
    type: "POST",
    url: '/db/candidates',
    data: profile,
    dataType: 'json',
    success: function(data) {
      profile.id = data._id;
      console.log(data);
      redirectToParse(profile);
    },
    error: function(err) {
     console.log(err);
    }
  });
}

function redirectToParse(data){
  console.log("Data to be parsead: ");
  console.log(data);
  $.ajax({
    type: 'POST',
    async: true,
    data: data,
    url: '/parse',
    dataType: 'json',
    success: function(data) {
      var url = window.location.protocol + "//" + window.location.host + "/jobsearch";
      window.location.href = url;
    },
    error: function(error){
      $('#loading').hide();
      console.log(error);
    }
  });
}
