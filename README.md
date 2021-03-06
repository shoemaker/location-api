# Location API

## About this Application
A Node.js RESTful API that returns basic information about requested location(s). 
Details include location (latitude, longitude, country, state, etc), time zone, and weather information. 

## Usage
* Rename `sample-config.js` to `config.js` or obtain the decryption key for the Makefile.
* Register with [GeoNames](http://www.geonames.org/) and [Weather Underground](http://www.wunderground.com/weather/api/). Update `config.js` with your keys.
* Install dependencies: `$ npm install`
* Fire up the server: ` $ npm start`
* Search a single location: `http://localhost:8083/location?q=Minneapolis`
* Search more than one location (use the '|' delimiter): `http://localhost:8083/location?q=Minneapolis|New%20York|London`
* Change the source for weather data to Dark Sky: `http://localhost:8083/location?q=Minneapolis&source=darksky`

## Example Response

	{
	    "isSuccessful": true,
	    "message": "Successfully found results for Minneapolis.",
	    "data": {
	        "locations": [
	            {
	                "latitude": 44.9799654,
	                "longitude": -93.2638361,
	                "city": "Minneapolis",
	                "state": "Minnesota",
	                "stateCode": "MN",
	                "country": "United States",
	                "countryCode": "US",
	                "population": 382578,
	                "timeZone": {
	                    "offsetMS": -18000000,
	                    "offsetHours": -5,
	                    "standardName": "America/Chicago",
	                    "shortName": "CDT"
	                },
	                "weather": {
	                    "conditions": "Clear",
	                    "iconURL": "http://icons-ak.wxug.com/i/c/k/clear.gif",
	                    "icon": null,
	                    "tempF": 51.8,
	                    "tempC": 11,
	                    "tempDescription": "51.8 F (11.0 C)",
	                    "humidity": "87%",
	                    "windMPH": 3,
	                    "windDirection": "North",
	                    "windDescription": "From the North at 3.0 MPH",
	                    "url": "http://www.wunderground.com/cgi-bin/findweather/getForecast?query=44.975399,-93.233704",
	                    "dataProvider": "Weather Underground",
	                    "dataProviderUrl": "http://www.wunderground.com/?apiref=b9438d689fdd8edf"
	                },
	                "dataProvider": "GeoNames",
	                "dataProviderUrl": "http://www.geonames.org/"
	            }
	        ]
	    }
	}

## Tests
Look in the `test` folder for a simple [Mocha](http://visionmedia.github.io/mocha/)-powered test suite. 
Tests using HTML and Node.js are available. 
All tests require the API to be running on your local machine. 

#### HTML
Run the HTML test by opening `test/index.html` in your browser. 

#### Mocha
Ensure you have Mocha installed on your machine.

	$ npm install -g mocha
	$ npm test

## To Do
* The HTML and Node.js tests are duplicated. Need to update this to be DRY instead of WET. 

## Services
The API aggregates information from several third-party APIs. 
You will need to register a developer ID (free) to use these services. 
Just update the config.js with your information. 

### [GeoNames](http://www.geonames.org/)
RESTful API to perform free-form location searches. 
We're using GeoNames rather than Google because of the restrictions Google places on the use of search results. 
Yahoo used to have a great service called "PlaceFinder" but as of 11.2012 it became a fee-based service. 

### [Weather Underground](http://www.wunderground.com/weather/api/)
RESTful API by Weather Underground to search weather details for a given location. 
For this application we're using the "Stratus Plan" to retrieve current weather conditions. 

### [Dark Sky](https://darksky.net/dev/)
RESTful API by Dark Sky (formerly forecast.io), the team behind the great Dark Sky iOS app.
