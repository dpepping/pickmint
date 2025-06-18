const mongoose = require('mongoose');

const leagueInfoSchema = new mongoose.Schema({
  name: String,
  code: String,
});

const teamInfoSchema = new mongoose.Schema({
  name: String,
  points: Number,
});

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true }, // email used as username
  passwordHash: { type: String, required: true },
  leagues: [leagueInfoSchema],
  teams: [teamInfoSchema],
});

module.exports = mongoose.model('User', userSchema);
