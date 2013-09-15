var https = require('https');
var cache = require('memory-cache'); 
var async = require('async');

var models = require('../models/location');
var c = require('../config').config;  // App configuration


this.getForecast = function(locations, callback) {
	
	// Builds a function that handles the request to Forecast.io API. 
	function addReq(loc) {

		// The actual function to return. 
		return function(callback) { 
			
			// Define options for HTTP request to Forecast.io API.
			var options = { 
				host: 'api.forecast.io', 
				path: '/forecast/{0}/{1},{2}?exclude=minutely,hourly,daily,flags'
			};
			options.path = encodeURI(options.path.format(c.forecastKey, loc.latitude, loc.longitude));

			// Check to see if we already have this result in cache
			// Using node-cache: https://github.com/ptarjan/node-cache
			var data = cache.get(options.path);  // Using the URL path as a key, check if cached response already exists. 
			if (data) {
				callback(null, data);  // We already have a cached response for this request, use it instead of hitting the Forecast.io API again. 
			} else {
				// No cached response exists, hit the Forecast.io API. 
				var json = '';  // String to build up API response
				https.get(options, function(res) { 
					
					// Handler for each chunk of data in the response from the Forecast.io API
					res.on('data', function (chunk) { 
						json += chunk;  // Append this chunk
					});
					
					// Handler once the request to the Forecast.io API is complete. 
					res.on('end', function() { 
						var data = JSON.parse(json);  // Turn the string into an object. 
						cache.put(options.path, data, c.cacheDuration);  // Put this response in cache in case we need it later. 
						
						callback(null, data);
					});
				}).on('error', function(err) {
					console.log("Encountered error: " + err.message);
					callback(err, loc);
				});
			}
			
		}  // END function for making API request. 
	}  // END addReq(). 
	
	
	var reqQueue = [];  // Array of Forecast.io API requests. 
	for (var ii=0; ii<locations.length; ii++) {
		reqQueue.push(addReq(locations[ii]));
	}
	
	// Make series of requests to Forecast.io API.
	// Order is important, we need to match order in array of locations. 
	// Using async library: https://github.com/caolan/async
	async.series(reqQueue, function(err, results) {
		// Results received from the series of Forecast.io API requests.
		
		if (err) {
			callback(err, results);
		} else if (results.length != locations.length) {
			callback('The number of Forecast.io results does not match the number of requests.', results);
		}

		// Populate location object(s)
		for (var ii=0; ii<results.length; ii++) {
			var currWeather = results[ii];
			locations[ii].weather.conditions = currWeather.currently.summary;
			locations[ii].weather.icon = currWeather.currently.icon;
			// locations[ii].weather.iconURL = currWeather.currently.icon_url;
			locations[ii].weather.tempF = currWeather.currently.temperature;
			locations[ii].weather.tempC = Math.round(((currWeather.currently.temperature - 32) * 5 / 9)*100)/100;
			//locations[ii].weather.tempDescription = currWeather.temperature_string;
			locations[ii].weather.humidity = currWeather.currently.humidity;
			locations[ii].weather.windMPH = currWeather.currently.windSpeed;
			locations[ii].weather.windDirection = currWeather.currently.windBearing + ' degrees';
			// locations[ii].weather.windDescription = currWeather.wind_string;
			locations[ii].weather.url = 'http://forecast.io/#/' + currWeather.latitude + ',' + currWeather.longitude;
			locations[ii].weather.dataProvider = 'forecast.io';
			locations[ii].weather.dataProviderUrl = 'https://developer.forecast.io/';
			
			// Using timezone offset data from Forecast.io
			locations[ii].timeZone.offsetMS = convertOffsetToMS(currWeather.offset + '');
			locations[ii].timeZone.offsetHours = (locations[ii].timeZone.offsetMS / (1000 * 60 * 60)) % 24;
			// locations[ii].timeZone.standardName = currWeather.local_tz_long;
			locations[ii].timeZone.shortName = currWeather.timezone;
		}
		
		callback(null, locations);
	});
}

// Calculates the number of milliseconds for a provided offset (+HHMM). 
function convertOffsetToMS(offset) {
	var ms = 0;
	
	// +HHMM
	var direction = offset.slice(0, 1);
	var hours = offset.slice(1, 3);
	var minutes = offset.slice(4, 5);

	ms = hours * 3600000;
	ms += (minutes * 60000);

	if (direction == "-")
		ms = ms * -1;
		
	return ms;
}