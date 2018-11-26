Agave Chords API

This NodeJS API connects Agave and the chords streaming service.

To run this after pull the repository:

1. npm install
2. edit the config.js
3. run the server with >node server.js

The usage for the API is as follows:

1. Create a Site
2. Create Instrument(s) using the site uuid
3.

Example curl commands are with the each api definition in the server.js. They are below as well:

## Get Sites:

curl -sk -H "Authorization: Bearer AGAVE_TOKEN" -X GET 'http://localhost:4000/sites'


## Post Sites:

curl -sk -H "Authorization: Bearer AGAVE_TOKEN" -X POST 'http://localhost:4000/sites?name=awesome&lat=2.0&lon=4.0&elevation=0.9&geojson=%7B%22type%22%3A%20%22Point%22%2C%22coordinates%22%3A%20%5B2.0%2C4.0%5D%7D'

NOTE that the geojson parameter has been encoded
