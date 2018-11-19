// server.js
const express        = require('express');
var cors             = require('cors')
const bodyParser     = require('body-parser');
const app            = express();
const request        = require('request');
const qs             = require('qs');
var querystring      = require('querystring');
const rp             = require('request-promise');


var configFile = require('./config.js');

//restrict CORS to hosts listed in config.js file
var corsOptions ={
  "origin": configFile.hosts,
  "preflightContinue": true,
  "credentials":true
}

app.use(cors(corsOptions))

const tenant_url =configFile.tenant_url;
const port =configFile.port;
const chords_url =configFile.chords_url;
const chords_api_token = configFile.chords_api_token;
const chords_email = configFile.chords_email;

// listen for new web clients:
app.listen(port, () => {
 console.log("Server running on port: "+port);
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


// GET method route
app.get('/', function (req, res) {
  res.send('GET request to the homepage')
})



// SITE GET
//
app.get('/sites', cors(corsOptions),function (req, res) {
console.log("Sites requested")
//res.send("HEY")
  var url = "http://"+chords_url+"/sites.json?email="+chords_email+"&api_key="+chords_api_token;
  var options = {
      url: url,
      headers: {'Content-Type': 'application/json'},
      json:true
    }
  request.get(options, (err, resp, data) => {
      if (err) {
        console.log('Error:', err);
      } else if (resp.statusCode !== 200) {
        console.log('Status:', resp.statusCode);
        console.log(data)
        res.send(data)
      } else {
        console.log(data);
        res.send(data )
      }
  });
})

function create_metadata(res, token, body) {
  var post_header = {
                'accept': 'application/json',
                'content-type': 'application/json; charset=utf-8',
                'Authorization': 'Bearer ' + token
            };
  //create site (name,lat,lon,elevation,)
  var agave_url = "https://"+tenant_url+"/meta/v2/data/"
  console.log(agave_url)
  //res.send("HEY")
  // var url = "http://"+chords_url+"/sites.json";
  var options = {
      url: agave_url,
      headers: post_header,
      encoding: null,
      body:body
    }
  request.post(options, (err, resp, data) => {
      if (err) {
        console.log('Error:', err);
        return err
      } else if (resp.statusCode !== 200) {
        console.log('Status:', resp.statusCode);
        console.log(data)
        //res.send(data)
        return data
      } else {
        console.log(data);
        return data
      }
  });
}

//Site POST stream - create a metadata record that defines the timeseries site
// name: site name
// lat: latitude in wgs84
// lon: longitude in wgs84
// elevation: elevation
// site_type_id: 42 is the default
// example curl call:  curl -sk -H "Authorization: Bearer 8f70c3434ddd2cf7a791907132ace1" -X POST -F "fileToUpload=@test.json" 'http://localhost:4000/sites?name=awesome&lat=2.0&lon=4.0&elevation=0.9'
app.post('/sites', cors(corsOptions),function (req, res) {
  console.log("Sites posted")
  //ignore SSL validation in case tenant uses self-signed cert
  process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;
  var header=req.headers['authorization']||'',        // get the header
  token=header.split(/\s+/).pop(); //get the Agave API Token

  var chords_uri = "http://"+chords_url+"/sites.json";
  //create chords site parameters and form data
  if (req.query.name && req.query.lat && req.query.lon){
    site_data ={email:chords_email,api_key: chords_api_token,site: {name: req.query.name,lat: req.query.lat, lon: req.query.lat,elevation: req.query.elevation,site_type_id: 42,commit: "Add a New Site"}}
    var postData = qs.stringify(site_data)
    var chord_options = {
      uri: chords_uri,
      method: 'POST',
      body: postData,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': postData.length
      }
    };

    var agave_header = {
                  'accept': 'application/json',
                  'content-type': 'application/json; charset=utf-8',
                  'Authorization': 'Bearer ' + token
              };

    var agave_url = "https://"+tenant_url+"/meta/v2/data/"
    // request object
    request.post(chord_options,  function (err, resp, data) {
      if (err) {
        console.log('Error:', err);
        res.send(err)
      } else if (resp.statusCode !== 200) {
        console.log('Status:', resp.statusCode);
        console.log(data)
        results = JSON.parse(data)
        //create Agave metadata JSON string
        meta = '{"name":"Site","value":{"name":"'+results['name']+'","type":"chords","latitude":'+results['lat']+',"longitude":'+results['lon']+', "chords_id":'+results['id']+'}}'
        console.log(meta)
        var options = {
            url: agave_url,
            headers: agave_header,
            encoding: null, //encode with binary
            body:meta
          }
        //sitemeta  = create_metadata(res,token, '{"name":"Site","value":{"name":"'+data['name']+'","type":"chords","latitude":'+data['lat']+',"longitude":'+data['lon']+', "chords_id":'+data['id']+'}}')
        request.post(options, (err, response, result) => {
            if (err) {
              console.log('Error:', err);
              //return err
            } else if (response.statusCode !== 200) {
              console.log('Status:', resp.statusCode);
              console.log(result)
              res.send(result)
              //return data
            } else {
              console.log(result);
              res.send(result);
            }
        });
      } else {
        console.log(data);
        res.send(data )
      }
    });
  }
  else{
    res.send("ERROR: name,lat and lon are required parameters.  Please check your API call and try again.")
  }
})

//INSTRUMENT GET
//Fetch instruments from Agave Metadata based on site uuid
// site_uuid: Agave metadata uuid for site
app.get('/instruments', cors(corsOptions),function (req, res) {
console.log("Instruments requested")
//res.send("HEY")
  var url = "http://"+chords_url+"/instruments.json";
  var options = {
      url: url,
      headers: {'Content-Type': 'application/json'},
      data:{api_key:chords_api_token}
    }
  request.get(options, (err, resp, data) => {
      if (err) {
        console.log('Error:', err);
      } else if (resp.statusCode !== 200) {
        console.log('Status:', resp.statusCode);
        console.log(data)
        res.send(data)
      } else {
        console.log(data);
        res.send(data )
      }
  });
})

//INSTRUMENT POST chords_url/instruments
// authenticity_token: 9mXwN7pwoPvE6aGQ5XC7aBHxSNiYd49cnMG5x2qZVhdEEPcd3VlcuALKdeIZabj5KFlbRIklvfsG8UD7M3XGhg==
// name]: my_sensor1
// sensor_id]: my_sensor1
// topic_category_id]: 19
// description]: some
// site_uuid: Agave UUID of site
// display_points]: 120
// plot_offset_value]: 1
// plot_offset_units]: weeks
// sample_rate_seconds]: 60
// commit: Create Instrument
app.post('/instruments', cors(corsOptions),function (req, res) {
  console.log("Instruments requested")
  //res.send("HEY")
  //ignore SSL validation in case tenant uses self-signed cert
  process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;
  var header=req.headers['authorization']||'',        // get the header
  token=header.split(/\s+/).pop(); //get the Agave API Token

  var chords_uri = "http://"+chords_url+"/instruments.json";
  //create chords site parameters and form data
  if (req.query.site_uuid){
    //fetch agave site metadata object
    var agave_header = {
                  'accept': 'application/json',
                  'content-type': 'application/json; charset=utf-8',
                  'Authorization': 'Bearer ' + token
              };

    var agave_url = "https://"+tenant_url+"/meta/v2/data/"+req.query.site_uuid+"/pems/"
    var get_metadata_options = {
        url: agave_url,
        headers: agave_header,
        json: true
      }

    rp.get(get_metadata_options)
      .then(function (response) {
          console.log(response)
          res.send(response)
      })
      .catch(function (err) {
          console.log(err)
      });
  }
})

//MEASUREMENT GET
//Fetch measurements from chords based on instrument
app.get('/measurements', cors(corsOptions),function (req, res) {
console.log("Instruments requested")
//res.send("HEY")
  var url = "http://"+chords_url+"/instruments/1.geojson?key="+chords_api_token;
  var options = {
      url: url,
      headers: {'Content-Type': 'application/json'},
      data:{api_key:chords_api_token}
    }
  request.get(options, (err, resp, data) => {
      if (err) {
        console.log('Error:', err);
      } else if (resp.statusCode !== 200) {
        console.log('Status:', resp.statusCode);
        console.log(data)
        res.send(data)
      } else {
        console.log(data);
        res.send(data )
      }
  });
})


//url_create?instrument_id=1&shortname=TEMP&shortname=name&at=2015-08-20T19:50:28&key=KeyValue&test
app.post('/measurements', cors(corsOptions),function (req, res) {
console.log("Instruments requested")
//res.send("HEY")
  var url = "http://"+chords_url+"/measurements/url_create?instrument_id=1&TEMP=1.0&COLD=2.0&at=2015-08-20T21:50:28&key="+chords_api_token+"&test";
  var options = {
      url: url,
      headers: {'Content-Type': 'application/json'},
    }
  request.post(options, (err, resp, data) => {
      if (err) {
        console.log('Error:', err);
      } else if (resp.statusCode !== 200) {
        console.log('Status:', resp.statusCode);
        console.log(data)
        res.send(data)
      } else {
        console.log(data);
        res.send(data )
      }
  });
})
