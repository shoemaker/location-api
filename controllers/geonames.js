// Data by http://www.geonames.org/
// http://www.geonames.org/export/geonames-search.html

var http = require('http');

var cache = require('../lib/node-cache'); 
var async = require('../lib/async');

var models = require('../models/location');
var c = require('../config');  // App configuration


this.getLocationDetails = function(locations, callback) {
	
	// Builds a function that handles the request to GeoNames API. 
	function addReq(loc) {

		// The actual function to return. 
		return function(callback) { 
			
			// Define options for HTTP request to GeoNames API.
			var options = { 
				host: 'api.geonames.org', 
				path: '/search?q={0}&type=json&maxRows=1&orderby=relevance&fuzzy=1&username={1}&isNameRequired=true'
			};
			options.path = encodeURI(options.path.format(loc, c.config.geonamesUsername));

			// Check to see if we already have this result in cache
			// Using node-cache: https://github.com/ptarjan/node-cache
			var data = cache.get(options.path);  // Using the URL path as a key, check if cached response already exists. 
			if (data) {
				callback(null, data);  // We already have a cached response for this request, use it instead of hitting the GeoNames API again. 
			} else {
				// No cached response exists, hit the GeoNames API. 
				var json = '';  // String to build up API response
				http.get(options, function(res) { 
					
					// Handler for each chunk of data in the response from the GeoNames API
					res.on('data', function (chunk) { 
						json += chunk;  // Append this chunk
					});
					
					// Handler once the request to the GeoNames API is complete. 
					res.on('end', function() { 
						var err;
						try {
							var data = JSON.parse(json);  // Turn the string into an object. 
							// cache.put(options.path, data, c.config.cacheDuration);  // Put this response in cache in case we need it later. 
							cache.put(options.path, data);  // This data doesn't change, don't set the cache to expire.
						} catch(ex) {
							console.log("Encountered error: " + ex.message);
							err = ex;
						} finally {
							callback(err, data);
						}							
					});
				}).on('error', function(err) {
					console.log("Encountered error: " + err.message);
					callback(err, loc);
				});
			}
			
		}  // END function for making API request. 
	}  // END addReq(). 
	
	var reqQueue = [];  // Array of GeoNames API requests. 
	for (var ii=0; ii<locations.length; ii++) {
		reqQueue.push(addReq(locations[ii]));
	}
	
	var locResults = []; // The aggregated responses from the GeoNames API. 
	
	// Make Parallel requests to GeoNames API. 
	// Using async library: https://github.com/caolan/async
	async.parallel(reqQueue, function(err, results) {
		if (err) {
			callback(err, null);
		} else {		
			// Results received from the series of GeoNames API requests.
			// Populate location object(s)
			if (results[0].totalResultsCount > 0) {
				for (var ii=0; ii<results.length; ii++) {
					var currLocation = results[ii].geonames[0];
				
					// Populate a new location object. 
					var newLocation = models.location();
						
					newLocation.latitude = currLocation.lat;
					newLocation.longitude = currLocation.lng;
					newLocation.city = currLocation.toponymName;
					newLocation.state = currLocation.adminName1;
					newLocation.stateCode = currLocation.adminCode1;
					newLocation.country = currLocation.countryName;
					newLocation.countryCode = currLocation.countryCode;
					newLocation.population = currLocation.population;
					newLocation.dataProvider = 'GeoNames';
					newLocation.dataProviderUrl = 'http://www.geonames.org/';
				
					locResults.push(newLocation);
				}
			}
			callback(null, locResults);
		}
	});

}