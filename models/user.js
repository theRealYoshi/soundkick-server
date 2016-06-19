var mongoose = require('mongoose');

// var databaseSchema = new mongoose.Schema({
//   databaseId: { type: String, unique: true, index: true },
//   name: String,
//   race: String,
//   gender: String,
//   bloodline: String,
//   wins: { type: Number, default: 0 },
//   losses: { type: Number, default: 0 },
//   reports: { type: Number, default: 0 },
//   random: { type: [Number], index: '2d' },
//   voted: { type: Boolean, default: false }
// });

var userSchema = new mongoose.Schema({
  userID: { type: String, unique: true, index: true},
  accessToken: { type: String, unique: true, default: null},// should I hash this?
  location: { type: String, default: '' },
  zipCode: { type: Number, default: null}
  //userName, 
});

module.exports = mongoose.model('Users', userSchema);
