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
var async = require('async');
var app = express();

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

app.get('/textslots', function (req, res) {
  User.find({}, function (err, users) {
    async.each(users, function (user, callback) {
      user.textslots = [];
      for (var i = 0; i < user.slots.length; i++) {
        user.textslots.push(user.slots[i].ymd+"@"+user.slots[i].hour);
      }
      user.save(callback)
    }, function (err) {
      res.send(err || users);
    });
  });
});

app.get('/userme', function (req, res) {
  User.findOne({name: "Malcolm Ocean"}, function (err, user) {
    user.friendList = [
      'noah.maccallum'
    ],
    user.slots = [{
      ymd: '2015-02-01',
      hour: 13
    }, {
      ymd: '2015-02-01',
      hour: 14
    }];
    user.save(function (err) {
      res.send(err || user);
    });
  });
});

app.get('/matchfor/:fbusername', function (req, res) {
  User.findOne({fbusername: req.params.fbusername}, function (err, user) {
    User.findOne({
      fbusername: {$in: user.friendList},
      textslots: {$in: },
      friendList: user.fbusername
    }, function (err2, matchuser) {
      res.send({
        user: user,
        matchuser: matchuser,
      })
    })
  });
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'mustache');
app.set('layout', 'layout');
// app.enable('view cache');
app.engine('mustache', require('hogan-express'))

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(cookieSession({ secret: 'secret' }));
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


app.get('/anotherpage', function(req, res, next) {
  res.render('other');
});

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
