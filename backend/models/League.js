const mongoose = require('mongoose');

const leagueTeamSchema = new mongoose.Schema({
  name: String,           // Team name
  owner: String,          // owner's email
});

const draftedPlayerSchema = new mongoose.Schema({
  playerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Player' },
  name: String,
});

const leagueSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  owner: { type: String, required: true }, // email of league creator
  participants: [String],                 // participant emails
  teams: [leagueTeamSchema],
  playersDrafted: [draftedPlayerSchema],   // Track drafted players for THIS league
  draftTime: { type: Date },
});

module.exports = mongoose.model('League', leagueSchema);
