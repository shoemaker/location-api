// https://github.com/LearnBoost/expect.js
// http://visionmedia.github.io/mocha/

var TEST_URL = 'http://localhost:8083/location';
var URL_REGEX = /(http|https):\/\/[\w\-_]+(\.[\w\-_]+)+([\w\-\.,@?^=%&amp;:/~\+#]*[\w\-\@?^=%&amp;/~\+#])?/;

describe('Location Test', function() {
	
	var response, locations;

	// Retreive data to power these tests. 
	before(function(done) {
		$.ajax({
	        url: TEST_URL,
	        method: 'GET',
	        dataType: 'json',
	        data: {'q' : 'Minneapolis|New York|Buenos Aires'},
	        success: function(data) {
	            response = data;
				locations = data.data.locations;
				done();  // callback
	        },
	        error: function(ex) {
	            console.log('Well... this is embarrassing. ' + ex);
	            $('#mocha').html('<p>Well... this is embarrassing. Encountered error requesting data.</p>');
	        },
	        complete: function() { }
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


// Sandbox, playing with Mocha and expect.js. 
describe('Sandbox Test', function() {
	describe('when an empty string is passed in', function() {
		it('returns 0', function() {
			var result = 0;
			assert(result === 0);
		});
	});
	
	describe('when array of numbers is passed in', function() {
		var testArray = [1,2,3];
		
		it('returns true', function() {
			expect(testArray).to.contain(2);
		});
		
		it('should return -1 when the value is not present', function() {
			expect(testArray).to.not.contain(5);
		});		
	});	
});

