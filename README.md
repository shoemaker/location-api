# Location API

## About this Application
A Node.js RESTful API that returns basic information about submitted location(s). 
Details include location (latitude, longitude, country, state, etc), time zone, and weather information. 
This project was originally created as a data source for a Jive [demonstration project](https://github.com/shoemaker/Jive-Location-Demo).

## Usage
* Rename 'sample-config.js' to 'config.js' or obtain the decryption key for the Makefile.
* Register with [GeoNames](http://www.geonames.org/) and [Weather Underground](http://www.wunderground.com/weather/api/). Update config.js with your keys.
* Search a single location: http://localhost:8083/location?q=Minneapolis
* Search more than one location (use the '|' delimiter): http://localhost:8083/location?q=Minneapolis|New%20York|London

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

### [Forecast](https://developer.forecast.io/)
RESTful API by forecast.io, the team behind the Dark Sky iOS app.

## Example Response

	{
	    "isSuccessful": true,
	    "message": "Successfully found results for Minneapolis, MN.",
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
	                    "offsetMS": -21600000,
	                    "offsetHours": -6,
	                    "standardName": "America/Chicago",
	                    "shortName": "CST"
	                },
	                "weather": {
	                    "conditions": "Clear",
	                    "iconURL": "http://icons-ak.wxug.com/i/c/k/nt_clear.gif",
	                    "tempF": 60.3,
	                    "tempC": 15.7,
	                    "tempDescription": "60.3 F (15.7 C)",
	                    "humidity": "51%",
	                    "windMPH": 14,
	                    "windDirection": "South",
	                    "windDescription": "From the South at 14.0 MPH Gusting to 20.0 MPH",
	                    "url": "http://www.wunderground.com/cgi-bin/findweather/getForecast?query=44.975399,-93.233704"
	                }
	            }
	        ]
	    }
	}


## Dependencies

### [journey](https://github.com/cloudhead/journey)
HTTP-routing in Node.js. 

### [async](https://github.com/caolan/async)
Library to manage asynchronous requests.

### [node-cache](https://github.com/ptarjan/node-cache)
A simple in-memory cache for Node.js.