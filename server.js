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

//Session
var session = require('express-session'),
    mongoStore = require('connect-mongo')(session);


console.log('[server.js] :environment...');

//Secrets
require('dotenv').load();
var env = process.env.SOUNDKICK_IN_PRODUCTION || 'dev';

//Database
var mongoose = require('mongoose'),
    Users = require('./models/user');

//Soundcloud dependencies
var SC = require('node-soundcloud');
var SOUNDCLOUD_SCOPE = "non-expiring";
if(env === 'dev'){
  var SOUNDCLOUD_CLIENT_ID = process.env.SOUNDCLOUD_DEV_CLIENT_ID,
      SOUNDCLOUD_CLIENT_SECRET = process.env.SOUNDCLOUD_DEV_CLIENT_SECRET,
      SOUNDCLOUD_URI = process.env.SOUNDCLOUD_DEV_REDIRECT_URI;
} else {
  var SOUNDCLOUD_CLIENT_ID = process.env.SOUNDCLOUD_PROD_CLIENT_ID,
      SOUNDCLOUD_CLIENT_SECRET = process.env.SOUNDCLOUD_PROD_CLIENT_SECRET,
      SOUNDCLOUD_URI = process.env.SOUNDCLOUD_PROD_REDIRECT_URI;
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
var sessionStore = new mongoStore({url: config.mongoStore});
app.use(session({
    name: 'soundkick-server',
    secret: 'sessionsecret123',
    saveUninitialized: false,
    resave: false,
    cookie: {
        maxAge: 5 * 60 * 1000 // 10 minutes
    },
    store: sessionStore
}));

var SESSION_ID;
sessionStore.on("create", function(sessionId){
    console.log("----- SESSION CREATE ----- ");
    SESSION_ID = sessionId;
});

sessionStore.on("touch", function(sessionId){
    console.log("----- SESSION TOUCH ----- ");
    console.log(sessionId);
    SESSION_ID = sessionId;
});

sessionStore.on("update", function(sessionId){
    console.log("----- SESSION UPDATE ----- ");
    SESSION_ID = sessionId;
});

sessionStore.on("set", function(sessionId){
    console.log("----- SESSION SET ----- ");
    SESSION_ID = sessionId;
});

sessionStore.on("destroy", function(sessionId){
    console.log("----- SESSION DESTROY ----- ");
    SESSION_ID = null;
});

sessionStore.on("error", function(sessionId){
    console.log("----- SESSION ERROR ----- ");
});

var initializeSoundcloud = new Promise(function(resolve, reject){
    console.log("[server.js] initializeSoundcloud promise");
    initializeSoundcloudApi();
    resolve();
});

// need to store something in the session in order for it to persist upon entry
app.post('/api/getAccessTokenFromSession', function(req, res){
    console.log('[server.js] api/getAccessTokenFromSession: started running');
    if(!req.session.new){
        req.session.new = true;
    }
    getSessionFromSessionStore(SESSION_ID, function(err, session){
        if(!err && session){
            if(session.soundcloudAccessToken){
                console.log('[server.js] api/getAccessTokenFromSession: access token has been set');
                var initializeSoundcloudWithToken = new Promise(function(resolve, reject){
                    console.log("inside promise");
                    initializeSoundcloudApi(session.soundcloudAccessToken);
                    resolve();
                });
                initializeSoundcloudWithToken.then(function(){
                    if(SC.isInit && SC.isAuthorized){
                        console.log("returned isInit true and accessToken: " + SC.accessToken);
                        res.send({soundcloudAccessToken: SC.accessToken});
                    } else if(!SC.isAuthorized){
                        console.log("SC is not authorized");
                        res.status(400).send( { soundcloudAccess: false,
                                                errorMessage: "[server.js] api/getAccessTokenFromSession: soundcloud not authorized"});
                    } else {
                        console.log("SC is not initialized");
                        res.status(400).send( { soundcloudAccess: false,
                                                errorMessage: "[server.js] api/getAccessTokenFromSession: soundcloud not initialized"});
                    }
                }).catch(function(reject){
                    res.status(400).send({ soundcloudAccess: false,
                                            errorMessage: "[server.js] api/getAccessTokenFromSession: " + reject});
                });
            } else {
                res.status(400).send({ soundcloudAccess: false,
                                       errorMessage: "[server.js] api/getAccessTokenFromSession: the access Token has not been set"})
            }
        } else {
            res.status(400).send({ soundcloudAccess: false,
                                   errorMessage: "[server.js] api/getAccessTokenFromSession:" + err})
        }
    });
});


// accessToken as part of redirect
app.get('/api/redirectAuth', function(req,res){
    // differentiate at this url between prod and dev environments.
    console.log("[server.js] api/redirectAuth: initializing SC.init");
    initializeSoundcloud.then(function(){
        console.log("initializeSoundcloud then");
        if(SC.isInit){
            var redirectUrl = SC.getConnectUrl();
            if(!redirectUrl){
                    res.status(400).send("[server.js] api/redirectAuth: redirect url not available");
            } else {
                    res.send({redirectUrl: redirectUrl});
            }
        } else {
            res.status(400).send("[server.js] api/redirectAuth: soundcloud not initialized");
        }
    }).catch(function(reject){
        res.status(400).send("[server.js] api/redirectAuth: promise rejected " + reject);
    });
});

app.post('/api/getAccessToken', function(req, res){
    var authorizationCode = req.body.authorizationCode;
    SC.authorize(authorizationCode, function(err, accessToken) {
        if (!err && accessToken) {
          if (!soundcloudAccessToken){
            req.session.soundcloudAccessToken = accessToken;
            var soundcloudAccessToken = req.session.soundcloudAccessToken;
            req.session.save(function(err){
                if(!err) {
                    console.log("[server.js] session saved...");
                    console.log('[server.js] api/getAccessToken: Soundcloud Access Token Saved in Session');
                } else {
                    console.log("[server.js] session was not saved...");
                }
            });
          }
          res.send({soundcloudAccessToken : accessToken});
        } else {
          res.status(400).send(err); // send jqxhr response
        }
    });
})

app.post('/api/checkAccessTokenFromSession', function(req, res){
    console.log("[server.js] api/checkAccessTokenFromSession: ");
    getSessionFromSessionStore(SESSION_ID, function(err, session){
        if(!err && session){
            if(checkAccessToken(session.soundcloudAccessToken)){
                console.log("[server.js] api/checkAccessTokenFromSession: access token in session");
                res.send({ soundcloudAccess: true, soundcloudAccessToken: session.soundcloudAccessToken });
            } else {
                // log out
                console.log("[server.js] api/checkAccessTokenFromSession: checkaccesstoken false");
                res.status(400).send({ soundcloudAccess: false,
                                        errorMessage: "[server.js] api/checkAccessTokenFromSession: access token not in session" });
            }
        } else {
            console.log("[server.js] api/checkAccessTokenFromSession: session not available");
            res.status(400).send({ soundcloudAccess: false, errorMessage: "[server.js] api/checkAccessTokenFromSession:" + err});
        }
    });
})

/*
    for query data:
        req.query to get access to params
*/

app.get('/api/soundcloudApiGet', function(req, res){
    // getting set as a new session each time.
    var apiUrl = req.query.apiUrl;
    SC.get(apiUrl, function(err, scRes){
        console.log("[server.js] api/soundcloudApiGet: SC.get");
        if(!err && scRes){
            res.send(scRes);
        } else {
            res.status(400).send({ errorMessage: err });
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
        var initializeSoundcloudWithToken = new Promise(function(resolve, reject){
            initializeSoundcloudApi(soundcloudAccessToken);
            resolve();
        });
        initializeSoundcloudWithToken.then(function(){
            return SC.isAuthorized;
        });
    }
    return true;
}

function initializeSoundcloudApi(soundcloudAccessToken) {
    console.log("[server.js] initializeSoundcloudApi: ");
    console.log(soundcloudAccessToken);
    var initSC = new Promise(function(resolve, reject){
        if(!soundcloudAccessToken){
            console.log("no access token");
            SC.init({
                    id: SOUNDCLOUD_CLIENT_ID,
                    secret: SOUNDCLOUD_CLIENT_SECRET,
                    uri: SOUNDCLOUD_URI,
                    scope: SOUNDCLOUD_SCOPE
            })
        } else {
            console.log("access token available");
            SC.init({
                    id: SOUNDCLOUD_CLIENT_ID,
                    secret: SOUNDCLOUD_CLIENT_SECRET,
                    uri: SOUNDCLOUD_URI,
                    accessToken: soundcloudAccessToken,
                    scope: SOUNDCLOUD_SCOPE
            })
        }
        resolve();
    });

    initSC.then(function(isInitSC){
        return SC.isInit;
    })
    .catch(function(reject){
        console.log("this promise was rejected: " + reject);
        return false;
    });
}


function getSessionFromSessionStore(sessionId, cb){
    console.log("[server.js] getSessionFromSessionStore: ");
    sessionStore.get(sessionId, function(err, session){
        cb(err, session);
    });
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
