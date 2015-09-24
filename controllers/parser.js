var cheerio = require("cheerio");
var request = require('request');


function findByProperty(arr, prop, propVal){
	var r;
	for(var i=0; i < arr.length; i++){
		var obj = arr[i];

		if(obj.hasOwnProperty(prop)){
			Object.keys(obj).forEach(function (key) {
				if(obj[key] == propVal){
					r = obj;
					return false;
				}
			});
		}
	}
	return r;
}


function extractData($){

	var summary = ""
			, experience = ""
			, projects = ""
			, honors = ""
			, languages = ""
			, skills = ""
			, education = ""
			, certifications = ""
			, publications = ""
			, courses = ""
			, organizations = ""
			, interests = ""
			, patents = ""
			, volunteer = ""
			, recommendations = "";


	if($('.summary .description').length > 0){
		console.log('tem summary');
		summary = $('.summary .description').text();
	}

	if($('#background-experience .editable-item').length > 0){

		console.log('tem experience');
		$('#background-experience .editable-item').each(function(){
				var experienceView = this.children[0];
				var experienceHeader  = findByProperty(experienceView.children[0].children, 'name', 'h4');
				var experienceText = findByProperty(experienceView.children, 'name', 'p');
				var experienceChild = "";
				var experienceParagraphs = "";

				if(experienceText){
					for(var i=0; i < experienceText.children.length; i++){
						if(experienceText.children[i].data){
							experienceParagraphs += experienceText.children[i].data;
						}
					}
				}

				experienceChild += experienceHeader.children[0].children[0].data + " ";
				experienceChild += experienceParagraphs + " ";

				experience += experienceChild;
		});

	}

	if($('#background-honors .editable-item').length > 0) {

		console.log('tem honors');
		$('#background-honors .editable-item').each(function(){
				var honorsView = this.children[0];
				var honorsTitle  = findByProperty(honorsView.children[0].children, 'name', 'h4');
				var honorsInstittute  = findByProperty(honorsView.children[0].children, 'name', 'h5');
				var honorsText = findByProperty(honorsView.children[0].children, 'name', 'p');
				var honorsChild = "";

				honorsChild += honorsTitle.children[0].children[0].data + " ";
				honorsChild += honorsInstittute.children[0].children[0].data + " ";

				if(honorsText){
					honorsChild += honorsText.children[0].data;
				}
				experience += honorsChild;
		});
	}

	if($('#languages-view ol').length > 0) {

		console.log('tem languages');
		$('#languages-view ol').each(function(){

			var languagesText = "";
			var ol = this;

			for(var i=0; i < ol.children.length; i++){

				var languagesLi = findByProperty(ol.children[i].children, 'name', 'h4');
				languagesText += languagesLi.children[0].children[0].data + " ";
			}

			experience += languagesText;
		});
	}

	if($('#profile-skills ul').length > 0) {

		console.log('tem skills');

		$('#profile-skills ul').each(function(){

			var skillsText = "";
			var skillsUl = this;

			for(var i=0; i < skillsUl.children.length -1; i++){

				skillsText += skillsUl.children[i].children[0].children[0].children[0].children[0].data + " ";
			}

			experience += skillsText;
		});
	}

	if($('#background-education .editable-item').length > 0) {

		console.log('tem education');
		$('#background-education .editable-item').each(function(){

				var educationView = this.children[0];
				var educationHeader  = findByProperty(educationView.children[0].children, 'name', 'header');
				var educationInstitute  = findByProperty(educationHeader.children, 'name', 'h4');
				var educationDetails = findByProperty(educationHeader.children, 'name', 'h5');
				var educationMoreInfo  = findByProperty(educationView.children[0].children, 'name', 'p');
				var educationText = "";

				if(!educationInstitute.children[0].children){
					educationText += educationInstitute.children[0].data + " ";
				}
				else {
					educationText += educationInstitute.children[0].children[0].data + " ";
				}

				educationText += educationDetails.children[0].children[0].data + " ";

				if(educationMoreInfo){
					educationText += educationMoreInfo.children[0].data + " ";
				}

				experience += educationText;
		});
	}

	if($('#background-certifications .editable-item').length > 0) {

		console.log('tem certifications');
		$('#background-certifications .editable-item').each(function(){

				var certificationView = this.children[0];
				var certificationHeader  = findByProperty(certificationView.children[0].children, 'name', 'h4');
				var certificationText = "";

				if(certificationHeader.children[0].data){
					certificationText += certificationHeader.children[0].data + " ";
				}
				else {
					certificationText += certificationHeader.children[0].children[0].data + " ";
				}
				experience += certificationText;
		});
	}

	if($('#background-projects .editable-item').length > 0) {

		console.log('tem projects');
		$('#background-projects .editable-item').each(function(){

				var projectsView = this.children[0];
				var projectsHeader = findByProperty(projectsView.children, 'name', 'hgroup');
				var projectsParagraph = findByProperty(projectsView.children, 'name', 'p');
				var projectsText = "";
				var projectsChild = "";

				if(projectsParagraph){

					for(var i=0; i < projectsParagraph.children.length; i++){
						if(projectsParagraph.children[i].data){
							projectsText += projectsParagraph.children[i].data + " ";
						}
					}
				}

				projectsChild += projectsHeader.children[0].children[0].children[0].data + " ";
				projectsChild += projectsText + " ";

				experience += projectsChild;
		});
	}

	if($('#background-publications .editable-item').length > 0) {

		console.log('tem publications');
		$('#background-publications .editable-item').each(function(){

				var publicationsView = this.children[0];
				var publicationsHeader = findByProperty(publicationsView.children, 'name', 'hgroup');
				var publicationsTitle = findByProperty(publicationsHeader.children, 'name', 'h4');
				var publicationsText = "";


				if(publicationsTitle.children[0].children[0].data){
					publicationsText += publicationsTitle.children[0].children[0].data + " ";
				}
				else {
					publicationsText += publicationsTitle.children[0].children[0].children[0].data + " ";
				}

				experience += publicationsText;
		});
	}

	if($('#background-courses .editable-item').length > 0) {

		console.log('tem courses');
		$('#background-courses .editable-item').each(function(){

				var coursesView = this.children[0];
				var coursesHeader;
				var coursesTitle;

				if(coursesView.children[0]){
					coursesHeader = findByProperty(coursesView.children[0].children, 'name', 'h4');
					coursesTitle = findByProperty(coursesView.children[0].children, 'name', 'ul');
				}
				var coursesText = "";

				if(coursesHeader !== undefined){
					coursesText += coursesHeader.children[0].data + " ";
				}

				if(coursesTitle !== undefined){
					coursesText += coursesTitle.children[0].children[0].data + " ";
				}

				experience += coursesText;
		});
	}

	if($('#background-interests .editable-item').length > 0) {

		console.log('tem interests');
		$('#background-interests .editable-item').each(function(){

				var interestsUl = this.children[0];
				var interestsText = "";

				for(var i=0; i < interestsUl.children.length; i++){

					interestsText += interestsUl.children[i].children[0].data + " ";
				}

				experience += interestsText;
		});
	}

	if($('#background-patents .editable-item').length > 0) {

		console.log('tem patents');
		$('#background-patents .editable-item').each(function(){

				var patentsView = this.children[0];
				var patentsHeader = findByProperty(patentsView.children, 'name', 'hgroup');
				var patentsTitle = findByProperty(patentsHeader.children, 'name', 'h4');
				var patentsParagraph = findByProperty(patentsView.children, 'name', 'p');
				var patentsText = "";

				if(patentsHeader){
					patentsText += patentsTitle.children[0].children[0].children[0].data + " ";
				}

				if(patentsParagraph){
					patentsText += patentsParagraph.children[0].data + " ";
				}

				experience += patentsText;
		});
	}

	return experience;
}

module.exports.getLinkedInFullProfile = function(profileUrl, req, response, callback){
	request(profileUrl, function (err, res, html) {
		try {
			var $ = cheerio.load(html);
			console.log("\n\ngetLinkedInFullProfile HTML: " + $);
			var profile = extractData($);
			console.log("\n\ngetLinkedInFullProfile: " + profile);
			callback(req, response, profile);
		} catch (error) {
			console.log("Error parsing full profile: " + error);
			callback(req, response, null);
		}
	});
};
