const mongoose = require('mongoose');

const PlayerSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  balance: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
  experience: { type: Number, default: 0 },
  maxBet: { type: Number, default: 0 },
  swag: {
    balloons: { type: Number, default: 0 },
    mobile: { type: Number, default: 0 },
  },
  lastDaily: { type: Number, default: 0 },
  lastRoulette: { type: Number, default: 0 },
  lastRace: { type: Number, default: 0 },
});

const Player = mongoose.model('Player', PlayerSchema);
module.exports = Player;
