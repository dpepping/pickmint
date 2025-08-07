const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
  name: { type: String, required: true },
  ownerEmail: { type: String, required: true },
  leagueCode: { type: String, default: null }, // Optional league link
  points: { type: Number, default: 0 },
  players: [{
    playerId: String,
    name: String,
    draftedAt: Date
  }]
});

module.exports = mongoose.model('Team', teamSchema);
