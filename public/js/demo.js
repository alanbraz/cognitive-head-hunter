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

	//TODO call linkedin from  here
	var getLinkedinProfile = function(){
		
	};
	
	/**
	 * Function used to transform raw data retrieve from linkedin FullProfile.
	 * Based on below fields:
	 * 
	 * fullprofile.position.title
	 * fullprofile.position.summary
	 * fullprofile.interests
	 * fullprofile.summary
	 * fullprofile.specialties
	 * fullprofile.picture-url
	 * fullprofile.public-profile-url
	 * fullprofile.publication.title
	 * fullprofile.publication.summary
	 * fullprofile.patent.title
	 * fullprofile.patent.summary
	 * fullprofile.language.language
	 * fullprofile.language.proficiency
	 * fullprofile.skill.skill
	 * fullprofile.certification.name
	 * fullprofile.education.field-of-study
	 * fullprofile.education.degree
	 * fullprofile.education.activities
	 * fullprofile.course.name
	 * fullprofile.recommendation.recommendation-text
	 * 
	 * */
	var transformProfile = function(data){
		
		var profile = {};
		var textData = "";
		var positionData = "";
		var publicationData = "";
		var patentData = "";
		var languageData = "";
		var skillData = "";
		var certificationData = "";
		var educationData = "";
		var courseData = "";
		var recommendationData = "";
		
		profile.id = data.id;
		profile.full-name = data.first-name + " " + data.last-name;
		textData += data.interests + ".";
		textData += data.summary + ".";
		textData += data.specialties + ".";
		profile.picture-url = data.picture-url;
		profile.public-profile-url = data.public-profile-url;
		
		$.each(position,data.position){
			positionData += position.title + ".";
			positionData += position.summary + ".";
		};
		
		$.each(publication,data.publication){
			publicationData += publication.title + ".";
			publicationData += publication.summary + ".";
		};
		
		$.each(patent,data.patent){
			patentData += patent.title + ".";
			patentData += patent.summary + ".";
		};
		
		$.each(language,data.language){
			languageData += language.language + ".";
			languageData += language.proficiency + ".";
		};
		
		$.each(skill,data.skill){
			skillData += skill.skill + ".";
		};
		
		$.each(certification,data.certification){
			certificationData += certification.name + ".";
		};
		
		$.each(education,data.education){
			educationData += education.field-of-study + ".";
			educationData += education.degree + ".";
			educationData += education.activities + ".";
		};
		
		$.each(course,data.course){
			courseData += course.name + ".";
		};
		
		$.each(recommendation,data.course){
			recommendationData += recommendation.recommendation-text + ".";
		};
		
		profile.data = textData + "." + positionData + "." + 
		publicationData + "." + 
		patentData + "." + 
		languageData + "." + 
		skillData + "." + 
		certificationData + "." + 
		educationData + "." + 
		courseData + "." + 
		recommendationData + ".";
		
		return profile;
	};

});