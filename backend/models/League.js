const mongoose = require('mongoose');

const leagueTeamSchema = new mongoose.Schema({
  name: String,
  owner: String,
});

const draftedPlayerSchema = new mongoose.Schema({
  playerId: String,        // internal MongoDB ID (optional)
  externalPlayerId: String,  // <-- the Sportsdata API PlayerID (8-digit string)
  name: String,
});


const leagueSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  owner: { type: String, required: true }, 
  participants: [String],
  teams: [leagueTeamSchema],
  playersDrafted: [draftedPlayerSchema],   // updated drafted players schema
  draftTime: { type: Date },
  groupSize: { type: Number, required: true },

  draftOrder: {
    type: [String],    // array of team IDs (strings)
    default: []
  },

  currentPick: {
    type: Number,
    default: 0
  },

  draftStarted: {
    type: Boolean,
    default: false
  },

  draftDirection: {
    type: String,
    default: 'forward'
  },
});

module.exports = mongoose.model('League', leagueSchema);
