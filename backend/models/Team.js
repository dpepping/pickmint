const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
  name: { type: String, required: true },
  ownerEmail: { type: String, required: true },
  leagueCode: { type: String, default: null }, // Optional league link
  points: { type: Number, default: 0 },
  players: [{
    playerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Player' },
    name: String,
    draftedAt: Date
  }]
});

module.exports = mongoose.model('Team', teamSchema);
