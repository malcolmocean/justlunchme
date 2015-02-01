var express = require('express');
var path = require('path');
var session = require('express-session');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var cookieSession = require('cookie-session');
var mongoStore = require('connect-mongo')(session);
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var passport = require('passport');
var util = require('util')
var GooglePlusStrategy = require('passport-google-plus');

var async = require('async');
var app = express();
var Mailgun = require("mailgun").Mailgun;
require('./mailgunplus')(mg);
var mg = new Mailgun(process.env.MAILGUN_KEY || process.env.JLM_MAILGUN_KEY);

require('./models/user');
var User = mongoose.model('User');

// var db = require('./controllers/database.js');
config = {};
config.db = process.env.JLM_MONGO_URI || process.env.MONGOLAB_URI
mongoose.connect(config.db);
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function callback () {
  console.log("DB connection open");
});


var realm;
if (process.env.RACK_ENV == "development") {
  realm = "http://localhost:3000/";
} else if (process.env.RACK_ENV == "production") {
  realm = "http://www.justlunch.me";
} else {
  realm = "http://www.justlunch.me";
}

console.log(process.env.RACK_ENV);
console.log(realm);

app.get('/textslots', function (req, res) {
  User.find({}, function (err, users) {
    if (users.length == 0) {
      res.send ("nope");
    } else {
      res.send (users);
    }
  });
});

function checkWhosLoggedIn (req, res, next) {
  // code here that handles auth
  req.session.loggedinuser = "noah.maccalum";
  next();
}

app.post('/updateMyTopFriendsList', checkWhosLoggedIn, function (req, res) {
  User.findOne({fbusername : req.session.loggedinuser}, function (err, user) {
    user.friendList = req.body.friendList;

  });
  res.send("we did it");
});

app.get('/userme', function (req, res) {
  res.send("hi")
});

app.get('/emailuser/:fbusername', function (req, res) {
  User.findOne({fbusername: req.params.fbusername}, function (err, user) {
    mg.checkAndSendHtml({
      from: "JustLunchMe Test <test@justlunch.me>",
      to: user.email,
      subject: "Testing the JustLunchMe email server!",
      html: "o hai",
      headers: {},
      callback: function(errm) {
        // throw errm
        res.send({err: errm, result: !errm && "success"});
      }
    });
  });
});

app.get('/matchfor/:fbusername', function (req, res) {
  User.findOne({fbusername: req.params.fbusername}, function (err, user) {
    User.findOne({
      fbusername: {$in: user.friendList},
      // textslots: {$in: },
      friendList: user.fbusername
    }, function (err2, matchuser) {
      res.send({
        user: user,
        matchuser: matchuser,
      })
    })
  });
});


// Passport session setup.
//   To support persistent login sessions, Passport needs to be able to
//   serialize users into and deserialize users out of the session.  Typically,
//   this will be as simple as storing the user ID when serializing, and finding
//   the user by ID when deserializing.  However, since this example does not
//   have a database of user records, the complete Google profile is serialized
//   and deserialized.
passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(obj, done) {
  done(null, obj);
});


// Use the GooglePlusStrategy within Passport.
//   Strategies in passport require a `validate` function, which accept
//   credentials (in this case, an OpenID identifier and profile), and invoke a
//   callback with a user object.
passport.use(new GooglePlusStrategy({
    clientId: '791651266422-0rgikd8j6ls8cn70000i2vgumokps6ej.apps.googleusercontent.com',
    clientSecret: '-2_lxxQt19bOpY2-2C_YHTIP',
    // returnURL: realm + 'auth/google/return',
    // realm: realm,
  },
  function(tokens, profile, done) {
    // asynchronous verification, for effect...
    process.nextTick(function () {
      return done(null, profile, tokens);
    });
  }
));





// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'mustache');
app.set('layout', 'layout1');
// app.enable('view cache');
app.engine('mustache', require('hogan-express'))

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(cookieSession({ secret: 'secret' }));
app.use(passport.initialize());
app.use(passport.session());
app.use(session({
  resave: false,
  saveUninitialized: false,
  secret: "Nfwefdsf1287q-l8bw5efsd3urenr-g4uefo8324-qb5f5904z",
  store: new mongoStore({
    url: config.db,
    collection : 'sessions'
  })
}));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', function(req, res, next) {
  console.log("req.url", req.url);

  res.render('index', {
    title: 'JustLunch.me',
    list: [
      {name: "noah", program: "nano"},
      {name: "will", program: "tron"},
      {name: "malcolm", program: "syde"}
    ]
  });
});

app.get('/sidebartest', function(req, res, next) {
  console.log("req.url", req.url);

  res.render('index', {
    title: 'JustLunch.me',
    list: [
      {name: "noah", program: "nano"},
      {name: "will", program: "tron"},
      {name: "malcolm", program: "syde"}
    ]
  });
});


app.get('/account', ensureAuthenticated, function(req, res){
  console.log(req.user);
  res.render('account', { user: req.user });
});

app.get('/login', function(req, res){
  res.render('login', { user: req.user });
});

app.post('/auth/google/callback', passport.authenticate('google'), function(req, res) {
    // Return user back to client 
    res.send(req.user);
});

// GET /auth/google
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  The first step in Google authentication will involve redirecting
//   the user to google.com.  After authenticating, Google will redirect the
//   user back to this application at /auth/google/return
app.get('/auth/google', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    res.redirect('/');
  });

// GET /auth/google/return
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  If authentication fails, the user will be redirected back to the
//   login page.  Otherwise, the primary route function function will be called,
//   which, in this example, will redirect the user to the home page.
app.get('/auth/google/return', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    res.redirect('/account');
  });

app.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});

// Simple route middleware to ensure user is authenticated.
//   Use this route middleware on any resource that needs to be protected.  If
//   the request is authenticated (typically via a persistent login session),
//   the request will proceed.  Otherwise, the user will be redirected to the
//   login page.
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  res.redirect('/login')
}





// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

var debug = require('debug')('justlunchme:server');
var http = require('http');

/**
* Get port from environment and store in Express.
*/

var port = normalizePort(process.env.PORT || '3000');
app.set('port', port);

/**
* Create HTTP server.
*/

var server = http.createServer(app);

/**
* Listen on provided port, on all network interfaces.
*/

server.listen(port);
server.on('error', onError);
server.on('listening', onListening);

/**
* Normalize a port into a number, string, or false.
*/

function normalizePort(val) {
  var port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

/**
* Event listener for HTTP server "error" event.
*/

function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  var bind = typeof port === 'string'
  ? 'Pipe ' + port
  : 'Port ' + port

// handle specific listen errors with friendly messages
switch (error.code) {
  case 'EACCES':
    console.error(bind + ' requires elevated privileges');
    process.exit(1);
    break;
  case 'EADDRINUSE':
    console.error(bind + ' is already in use');
    process.exit(1);
    break;
  default:
    throw error;
  }
}

/**
* Event listener for HTTP server "listening" event.
*/

function onListening() {
  var addr = server.address();
  var bind = typeof addr === 'string'
  ? 'pipe ' + addr
  : 'port ' + addr.port;
  debug('Listening on ' + bind);
}


console.log("started Successfully");
