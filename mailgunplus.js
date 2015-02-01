var Mailgun = require("mailgun").Mailgun;
// var mg;
var cu = {};
cu.hasArg = function(arg) {
  for (var i=0; i<process.argv.length; i++)
    if (process.argv[i] === arg)
      return true;
  return false;
}

cu.ensureArray = function (stringOrArray) {
  if (!stringOrArray) {
    return [];
  } else if (typeof(stringOrArray) == 'string') {
    return [stringOrArray];
  } else {
    return stringOrArray;
  }
}

cu.isDevel = process.env.RACK_ENV === 'development' || process.env.RACK_ENV === 'staging';
cu.isDryrun = cu.hasArg("dryrun");

function expandMailgun() {
  Mailgun.prototype.sendErrorToMe = function (err, context, object, callback) {
    this.sendText('JustLunchMe ErrorBot <errorbot@justlunch.me>',
    "Malcolm Ocean <malcolm.m.ocean@gmail.com>",
    "JustLunchMe error [" + context + "]",
    "URGENT\n\n" + err.name + " - " + err.message + "\n\n" + JSON.stringify(err, null, '\t') + "\n\n" + JSON.stringify(object, null, '\t') + "\n\n#1PI cmtimesensitive",
    function(err2) {
      err2 && console.log(err2);
      (typeof callback == "function") && callback(err2);
    });
  }

  // TODO remove
  Mailgun.prototype.checkAndSendObject = function (ob, cb) {
    this.checkAndSendHtml(ob.sender, ob.to || ob.recipients || ob.recipient,
      ob.subject, ob.html || ob.body, ob.headers, ob.callback || cb);
  }

  Mailgun.prototype.checkAndSendHtml = function (obj) {

    var params = {};

    if (arguments.length >= 4 && typeof arguments[0] === "string") {
      params.from = arguments[0];
      params.recipients = arguments[1];
      params.subject = arguments[2];
      params.html = arguments[3];

      // Flexible argument magic!
      var args = Array.prototype.slice.call(arguments, 4);
      // Pluck headers.
      if (args[0] && typeof args[0] == 'object')
        params.headers = args.shift() || {};
      // Pluck callback.
      if (args[0] && typeof args[0] == 'function')
        params.callback = args.shift() || null;

    } else if (arguments.length === 1) {
      params.from = obj.from || obj.sender;
      params.recipients = obj.recipients;
      if (!params.recipients) {
        params.to = obj.to;
        params.cc = obj.cc;
        params.bcc = obj.bcc;

      }
      params.subject = obj.subject;
      params.html = obj.html || obj.body;
      params.headers = obj.headers || {};
      params.callback = obj.callback || {};

    } else {
      cu.throwOrEmailError("wrong number of arguments (must be 1 or >=4)", "checkAndSendHtml", arguments)
    }

    if (cu.hasArg("fakesend")) {
      console.log('FAKESEND MODE');
      params.fakesend = true;
    }

    var sendAllowed = false;
    var reciString = (params.recipients || params.to + (params.cc || "")).toString();
    var subject = params.subject;
    if (cu.isDryrun) {
      console.log('DRYRUN sending to ' + reciString + ': "' + subject + '"');
    // } else if (cu.hasArg("onlyto") && !cu.emailIsOnOnlyList(reciString)) {
      // console.log('SPECIFIC SEND; NOT to ' + reciString + ': "' + subject + '"');
    // } else if (process.env.RACK_ENV === 'development' && reciString && !/(malcolm\.m\.ocean)/.test(reciString)) { // don't send on dev unless to me
    //   console.log('DARKSEND to ' + reciString + ': "' + subject + '"');
    } else {
      sendAllowed = true;
    }
    if (!sendAllowed) {
      if (typeof params.callback === "function")
        params.callback();
      return false;
    }
    console.log('SENDING  to ' + reciString + ': "' + params.subject + '"');
    this.sendHtml(params);
  }

  Mailgun.prototype.sendHtml = function (params) {
    var headerString = "";
    for (var h in params.headers) {
      if (params.headers.hasOwnProperty(h)) {
        headerString += '\n' + h + ': ' + params.headers[h];
      }
    }

    var toField = "", ccField = "";
    if (params.recipients) {
      params.recipients = cu.ensureArray(params.recipients);
      toField = params.recipients.join(", ");
    } else if (params.to) {
      params.to = cu.ensureArray(params.to);
      params.cc = cu.ensureArray(params.cc);
      toField = params.to.join(", ");
      ccField = params.cc.join(", ");
      params.recipients = params.to.concat(params.cc);
    }

    var recipientsWithBcc = [];
    if (params.fakesend) {
      params.recipients = ['justlunchmeapp@gmail.com'];
      toField = 'justlunchmeapp@gmail.com';
      ccField = '';
      recipientsWithBcc = ['justlunchmeapp@gmail.com']
    } else {
      recipientsWithBcc = params.recipients.concat(['justlunchmeapp@gmail.com']).concat(cu.ensureArray[params.bcc]);
    }

    // TODO make this unnecessary
    while(recipientsWithBcc[recipientsWithBcc.length-1] === undefined) {
      recipientsWithBcc.pop();
    }

    var rawMsg = 'From: ' + params.from +
      '\nTo: ' + toField +
      (ccField ? ("\nCc: " + ccField) : "") +
      '\nContent-Type: text/html; charset=utf-8' +
      headerString +
      '\nSubject: ' + params.subject.replace("\n", "") +
      '\n\n' + params.html

      console.log("rawMsg", rawMsg);

    this.sendRaw(params.from,
        recipientsWithBcc,
        rawMsg,
        params.callback);
    return true;
  }

  Mailgun.prototype.emailStuffToMe = function (object, callback) {
    if (!object.from) {
      object.from = "JustLunchMe AutoBot <autobot@justlunch.me>"
    }
    object.html = object.html || object.body || JSON.stringify(object)
    object.recipients = "Malcolm Ocean <malcolm.m.ocean@gmail.com>";
    object.callback = function(err) {
      if (err) {
        console.log("emailStuffToMe error: ", err);
        console.log("Subject: " + object.subject);
      }
      callback && callback(err);
    }
    return this.sendHtml(object);
  }

  Mailgun.prototype.replyTo = function (original, reply) {
    // console.log({'In-Reply-To': original['Message-Id']});
    this.sendHtml({from: 'Malcolm Ocean <malcolm@justlunch.me>',
      recipients: original.from,
      subject: replySubject(original.subject),
      html: reply.body,
      headers: {'In-Reply-To': original['Message-Id']}//,
      //function(err) {if (err) this.sendErrorToMe(err, "SENDING REPLY", {original: original, reply: reply})}
    });
  }

  Mailgun.prototype.forwardEmailToMe = function (original, reply) {
    // console.log({'In-Reply-To': original['Message-Id']});
    this.sendHtml({from: 'JustLunchMe Bot <bot@justlunch.me>',
      recipients: ["Malcolm Ocean <malcolm.m.ocean@gmail.com>"],
      subject: replySubject(original.subject),
      html: reply.body,
      headers: {'In-Reply-To': original['Message-Id']}//,
      //function(err) {if (err) this.sendErrorToMe(err, "SENDING REPLY", {original: original, reply: reply})}
    });
  }
}

module.exports = function () {
  // mg = mailgunInstance;
  expandMailgun();
}
