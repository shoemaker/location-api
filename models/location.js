exports.location = function() {
	
	var obj = {
		latitude : null,
		longitude : null,
		city : null,
		state : null,
		stateCode : null,
		country : null,
		countryCode : null,
		zipCode : null,
		population : null,
		timeZone : exports.timeZone(), 
		weather : exports.weather()
	};
	
	return obj;
};

exports.timeZone = function() {
	
	var obj = {
		offsetMS : null,
		offsetHours : null,
		standardName : null,
		shortName : null
	};
	
	return obj;
};

exports.weather = function() {
	var obj = {
		conditions : null, 
		iconURL : null, 
		tempF : null, 
		tempC : null, 
		tempDescription : null, 
		humidity : null, 
		windMPH : null, 
		windDirection : null, 
		windDescription : null, 
		url : null
	};
	
	return obj;
}

exports.wrapper = function() {
	
	var obj = {
		isSuccessful : true,
		message : null,
		data : {}
	};
	
	return obj;
};