var express = require('express'),
    path = require('path'),
    logger = require('morgan'),
    bodyParser = require('body-parser');

// Babel ES6/JSX Compiler
require('babel-register');

var swig  = require('swig'),
    React = require('react'),
    ReactDOM = require('react-dom/server'),
    Router = require('react-router'),
    routes = require('./app/routes'),
    async = require('async'),
    request = require('request'),
    xml2js = require('xml2js');

var config = require('./config');

var cookieParser = require('cookie-parser'),
    session = require('express-session');

console.log('environment...');
console.log(process.env.SOUNDKICK_IN_PRODUCTION);

//Secrets
require('dotenv').load();
var env = process.env.SOUNDKICK_IN_PRODUCTION || 'dev';

//Database
var mongoose = require('mongoose'),
    Users = require('./models/user');

//Soundcloud dependencies
var SC = require('node-soundcloud');
var soundcloudScope = "non-expiring";
if(env === 'dev'){
  var soundcloudClientId = process.env.SOUNDCLOUD_DEV_CLIENT_ID,
      soundcloudClientSecret = process.env.SOUNDCLOUD_DEV_CLIENT_SECRET,
      soundcloudURI = process.env.SOUNDCLOUD_DEV_REDIRECT_URI;
} else {
  var soundcloudClientId = process.env.SOUNDCLOUD_PROD_CLIENT_ID,
      soundcloudClientSecret = process.env.SOUNDCLOUD_PROD_CLIENT_SECRET,
      soundcloudURI = process.env.SOUNDCLOUD_PROD_REDIRECT_URI;
}

var app = express();

mongoose.connect(config.database);
mongoose.connection.on('error', function() {
  console.info('Error: Could not connect to MongoDB. Did you forget to run `mongod`?');
});

app.set('port', process.env.PORT || 3000);
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

//Sessions
app.use(cookieParser());
app.use(session({
  secret: 'this is a secret',
  saveUninitialized: true,
  resave: true,
  duration: 30 * 60 * 1000,
  activeDuration: 5 * 60 * 1000
}))

app.post('/api/getAccessTokenFromSession', function(req, res){
  // set session token here
  if(req.session.soundcloudAccessToken){
    console.log('access token has been set');
    var soundcloudAccessToken = req.session.soundcloudAccessToken;
    SC.init({
      id: soundcloudClientId,
      secret: soundcloudClientSecret,
      uri: soundcloudURI,
      accessToken: soundcloudAccessToken,
      scope: soundcloudScope
    })
    res.send({soundcloudAccessToken: soundcloudAccessToken});
  } else {
    console.log("the access Token has not been set");
    req.session = null;
  }
});

// access Token as part of redirect
app.get('/api/redirectAuth', function(req,res){
  // differentiate at this url between prod and dev environments.
  SC.init({
    id: soundcloudClientId,
    secret: soundcloudClientSecret,
    uri: soundcloudURI,
    scope: soundcloudScope
  })
  var redirectUrl = SC.getConnectUrl();
  if(!redirectUrl){
    console.log("url not available");
    res.status(400).send("url not available");
  } else {
    res.send({redirectUrl: redirectUrl});
  }
});

app.post('/api/getAccessToken', function(req, res){
  var authorizationCode = req.body.authorizationCode;
  console.log(authorizationCode);
  console.log(req.session);
  SC.authorize(authorizationCode, function(err, accessToken) {
    if (err) {
      res.status(400).send(err);
    } else {
      if (!req.session.soundcloudAccessToken){
        req.session.soundcloudAccessToken = accessToken;
        req.session.save();
        console.log('Soundcloud Access Token Saved in Session');
      }
      console.log(SC);
      res.send({soundcloudAccessToken: accessToken});
    }
  });
})

app.post('/api/checkAccessTokenFromSession', function(req, res){
  var soundcloudAccessToken = req.session.soundcloudAccessToken;
  console.log(soundcloudAccessToken);
  console.log(!soundcloudAccessToken);
  if(!soundcloudAccessToken){
    console.log("no access");
    res.status(400).send({soundcloudAccess: false});
  } else if (soundcloudAccessToken !== SC.accessToken){
    res.status(400).send({soundcloudAccess: false});
  } else {
    res.send({
      soundcloudAccess: true,
      soundcloudAccessToken: soundcloudAccessToken
    });
  }
})

app.get('/api/checkTracks', function(req,res){
  // cache results into songkick
  console.log(SC.id);
  var pageSize = 100;
  SC.get('/me/activities/all/own', function(err, track){
    if(err){
      res.status(400).send('fjdakljfkdlasjfd');
    } else {
      console.log(track);
      res.send({ soundcloudTracks: track});
    }
  })
});


app.use(function(req, res) {
  Router.match({ routes: routes.default, location: req.url }, function(err, redirectLocation, renderProps) {
    if (err) {
      res.status(500).send(err.message)
    } else if (redirectLocation) {
      res.status(302).redirect(redirectLocation.pathname + redirectLocation.search)
    } else if (renderProps) {
      var html = ReactDOM.renderToString(React.createElement(Router.RoutingContext, renderProps));
      var page = swig.renderFile('views/index.html', { html: html });
      res.status(200).send(page);
    } else {
      res.status(404).send('Page Not Found')
    }
  });
});

app.listen(app.get('port'), function() {
  console.log('Express server listening on port ' + app.get('port'));
});
