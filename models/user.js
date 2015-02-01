var mongoose = require('mongoose');

var UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  joinstamp: { type: Number, default: Date.now },
  lastauthstamp: {type: Number, default: Date.now },
  lunchList: [{
    name: String,
    email: {type: String, required: true}
  }],
  slots: [{
    title: { type: String },
    start: { type: String },
    end: { type: String }
  }],
  textslots: [String],
});

mongoose.model('User', UserSchema);


function time2bit (startTime, endTime) {
  var hour = 10;
  var minute = '00';
  var bitMask = 0;
  var avail = false;
  for (i=0; i<20; i++){
    if (i%2 == 0) {
      minute = '00';
    } else {
      minute = '30';
    }
    hour = hour +i;
    time = hour + minute;

    if (time == startTime) {
      avail = true;
    }
    if (time == endTime) {
      return bitMask;
    }
    if (avail) {
      bitMask += 1<<i;
    }
  }
}
