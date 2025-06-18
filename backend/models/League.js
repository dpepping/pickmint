const mongoose = require('mongoose');

const leagueTeamSchema = new mongoose.Schema({
  name: String,
  owner: String, // owner's email
});

const leagueSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  owner: { type: String, required: true }, // email of league owner
  participants: [String], // array of participant emails
  teams: [leagueTeamSchema],
});

module.exports = mongoose.model('League', leagueSchema);
