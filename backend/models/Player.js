const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
    name: { type: String},
    PlayerID: { type: String, required: true },
});

module.exports = mongoose.model('Player', teamSchema);