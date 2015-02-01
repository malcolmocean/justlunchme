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

var time2bit = require('./models/user').time2bit;
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

app.get('/emailuser/:email', function (req, res) {
  User.findOne({email: req.params.email}, function (err, user) {
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

var emailNonUser = function (email, inviterName) {
  mg.checkAndSendHtml({
    from: "JustLunch.Me <hi@justlunch.me>",
    to: email,
    subject: inviterName + " wants to go for lunch with you :)",
    html: "Hi,",
    html: "Hello<!--name-->!" +
      "Your friend " + inviterName + " has kindly expressed an interest in catching up with you over lunch. " +
      "We’re JustLunchMe, a helpful new webapp from the University of Waterloo, and we’d like to help. All we need is 60 seconds of your time, and we’ll let you know when you’ve both got a free slot to have lunch. Plus, as you add friends we will recommend you lunch meetings whenever you’re available. " +
      "Just go to <a href='http://www.justlunch.me'>JustLunch.me</a> - hope to see you there!" +
      "<p>Sincerely,<br>" +
      "The JustLunch.me team</p>",
    headers: {},
    callback: function(errm) {
      res.send({err: errm, result: !errm && "success"});
    }
  });
}

var emailExistingUser = function (email, inviterName) {
  mg.checkAndSendHtml({
    from: "JustLunch.Me <hi@justlunch.me>",
    to: email,
    subject: inviterName + " wants to go for lunch with you :)",
    html: "Hi,",
    html: "Hello<!--name-->!" +
      "Your friend " + inviterName + " has kindly expressed an interest in catching up with you over lunch. " +
      "We’re JustLunchMe, a helpful new webapp from the University of Waterloo, and we’d like to help. All we need is 60 seconds of your time, and we’ll let you know when you’ve both got a free slot to have lunch. Plus, as you add friends we will recommend you lunch meetings whenever you’re available. " +
      "Just go to <a href='http://www.justlunch.me'>JustLunch.me</a> - hope to see you there!" +
      "<p>Sincerely,<br>" +
      "The JustLunch.me team</p>",
    headers: {},
    callback: function(errm) {
      res.send({err: errm, result: !errm && "success"});
    }
  });
}

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
app.set('layout', 'layout_pratt');

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
    user: req.user,
  });
});

app.post('/userJustAuthed', function (req, res) {
  User.findOne({email: req.body.email}, function (err, existingUser) {
    if (err) {
      res.status(500).send(err);
    } else if (existingUser) {
      existingUser.name = req.body.name || existingUser.name;
      existingUser.lastauthstamp = Date.now();
      existingUser.save(function (errs) {
        res.send(existingUser);
      })
    } else {
      var user = new User({
        name: req.body.name,
        email: req.body.email,
        lastauthstamp: Date.now()
      });
      user.save(function (errs) {
        res.send({result: "new user"});
      });
    }
  });
});

app.get('/:email/notifications.json', /* PERM */ function (req, res) {
  User.find({friendsByEmail: req.params.email}, "name email", function (err, users) {
    res.send(users);
  });
});

process.env.RACK_ENV === "development" && app.get('/:email/model', function (req, res) {
  User.findOne({email: req.params.email}, function (err, user) {
    res.send(err || user);
  });
});

app.get('/:email/lunchList', function (req, res) {
  User.findOne({email: req.params.email}, "lunchList", function (err, user) {
    res.send(err || (user ? user.lunchList : []));
  });
});

app.delete('/:email/lunchList/:otherEmail', function (req, res) {
  User.findOneAndUpdate({email: req.params.email}, {$pull: {lunchList: {email: req.params.otherEmail}}}, function (err, data) {
    res.status(err ? 500 : 204).send();
  });
});

// app.get('/:email/delete', function (req, res) {
//   User.find({ email: req.params.email }).remove(function (err) {
//     res.send(err || "success");
//   })
// });

app.post('/:email/add', function (req, res) {
  User.findOne({email: req.params.email}, function (err, user) {
    var mt = req.body.email.match(/^[^<]*<?([^>]*)>?.*$/);
    var rawEmail = mt[1] || mt[0];
    User.findOne({email: rawEmail}, function (erra, alreadyUser) {
      if (erra) {
        res.send(500, err);
      } else {
        if (alreadyUser) {
          var hasCurrentUser = false;
          for (var i = 0; i < alreadyUser.lunchList.length; i++) {
            if (alreadyUser.lunchList[i].email == user.email) {
              hasCurrentUser = true;
              break;
            }
          }
          if (!hasCurrentUser) {
            // emailExistingUser(req.body.email, user.name);
          }
        } else {
          // emailNonUser(req.body.email, user.name);
        }
        // user.lunchList = [];
        user.slots = [];
        user.lunchList.push({
          name: req.body.name,
          email: req.body.email
        });
        user.save(function (err) {
          res.status(err ? 500 : 200).send(err || "");
          console.log("err", err);
        });
      }
    });
  });
});

app.get('/:email/timeslots', function (req, res) {
  User.findOne({email: req.params.email}, function (err, user) {
    res.send(user.slots);
  });
});

app.post('/:email/allTimeslots', function (req, res) {
  User.findOne({email: req.params.email}, function (err, user) {
    console.log("req.body", req.body);
    console.log("========================================");
    user.slots = req.body;
    user.save(function (err) {
      res.status(err ? 500 : 200).send(err || "");
      console.log("err", err);
    });
  });
});

app.post('/:email/timeslot', function (req, res) {
  User.findOne({email: req.params.email}, function (err, user) {
    console.log("req.body", req.body);
    console.log("========================================");
    user.slots.push(req.body);
    user.save(function (err) {
      res.status(err ? 500 : 200).send(err || "");
      console.log("err", err);
    });
  });
});

app.post('/:email/deletetimeslot', function (req, res) {
  User.findOneAndUpdate({email: req.params.email}, {$pull: {slots: {start: req.body.start, end: req.body.end}}}, function (err, data) {
    res.status(err ? 500 : 204).send();
  });
  // User.findOne({email: req.params.email}, function (err, user) {
  //   console.log("req.body", req.body);
  //   console.log("========================================");
  //   user.slots.push(req.body);
  //   user.save(function (err) {
  //     res.status(err ? 500 : 200).send(err || "");
  //     console.log("err", err);
  //   });
  // });
});

app.get('/account', ensureAuthenticated, function(req, res) {
  console.log(req.user);
  res.render('account', { user: req.user });
});

app.get('/login', function(req, res){
  res.render('login', { user: req.user });
});

//app.get('/auth/google', passport.authenticate('google',{scope: 'https://www.googleapis.com/auth/plus.me https://www.google.com/m8/feeds https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile'}));

app.post('/auth/google/callback', passport.authenticate('google'), function(req, res) {
    // Return user back to client
    console.log('callback');
    res.send(req.user);
});

app.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});

app.get('/match', matchingService);

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    console.log("AUTHENTICATED");
    return next();
  }
  console.log("MUST LOGIN");
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

function matchTimeSlots(slotsA, slotsB) {
  for (i=0; i<slotsA.length; i++) {
    for (j=0; j<slotsB.length; j++) {
      var isMatch = matchTimeSlot(slotsA[i], slotsB[j]);
      if (isMatch) {
        return true;
      }
    }
  }
}

function matchTimeSlot(slotA, slotB){
  if (!(slotA.start && slotB.end)) {
    return false;
  }
  if (slotA.start.substring(0, 10) != slotB.end.substring(0, 10)) {
    return false;
  }

  return true;
}

function matchingService(req, res) {

  // Need a MongoDB query similar to the following SQL Query:
  // Todays_Candidates = SELECT (
  //   string ID,
  //   string Name,
  //   array Availability_Vector,
  //   bool Avail_today,
  //   float Duration_Available,
  //   bool isMatched,
  //   string PartnerId )
  // Where Avail_today == True
  // ORDER BY Duration_Available, #of Lunch List ASC;
  // The candidates with the least availability occur at the top of the list and will get matched first.

  User.find({}, function (err, users) {

    async.each(users, function (user, next) {
      var okayEmails = [];
      for (var i=0;i<user.lunchList.length; i++) {
        okayEmails.push(user.lunchList[i].email);
      }

      user.isMatched = false;


      // User.find({email: {$in: okayEmails}, lunchList.email: user.email}, function (err, docs) {
      User.find({email: {$in: okayEmails}}, function (err, friends) {
        user.friends = friends;
        var mutual_avail_friends = [];
        for (i=0; i<friends.length; i++) {
          if (matchTimeSlots(user.slots, friends[i].slots)) {
            mutual_avail_friends.push(friends[i]);
          }
        }
        user.mutual_avail_friends = mutual_avail_friends;

        next();
      });
    }, function (err) {
      var matches = {A: [], B: []};

      for (i=0; i<users.length; i++) {
        if (!users[i].isMatched) {

          for (j=0; j<users[i].mutual_avail_friends.length; j++) {
            friend = users[i].mutual_avail_friends[j];

            if (!friend.isMatched) {
              users[i].isMatched = true;
              users[i].partnerEmail = friend.email;

              var result  = users.filter(function(o){return o.email == friend.email;} );
              result.isMatched = true;
              result.partnerEmail = users[i].email;

              matches.A.push(users[i]);
              matches.B.push(friend);
            }
          }
        }
      }
      res.send(matches);


    });
  });
}



console.log("started Successfully");
