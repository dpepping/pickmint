const mongoose = require('mongoose');

const leagueInfoSchema = new mongoose.Schema({
  name: String,
  code: String,
});

const teamInfoSchema = new mongoose.Schema({
  name: String,
  points: Number,
  leagueCode: { type: String, default: null },  // Add this field
});

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true }, // email as username
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  gender: { type: String, enum: ['Male', 'Female'], required: true },
  passwordHash: { type: String, required: true },
  leagues: [leagueInfoSchema],
  teams: [teamInfoSchema],
});


module.exports = mongoose.model('User', userSchema);
