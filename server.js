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

console.log('[server.js] :environment...');

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
    name: 'soundkick-server',
    secret: 'this is a secret',
    saveUninitialized: true,
    resave: true,
    duration: 30 * 60 * 1000,
    activeDuration: 10 * 60 * 1000,
    cookie: {
        maxAge: 5 * 60 * 1000
    }
}))

app.post('/api/getAccessTokenFromSession', function(req, res){
    console.log("[server.js] api/getAccessTokenFromSession: ");
    console.log(req.session);
    console.log(req.session.soundcloudAccessToken);
    if(req.session.soundcloudAccessToken){
        console.log('[server.js] api/getAccessTokenFromSession: access token has been set');
        var soundcloudAccessToken = req.session.soundcloudAccessToken;
        initializeSoundcloudApi(soundcloudAccessToken);
        res.send({soundcloudAccessToken: soundcloudAccessToken});
    } else {
        req.session = null;
        res.status(400).send("[server.js] api/getAccessTokenFromSession: the access Token has not been set")
    }
});

// accessToken as part of redirect
app.get('/api/redirectAuth', function(req,res){
  // differentiate at this url between prod and dev environments.
    console.log("[server.js] api/redirectAuth: initializing SC.init");
    initializeSoundcloudApi();
    var redirectUrl = SC.getConnectUrl();
    if(!redirectUrl){
        res.status(400).send("[server.js] api/redirectAuth: redirect url not available");
    } else {
        res.send({redirectUrl: redirectUrl});
    }
});

app.post('/api/getAccessToken', function(req, res){
    var authorizationCode = req.body.authorizationCode;
    console.log("[server.js] api/getAccessToken : " + authorizationCode);
    console.log("[server.js] api/getAccessToken : session token" + req.session);
    SC.authorize(authorizationCode, function(err, accessToken) {
        if (err) {
          res.status(400).send(err);
        } else {
          if (!req.session.soundcloudAccessToken){
            req.session.soundcloudAccessToken = accessToken;
            req.session.save();
            console.log('[server.js] api/getAccessToken: Soundcloud Access Token Saved in Session');
          }
          res.send({soundcloudAccessToken: accessToken});
        }
    });
})

app.post('/api/checkAccessTokenFromSession', function(req, res){
    var soundcloudAccessToken = req.session.soundcloudAccessToken;
    console.log("[server.js] api/checkAccessTokenFromSession: ");
    console.log(req.session);
    if(checkAccessToken(soundcloudAccessToken)){
        console.log("[server.js] api/checkAccessTokenFromSession: access token in session");
        res.send({
                    soundcloudAccess: true,
                    soundcloudAccessToken: soundcloudAccessToken
                });
    } else {
        console.log("[server.js] api/checkAccessTokenFromSession: no access token in session");
        res.status(400).send({
                soundcloudAccess: false,
                errorMessage: "[server.js] api/checkAccessTokenFromSession : no access token in session"
            });
    }
})

/*
    for query data:
        req.query to get access to params
*/
app.get('/api/soundcloudApiGet', function(req, res){
    if(checkAccessToken(req.session.soundcloudAccessToken) === false){
        res.status(400).send({
            soundcloudAccess: false,
            errorMessage: "[server.js] api/soundcloudApiGet do not have access to access token"
        });
    }
    var apiUrl = req.query.apiUrl;
    SC.get(apiUrl, function(err, results){
        console.log("[server.js] api/soundcloudApiGet: SC.get");
        if(!err){
            res.send(results);
        } else {
            console.log(err);
            res.status(400).send({
                errorMessage: err
            });
        }
    });
});


function checkAccessToken(soundcloudAccessToken){
    console.log("[server.js] checkAccessToken: ");
    console.log(soundcloudAccessToken);
    console.log("[server.js] SC.accessToken: ");
    console.log(SC.accessToken);
    console.log("[server.js] SC.isAuthorized: ");
    console.log(SC.isAuthorized);
    console.log("[server.js] SC.isInit: ");
    console.log(SC.isInit);
    if(!soundcloudAccessToken || soundcloudAccessToken !== SC.accessToken || !SC.isAuthorized){
        return false;
    } else if(!SC.isInit){
        return initializeSoundcloudApi(soundcloudAccessToken);
    }
    return true;
}

function initializeSoundcloudApi(soundcloudAccessToken){
    console.log("[server.js] initializeSoundcloudApi: ");
    if(soundcloudAccessToken){
        console.log("[server.js] initializeSoundcloudApi: soundcloudAccessToken Available");
        SC.init({id: soundcloudClientId,
                secret: soundcloudClientSecret,
                uri: soundcloudURI,
                accessToken: soundcloudAccessToken,
                scope: soundcloudScope
                });
    } else {
        console.log("[server.js] initializeSoundcloudApi: soundcloudAccessToken not available");
        SC.init({
                id: soundcloudClientId,
                secret: soundcloudClientSecret,
                uri: soundcloudURI,
                scope: soundcloudScope
        })
    }
    return SC.isInit;
}

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
