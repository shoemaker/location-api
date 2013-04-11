var http = require('http');
var fs = require('fs');  // File system access

// App configuration
if (!fs.existsSync("config.js")) {
	console.error("Config file [config.js] missing!");
	console.error("Either rename sample-config.js and populate with your settings, or run 'make decrypt_conf'.");
	process.exit(1);
}

var c = require('./config'); 
var journey = require('./lib/journey');  // Init REST route library
var async = require('./lib/async');

var models = require('./models/location');
var geonames = require('./controllers/geonames');
var wunderground = require('./controllers/wunderground');
var forecast = require('./controllers/forecast');


// Configure routes for the RESTful interface
// https://github.com/cloudhead/journey
var router = new(journey.Router);

// Create the routing table

router.map(function () {
    //this.root.bind(function (req, res) { res.send("Location API (nothing configured for root path).") });
});

// Handler to return an empty criteria template
router.get(/^\/location.*$/).bind(function(req, res, params) {
	var response = models.wrapper();
	locData = null;
	
	// Check if locations were provided
	if (!params.q || params.q.length == 0) {
		var message = 'No locations to search were provided. Use the \'q\' querystring parameter (example: q=Minneapolis,%20MN).';
		packageResponse(null, message, null, params, res);
	} else {
		// We have one or more locations, proceed. 
		// Parse out the list of locations
		var queries = params.q.split('|');
		
		// Sometimes a trailing '|' makes its way to the query, resulting in an empty location. Remove it if it's there. 
		if (queries[queries.length - 1].length == 0)
			queries.pop();
				
		// Request location data
		geonames.getLocationDetails(queries, function(err, results) {
			if (err) {
				var message = 'Encountered error: {0}.'.format(err);
				packageResponse(err, message, null, params, res);
			} else {
				// Successfully receive location information from GeoNames. 
				locData = results;
				
				// Determine which weather data provide to use. 
				var weather = (params.source && params.source.toLowerCase() == 'forecast') ? forecast : wunderground;
				
				// At this point we should have an array of locations populated. 
				// Now, retrieve weather details. 
				weather.getForecast(locData, function(err, results) {
					if (err) {
						response.isSuccessful = false;
						var message = 'Encountered error: {0}.'.format(err);			
						packageResponse(err, message, null, params, res);
					} else {
						// Successfully retrieved/populated weather information. 
						locData = results;
					}

					var message = 'Successfully found results for {0}.'.format(params.q);
					packageResponse(null, message, { 'locations' : locData }, params, res);
				});
			}
		});
		
	}
});

// Instantiate the HTTP server
http.createServer(function (request, response) {
    var body = '';

    request.addListener('data', function (chunk) { body += chunk });
    request.addListener('end', function () {
        // Dispatch the request to the router
        router.handle(request, body, function (result) {
            response.writeHead(result.status, result.headers);
            response.end(result.body);
        });
    });
}).listen(8083);


// Generic handler for API responses. 
function packageResponse(err, message, data, params, res) {
console.log('ERROR: ' + err);
	var response = models.wrapper();
	response.isSuccessful = (err) ? false : true;
	response.message = message;	
	response.data = data;	
	
	var headers = {};
	
	// Massage the response if the response is to be JSONP
	if (params.callback && params.callback.length > 0) {
		var headers = {
			'Access-Control-Allow-Origin' : '*',
			'Content-Type' : 'text/javascript'
		};		
		response = JSON.stringify(response);
		response = 'if({0}){1}({2});'.format(params.callback, params.callback, response);
	} else {
		var headers = {
			'Access-Control-Allow-Origin' : '*',
			'Content-Type' : 'applications/json'
		};
	}
	
	if (err) {
		res.send(500, headers, response);
	} else {
		res.send(200, headers, response);
	}
}


// Utility functions

// Add C#-ish string formatting to JavaScript. 
String.prototype.format = function() { 
	var args = arguments; 
	return this.replace(/{(\d+)}/g, function(match, number) { 
		return typeof args[number] != 'undefined' 
			? args[number] 
			: match
		;
	});
};

