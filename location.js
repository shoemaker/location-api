var http = require('http');
var fs = require('fs');  // File system access
var express = require('express');  // Express framework

// App configuration
if (!fs.existsSync('config.js')) {
	console.error('Config file [config.js] missing!');
	console.error('Either rename sample-config.js and populate with your settings, or run \'make decrypt_conf\'.');
	process.exit(1);
}

var c = require('./config').config; 
var models = require('./models/location');
var geonames = require('./controllers/geonames');
var wunderground = require('./controllers/wunderground');
var forecast = require('./controllers/forecast');

// Configure Express
var app = express();
app.configure(function() {
	app.use(express.cookieParser());
	app.use(express.session({secret: 'foo' }));	
	app.use(express.bodyParser());

	// Define paths for serving up static content. 
	app.use('/location/test', express.static(__dirname + '/test'));
});

// Define route(s) 
app.get('/location', function(req, res) {
	var response = models.wrapper();
	locData = null;
	
	// Check if locations were provided
	if (!req.query.q || req.query.q.length == 0) {
		var message = 'No locations to search were provided. Use the \'q\' querystring parameter (example: q=Minneapolis,%20MN).';
		packageResponse(null, message, null, req.query, res);
	} else {
		// We have one or more locations, proceed. 
		// Parse out the list of locations
		var queries = req.query.q.split('|');

		// Sometimes a trailing '|' makes its way to the query, resulting in an empty location. Remove it if it's there. 
		if (queries[queries.length - 1].length == 0)
			queries.pop();
				
		// Request location data
		geonames.getLocationDetails(queries, function(err, results) {
			if (err) {
				var message = 'Encountered error: {0}.'.format(err);
				packageResponse(err, message, null, req.query, res);
			} else {
				// Successfully receive location information from GeoNames. 
				locData = results;
				
				// Determine which weather data provide to use. 
				var weather = (req.query.source && req.query.source.toLowerCase() == 'forecast') ? forecast : wunderground;
				
				// At this point we should have an array of locations populated. 
				// Now, retrieve weather details. 
				weather.getForecast(locData, function(err, results) {
					if (err) {
						response.isSuccessful = false;
						var message = 'Encountered error: {0}.'.format(err);			
						packageResponse(err, message, null, req.query, res);
					} else {
						// Successfully retrieved/populated weather information. 
						locData = results;
					}

					var message = 'Successfully found results for {0}.'.format(req.query.q);
					packageResponse(null, message, { 'locations' : locData }, req.query, res);
				});
			}
		});		
	}
});

/*** Fire up the Express web server ***/
app.listen(c.port);
console.log('Try this: http://localhost:' + c.port + '/location?q=Minneapolis\n');



// Generic handler for API responses. 
function packageResponse(err, message, data, params, res) {
	var response = models.wrapper();
	response.isSuccessful = (err) ? false : true;
	response.message = message;	
	response.data = data;	

	// Massage the response if the response is to be JSONP
	if (params.callback && params.callback.length > 0) {
		res.setHeader('Content-Type', 'text/javascript');
		response = JSON.stringify(response);
		response = 'if({0}){1}({2});'.format(params.callback, params.callback, response);
	} else {
		res.setHeader('Content-Type', 'application/json');
	}
	
	// Set the correct status value
	if (err) {
		res.status(500);
	} else {
		res.status(200);
	}

	res.setHeader('Access-Control-Allow-Origin', '*');

	// Send the response. 
	res.send(response)
}


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

