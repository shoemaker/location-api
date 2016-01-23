var http = require('http');
var cache = require('memory-cache'); 
var async = require('async');
var _ = require('lodash');

var models = require('../models/location');
var c = require('../config').config;  // App configuration


this.getForecast = function(locations, callback) {
    
    // Builds a function that handles the request to Weather Undergound API. 
    function addReq(loc) {

        // The actual function to return. 
        return function(callback) { 
            
            // Define options for HTTP request to Weather Underground API.
            var options = { 
                host: 'api.wunderground.com', 
                path: '/api/<%=key%>/conditions/q/<%=lat%>,<%=lon%>.json'
            };
            options.path = encodeURI(_.template(options.path)({'key':c.wundergroundKey, 'lat':loc.latitude, 'lon':loc.longitude}));

            // Check to see if we already have this result in cache
            // Using node-cache: https://github.com/ptarjan/node-cache
            var data = cache.get(options.path);  // Using the URL path as a key, check if cached response already exists. 
            if (data) {
                callback(null, data);  // We already have a cached response for this request, use it instead of hitting the Wunderground API again. 
            } else {
                // No cached response exists, hit the WUnderground API. 
                var json = '';  // String to build up API response
                http.get(options, function(res) { 
                    
                    // Handler for each chunk of data in the response from the Wunderground API
                    res.on('data', function (chunk) { 
                        json += chunk;  // Append this chunk
                    });
                    
                    // Handler once the request to the Wunderground API is complete. 
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
    
    
    var reqQueue = [];  // Array of WUnderground API requests. 
    for (var ii=0; ii<locations.length; ii++) {
        reqQueue.push(addReq(locations[ii]));
    }
    
    // Make series of requests to Wunderground API.
    // Order is important, we need to match order in array of locations. 
    // Using async library: https://github.com/caolan/async
    async.series(reqQueue, function(err, results) {
        // Results received from the series of Wunderground API requests.
        
        if (err) {
            callback(err, results);
        } else if (results.length != locations.length) {
            callback('The number of Weather Underground results does not match the number of requests.', results);
        }
        
        // Populate location object(s)
        for (var ii=0; ii<results.length; ii++) {
            var currWeather = results[ii].current_observation;
            locations[ii].weather.conditions = currWeather.weather;
            locations[ii].weather.iconURL = currWeather.icon_url;
            locations[ii].weather.tempF = currWeather.temp_f;
            locations[ii].weather.tempC = currWeather.temp_c;
            locations[ii].weather.tempDescription = currWeather.temperature_string;
            locations[ii].weather.humidity = currWeather.relative_humidity;
            locations[ii].weather.windMPH = currWeather.wind_mph;
            locations[ii].weather.windDirection = currWeather.wind_dir;
            locations[ii].weather.windDescription = currWeather.wind_string;
            locations[ii].weather.url = currWeather.ob_url;
            locations[ii].weather.dataProvider = 'Weather Underground';
            locations[ii].weather.dataProviderUrl = c.wundergroundReferralUrl;
            
            // Using timezone offset data from WUnderground
            locations[ii].timeZone.offsetMS = convertOffsetToMS(currWeather.local_tz_offset);
            locations[ii].timeZone.offsetHours = (locations[ii].timeZone.offsetMS / (1000 * 60 * 60)) % 24;
            locations[ii].timeZone.standardName = currWeather.local_tz_long;
            locations[ii].timeZone.shortName = currWeather.local_tz_short;
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