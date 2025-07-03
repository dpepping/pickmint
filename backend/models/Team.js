const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
  name: { type: String, required: true },
  ownerEmail: { type: String, required: true }, // User's email
  leagueCode: { type: String, required: true }, // Which league this team belongs to
  points: { type: Number, default: 0 },

  players: [{
    playerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Player' },
    name: String,
    draftedAt: { type: Date, default: Date.now },
  }]
});

module.exports = mongoose.model('Team', teamSchema);
