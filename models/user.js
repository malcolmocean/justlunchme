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
