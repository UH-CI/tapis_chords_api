Agave Chords API

This NodeJS API connects Agave and the chords streaming service.


# INSTALLATION
To run the nodejs server after pulling the repository:

1. npm install
2. edit the config.js
3. run the server with >node server.js

OR you can build the docker container and run that:

1. edit the config.js - make sure the port is 8080 as this is what is exposed in the dockerfile
2. run >docker build -t agave_chords_api .
3. run >docker run -d -p 8080:8080 agave_chords_api

The container can be accessed on localhost:8080 now.


# USAGE

The usage for the API is as follows for storing measurements:

1. Create a Site
2. Create Instrument(s) using the site uuid
3. Create Variable(s) using the instrument UUID
4. Create Measurements using the instrument UUID and variable shortname key/value pairs

Example curl commands are with the each api definition in the server.js. They are below as well:

## GET Sites:

<pre>curl -sk -H "Authorization: Bearer AGAVE_TOKEN" -X GET 'http://localhost:4000/sites'</pre>


## POST Sites:

<pre>curl -sk -H "Authorization: Bearer AGAVE_TOKEN" -X POST 'http://localhost:4000/sites?name=awesome&lat=2.0&lon=4.0&elevation=0.9&geojson=%7B%22type%22%3A%20%22Point%22%2C%22coordinates%22%3A%20%5B2.0%2C4.0%5D%7D'</pre>

NOTE that the 'geojson' parameter has been encoded and must be a valid GeoJSON type like: {"type": "Point","coordinates": [2.0,4.0]}.  The decoded url would appear (http://localhost:4000/sites?name=awesome&lat=2.0&lon=4.0&elevation=0.9&geojson={"type": "Point","coordinates": [2.0,4.0]})

## GET Instruments:

<pre>curl -sk -H "Authorization: Bearer AGAVE_TOKEN" -X GET 'http://localhost:4000/instruments?site_uuid=6162433366031330840-242ac1111-0001-012'</pre>

NOTE if the site_uuid parameter is not provided all instruments the user has permission on will be returned

## POST Instruments:

<pre>curl -sk -H "Authorization: Bearer AGAVE_TOKEN" -X POST 'http://localhost:4000/instruments?site_uuid=569912752204485096-242ac1112-0001-012&name=Excellent'</pre>

NOTE that the 'site_uuid' and 'name' parameters are the only ones that are required.  Other parameters will soon be supported such as: 'description'...

## GET Variables

<pre>curl -sk -H "Authorization: Bearer AGAVE_TOKEN" -X GET 'http://localhost:4000/variables?instrument_uuid=7363236815187734040-242ac1111-0001-012'</pre>

NOTE if the instrument_uuid parameter is not provided all variables the user has permission on will be returned

## POST Variables

<pre>curl -sk -H "Authorization: Bearer AGAVE_TOKEN" -X POST 'http://localhost:4000/variables?instrument_uuid=7363236815187734040-242ac1111-0001-012&name=Awesome&shortname=aw&units=blargs&units_abbrv=blgs'</pre>

## GET Measurements

<pre>curl -sk -H "Authorization: Bearer AGAVE_TOKEN" -X GET 'http://localhost:4000/measurements?instrument_uuid=2520111234992181736-242ac1111-0001-012&format=csv'</pre>

NOTE the 'format' parameter can be 'json' or 'csv'

## POST Measurements

<pre>curl -sk -H "Authorization: Bearer AGAVE_TOKEN" -X POST 'http://localhost:4000/measurements?instrument_uuid=2520111234992181736-242ac1111-0001-012&vars%5Btemp%5D=25.0&vars%5Bdiss_ox%5D=1.5&vars%5Bhumidity%5D=0.5'</pre>

NOTE the 'vars' parameter is a hash/dictionary of variables using shortnames- NOTE these have to be defined for the chords instrument or they are ignored - also note they have been encoded otherwise they would appear as (http://localhost:4000/measurements?instrument_uuid=2520111234992181736-242ac1111-0001-012&vars[temp]=25.0&vars[diss_ox]=1.5&vars[humidity]=0.5)

## Spatial Querying

<pre>curl -sk -H "Authorization: Bearer AGAVE_TOKEN" -X GET 'http://localhost:4000/spatial?geometry=%7B%22type%22%3A%22Polygon%22%2C%22coordinates%22%3A%5B%5B%5B0%2C0%5D%2C%5B10%2C0%5D%2C%5B10%2C10%5D%2C%5B0%2C10%5D%2C%5B0%2C0%5D%5D%5D%7D'</pre>

NOTE the url has been encode for the 'geometry' field that should be a GeoJSON polygon. The decoded URL would be ('http://localhost:4000/spatial?geometry={"type":"Polygon","coordinates":[[[0,0],[10,0],[10,10],[0,10],[0,0]]]}')
