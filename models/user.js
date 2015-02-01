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
});

UserSchema.virtual('bitslots').get(function () {
  var result = {};
  for (var i in this.slots) {
    var slot = this.slots[i];
    var ymd = slot.substr(0, 10);
    var t2b = time2bit(slot.start, slot.end);
  }
});

mongoose.model('User', UserSchema);

var time2bit = function (startTime, endTime) {
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
  return bitMask;
}
module.exports = {
  time2bit: time2bit
};
