var mongoose = require('mongoose');

var UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  fbusername: { type: String, required: true },
  friendList: [String],
  slots: [{
    ymd: { type: String, required: true},
    hour: { type: Number, required: true}
  }],
  textslots: [String],
});

mongoose.model('User', UserSchema);
