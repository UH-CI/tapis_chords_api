// server.js
const express        = require('express');
var cors             = require('cors')
const bodyParser     = require('body-parser');
const app            = express();
const request = require('request');


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
  var url = "http://"+chords_url+"/sites.json";
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


//Site POST stream - create a metadata record that defines the timeseries site
// chords_url/sites  POST
// authenticity_token: In12OvdsX0wVMoNWsrexjsgtMlcqzQfQz7YhwXlENyeQCHEQkEWjD9MRVyROrrIf8YUhyzufNXdVhtj9IKintg==
// site[name]: site name
// site[lat]: lat
// site[lon]: lon
// site[elevation]: elevation
// site[site_type_id]: 42
// commit: Add a New Site
app.post('/sites', cors(corsOptions),function (req, res) {
console.log("Sites posted")

  //create site (name,lat,lon,elevation,)
  var agave_url = "https://"+tenant_domain+"/meta/v2"
  //res.send("HEY")
  var url = "http://"+chords_url+"/sites.json";
  var options = {
      url: url,
      headers: {'Content-Type': 'application/json'},
      data:{api_key:chords_api_token}
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
// instrument[name]: my_sensor1
// instrument[sensor_id]: my_sensor1
// instrument[topic_category_id]: 19
// instrument[description]: some
// instrument[site_id]: 4
// instrument[display_points]: 120
// instrument[plot_offset_value]: 1
// instrument[plot_offset_units]: weeks
// instrument[sample_rate_seconds]: 60
// commit: Create Instrument
app.post('/instruments', cors(corsOptions),function (req, res) {
console.log("Instruments requested")
//res.send("HEY")
  var url = "http://"+chords_url+"/instruments";
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

app.get('/vars', cors(corsOptions),function (req, res) {
console.log("Instruments requested")
//res.send("HEY")
  var url = "http://"+chords_url+"/vars.json";
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
