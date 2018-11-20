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
// fetch all Agave chords sites
//example: curl -sk -H "Authorization: Bearer 0e7fb437593e01973ac443cd646a8ed" -X GET 'http://localhost:4000/sites'
app.get('/sites', cors(corsOptions),function (req, res) {
  console.log("Sites requested")

  process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;
  var header=req.headers['authorization']||'', // get the header
  token=header.split(/\s+/).pop(); //get the Agave API Token
  var query ={'name':'Site', 'value.type':"chords"}
  console.log(query)
  var agave_header = {
                'accept': 'application/json',
                'content-type': 'application/json; charset=utf-8',
                'Authorization': 'Bearer ' + token
            };
  var get_sites_options = {
      url: "https://"+tenant_url+"/meta/v2/data?q="+JSON.stringify(query),
      headers: agave_header,
      json: true
    }
  //fetch agave instrument metadata obj with only chords_id field
  rp.get(get_sites_options)
    .then( function (response) {
      console.log(response)
      res.send(response)
    })
    .catch(function (err) {
        console.log(err)
    })//catch for instrument metadata fetch

/*//GET CHORDS SITES
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
  */
})

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

//INSTRUMENTS GET
//Fetch instruments from Agave Metadata based on site uuid
// site_uuid: Agave metadata uuid for site, if not provided will fetch all instruments user has access too
// example: curl -sk -H "Authorization: Bearer 0e7fb437593e01973ac443cd646a8ed" -X GET 'http://localhost:4000/instruments?site_uuid=6162433366031330840-242ac1111-0001-012'
app.get('/instruments', cors(corsOptions),function (req, res) {
  console.log("Instruments requested")
  process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;
  var header=req.headers['authorization']||'', // get the header
  token=header.split(/\s+/).pop(); //get the Agave API Token
  var query ={'name':'Instrument'}
  if(req.query.site_uuid != undefined){
    query['associationIds'] = req.query.site_uuid
  }
  console.log(query)
  var agave_header = {
                'accept': 'application/json',
                'content-type': 'application/json; charset=utf-8',
                'Authorization': 'Bearer ' + token
            };
  var get_instruments_options = {
      url: "https://"+tenant_url+"/meta/v2/data?q="+JSON.stringify(query),
      headers: agave_header,
      json: true
    }
  //fetch agave instrument metadata obj with only chords_id field
  rp.get(get_instruments_options)
    .then( function (response) {
      console.log(response)
      res.send(response)
    })
    .catch(function (err) {
        console.log(err)
    })//catch for instrument metadata fetch

/* //GETS CHORDS INSTRUMENTS
  var url = "http://"+chords_url+"/instruments.json?email="+chords_email+"&api_key="+chords_api_token;
  var options = {
      url: url,
      headers: {'Content-Type': 'application/json'},
      json: true
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
  });*/
})

//INSTRUMENT POST chords_url/instruments
// site_uuid: Agave UUID of site
// name: my_sensor1
// sensor_id: my_sensor1
// topic_category_id: 19
// description: some
// display_points: 120
// plot_offset_value: 1
// plot_offset_units: weeks
// sample_rate_seconds: 60
// commit: Create Instrument
//example curl curl -sk -H "Authorization: Bearer 349d994e5fc0cc6ded24ea50447b859f" -X POST 'http://localhost:4000/instruments?site_uuid=569912752204485096-242ac1112-0001-012&name=awesome'
app.post('/instruments', cors(corsOptions),function (req, res) {
  console.log("Instruments posted")
  //ignore SSL validation in case tenant uses self-signed cert
  process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;
  var header=req.headers['authorization']||'', // get the header
  token=header.split(/\s+/).pop(); //get the Agave API Token
  if (req.query.site_uuid){

    var agave_header = {
                  'accept': 'application/json',
                  'content-type': 'application/json; charset=utf-8',
                  'Authorization': 'Bearer ' + token
              };

    var get_profile_options = {
      url: "https://"+tenant_url+"/profiles/me",
      headers: agave_header,
      json: true
    }
    //fetch agave profile
    rp.get(get_profile_options)
      .then(function (response) {
        console.log(response)
        var get_metadata_pem_options = {
            url: "https://"+tenant_url+"/meta/v2/data/"+req.query.site_uuid+"/pems/"+response['result']['username'],
            headers: agave_header,
            json: true
          }
        //fetch agave site metadata permission for profile username
        rp.get(get_metadata_pem_options)
          .then(function (response1) {
              console.log(response1)
              if(response1['result']['permission']['write'] == true){
                //We can write so lets fetch the site_id
                var get_metadata_options = {
                    url: "https://"+tenant_url+"/meta/v2/data/"+req.query.site_uuid+"?filter=value.chords_id",
                    headers: agave_header,
                    json: true
                  }
                //fetch agave site metadata obj with only chords_id field
                rp.get(get_metadata_options)
                  .then( function (response2) {
                    instrument_data ={email:chords_email,api_key: chords_api_token,instrument: {site_id: response2['result']['value']['chords_id'],name: req.query.name,sensor_id: req.query.name, topic_category_id: 19, description: req.query.description, display_points: 120,plot_offset_value: 1, plot_offset_units: "weeks", sample_rate_seconds: 60,commit: "Create Instrument"}}
                    var postData = qs.stringify(instrument_data)
                    var post_instrument_options ={
                      uri: "http://"+chords_url+"/instruments.json",
                      method: 'POST',
                      body: postData,
                      headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'Content-Length': postData.length
                      },
                      json:true
                    }
                    //post chords instument
                    rp.post(post_instrument_options)
                      .then(function (response3) {
                        console.log(response3)
                        meta = {name:"Instrument",associationIds:[req.query.site_uuid],value:{name:response3['name'],type:"chords",chords_id:response3['id'],chords_site_id:response3['site_id']}}
                        var post_instrument_metadata_options = {
                            url: "https://"+tenant_url+"/meta/v2/data/",
                            headers: agave_header,
                            encoding: null, //encode with binary
                            body:meta,
                            json:true
                          }
                        //post Agave instrument metadata
                        rp.post(post_instrument_metadata_options)
                          .then(function (response4) {
                            console.log(response4)
                            res.send(response4['result'])
                          })//then for Agave instrument metadata creation
                          .catch(function (err4) {
                              console.log(err4)
                              res.send(err4)
                          });//catch for Agave instrument metadata creation
                      })//then for chords instrument post
                      .catch(function (err3) {
                          console.log(err3)
                          res.send(err3)
                      });//catch for chords instrument post
                  })//then for site metadate fetch
                  .catch(function (err2) {
                      console.log(err2)
                      res.send(err2)
                  });//catch for site metadata fetch
              }//close if for metadata permission check
              else{
                res.send('{error: "User lacks WRITE permission for site: '+req.query.site_uuid +'"}')
              }
          })//then for site metadata permissions fetch
          .catch(function (err1) {
              console.log(err1)
              res.send(err1)
          });//catch for site metadata permissions fetch
      })//then for profiles fetch
      .catch(function (err) {
          console.log(err)
          res.send(err)
      });//catch for profile fetch
  }//close if
})

//MEASUREMENT GET
//Fetch measurements by instrument
//instrument_uuid
//format:  json or csv
//example: curl -sk -H "Authorization: Bearer 0e7fb437593e01973ac443cd646a8ed" -X GET 'http://localhost:4000/measurements?instrument_uuid=2520111234992181736-242ac1111-0001-012&format=csv'
app.get('/measurements', cors(corsOptions),function (req, res) {
  console.log("Instruments requested")
  //ignore SSL validation in case tenant uses self-signed cert
  process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;
  var header=req.headers['authorization']||'', // get the header
  token=header.split(/\s+/).pop(); //get the Agave API Token
//  var query = "{'$and':[{'name':'Instrument'},{'associationIds':["+req.query.instrument_uuid+"}"
  var agave_header = {
                'accept': 'application/json',
                'content-type': 'application/json; charset=utf-8',
                'Authorization': 'Bearer ' + token
            };
  var get_instruments_options = {
      url: "https://"+tenant_url+"/meta/v2/data/"+req.query.instrument_uuid,
      headers: agave_header,
      json: true
    }
  //fetch agave instrument metadata obj with only chords_id field
  rp.get(get_instruments_options)
    .then( function (response) {
      console.log(response)
      if (response['result']['uuid'] != undefined){
        var get_measurments_options={
          url: "http://"+chords_url+"/instruments/"+response['result']['value']['chords_id']+"."+ req.query.format+"?email="+chords_email+"&api_key="+chords_api_token,
          headers: {'Content-Type': 'application/json'}
        }
        rp.get(get_measurments_options)
          .then( function (response2) {
            console.log(response2)
            res.send(response2)
          })
          .catch(function (err2) {
              console.log(err2)
              res.send(err2)
          });//catch for profile fetch
      }
      else{
        res.send('{error: "No Instrument matching uuid: '+req.query.instrument_uuid +' was found."}')
      }
    })
    .catch(function (err) {
        console.log(err)
        res.send(err)
    });//catch for agave instrument metadata fetch
//res.send("HEY")
/*  var url = "http://"+chords_url+"/instruments/1.geojson?key="+chords_api_token;
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
  });*/
})

// MEASUREMENT POST
// instrument_uuid: Agave uuid of instrument metadata object
// at: timestamp for measurement (if not provided the system will use system time submitted)
// vars[]: a hash/dictionary of variables using shortnames- NOTE these have to be defined for the instrument or they are ignored
//url_create?instrument_id=1&shortname=TEMP&shortname=name&at=2015-08-20T19:50:28&key=KeyValue&test
app.post('/measurements', cors(corsOptions),function (req, res) {
  console.log("Measurement posted")
  console.log(req.query)
  //ignore SSL validation in case tenant uses self-signed cert
  process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;
  var header=req.headers['authorization']||'', // get the header
  token=header.split(/\s+/).pop(); //get the Agave API Token
  if (req.query.instrument_uuid){
    var agave_header = {
                  'accept': 'application/json',
                  'content-type': 'application/json; charset=utf-8',
                  'Authorization': 'Bearer ' + token
              };
    var get_profile_options = {
      url: "https://"+tenant_url+"/profiles/me",
      headers: agave_header,
      json: true
    }
    //fetch agave profile
    rp.get(get_profile_options)
      .then(function (response) {
        console.log(response)
        var get_metadata_pem_options = {
            url: "https://"+tenant_url+"/meta/v2/data/"+req.query.instrument_uuid+"/pems/"+response['result']['username'],
            headers: agave_header,
            json: true
          }
          //fetch agave instrument metadata permission for profile username
        rp.get(get_metadata_pem_options)
          .then(function (response1) {
            console.log(response1)
            if(response1['result']['permission']['write'] == true){
              //We can write to lets fetch the instrument_id
              var get_metadata_options = {
                  url: "https://"+tenant_url+"/meta/v2/data/"+req.query.instrument_uuid+"?filter=value.chords_id",
                  headers: agave_header,
                  json: true
                }
              //fetch agave instrument metadata obj with only chords_id field
              rp.get(get_metadata_options)
                .then( function (response2) {
                  console.log(response2)
                  measurement_data =Object.assign({}, {email:chords_email,api_key: chords_api_token,instrument_id: response2['result']['value']['chords_id'], at: req.query.at || new Date().toISOString()},req.query.vars)
                  console.log(measurement_data)
                  var postData = qs.stringify(measurement_data)
                  var post_instrument_options ={
                    uri: "http://"+chords_url+"/measurements/url_create?",
                    method: 'GET',
                    body: postData,
                    headers: {
                      'Content-Type': 'application/x-www-form-urlencoded',
                      'Content-Length': postData.length
                    },
                    json:true
                  }
                  //post chords measurement
                  rp.get(post_instrument_options)
                    .then(function(response3){
                      console.log(response3)
                      res.send(response3)
                    })
                    .catch(function (err2) {
                        console.log(err2)
                    });//catch for chords measurment post
                })//then for instrument metadata fetch
                .catch(function (err2) {
                    console.log(err2)
                });//catch for instrument metadata fetch
            }
        })//then for instument metadata permissions check
        .catch(function (err1) {
            console.log(err1)
        });//catch for instrument metatdata permsisions fetch
      })
      .catch(function (err) {
          console.log(err)
      });//catch for profile fetch

  /*var url = "http://"+chords_url+"/measurements/url_create?instrument_id=1&TEMP=1.0&COLD=2.0&at=2015-08-20T21:50:28&key="+chords_api_token+"&test";
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
  });*/
  }//if check
  else{
    res.send("Instrument UUID parameter is required")
  }
})
