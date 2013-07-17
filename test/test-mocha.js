// https://github.com/LearnBoost/expect.js
// http://visionmedia.github.io/mocha/

var http = require('http');
var assert = require('assert');
var expect = require('./js/expect.js');

var options = { 
	host: 'localhost',
	port: '8083', 
	path: '/location?q=Minneapolis|New%20York|Buenos%20Aires'
};

var URL_REGEX = /(http|https):\/\/[\w\-_]+(\.[\w\-_]+)+([\w\-\.,@?^=%&amp;:/~\+#]*[\w\-\@?^=%&amp;/~\+#])?/;

// Sandbox, playing with Mocha and expect.js. 
describe('Location Test', function() {
	var response, locations;

	// Retreive data to power these tests. 
	before(function(done) {
		http.get(options, function(res) { 
			var json = '';		
	
			// Handler for each chunk of data in the response from the API
			res.on('data', function (chunk) { 
				json += chunk;  // Append this chunk
			});
			
			// Handler once the request to the API is complete. 
			res.on('end', function() { 
				var err;
				try { 
					var data = JSON.parse(json);  // Turn the string into an object. 
					response = data;
					locations = data.data.locations;
				} catch (ex) {
					console.log("Encountered error: " + ex.message);
				} finally {
					done();  // callback					
				}
			}).on('error', function(err) {
				console.log("Encountered error: " + err.message);
			});
		});
	});
	
	// Test the response wrapper. 
	describe('Response', function() {
		it('should return isSuccessful as true', function() {
			expect(response.isSuccessful).to.be.ok();
		});
		
		it('should return 3 cities', function() {
			expect(response.data.locations).to.have.length(3);
		});
	});
	
	// Test the location. 
	describe('Locations', function() {
		it('should return cities in the order requested', function() {
			expect(locations[0].city).to.contain('Minneapolis');
			expect(locations[1].city).to.contain('New York');
			expect(locations[2].city).to.contain('Buenos Aires');
		});
		
		it('should have a valid latitude and longitude', function() {
			for(var ii=0; ii<locations.length; ii++) {
				expect(locations[ii].latitude).to.be.within(-90,90);
				expect(locations[ii].longitude).to.be.within(-180,180);
			}	
		});
		
		it('should contain data provider', function() {
			for(var ii=0; ii<locations.length; ii++) {
				expect(locations[ii].dataProvider).to.not.be.empty();
				expect(locations[ii].dataProviderUrl).to.match(URL_REGEX);
			}
		});
	});
	
	// Test the time zone. 
	describe('Time Zone', function() {
		it('should be an object', function() {
			for(var ii=0; ii<locations.length; ii++) {
				expect(locations[ii].timeZone).to.be.an('object');
			}
		});
		
		it('should contain offset hours', function() {
			for(var ii=0; ii<locations.length; ii++) {
				expect(locations[ii].timeZone.offsetMS).to.be.a('number');
				expect(locations[ii].timeZone.offsetHours).to.be.within(-12,12);
			}
		});
		
		it('should contain time zone names', function() {
			for(var ii=0; ii<locations.length; ii++) {
				expect(locations[ii].timeZone.standardName).to.not.be.empty();
				expect(locations[ii].timeZone.shortName).to.not.be.empty();
			}
		});
	});
	
	// Test the weather. 
	describe('Weather', function() {
		it('should be an object', function() {
			for(var ii=0; ii<locations.length; ii++) {
				expect(locations[ii].weather).to.be.an('object');
			}
		});
		
		it('should contain valid temperatures', function() {
			for(var ii=0; ii<locations.length; ii++) {
				expect(locations[ii].weather.tempF).to.be.a('number');
				expect(locations[ii].weather.tempF).to.be.within(-100,200);
				expect(locations[ii].weather.tempC).to.be.a('number');
				expect(locations[ii].weather.tempC).to.be.within(-100,100);
			}
		});
		
		it('should contain reference URLs', function() {
			for(var ii=0; ii<locations.length; ii++) {
				expect(locations[ii].weather.url).to.match(URL_REGEX);
				expect(locations[ii].weather.dataProviderUrl).to.match(URL_REGEX);
			}
		});
	});
});