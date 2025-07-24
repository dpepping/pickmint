const mongoose = require('mongoose');

const leagueTeamSchema = new mongoose.Schema({
  name: String,           
  owner: String,          
});

const draftedPlayerSchema = new mongoose.Schema({
  playerId: String,
  name: String,
});

const leagueSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  owner: { type: String, required: true }, 
  participants: [String],                 
  teams: [leagueTeamSchema],
  playersDrafted: [draftedPlayerSchema],   
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
