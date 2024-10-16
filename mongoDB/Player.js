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
    jamon: { type: Number, default: 0 },
    paella: { type: Number, default: 0 },
    guitarra: { type: Number, default: 0 },
    torero: { type: Number, default: 0 },
    flamenco: { type: Number, default: 0 },
    siesta: { type: Number, default: 0 },
    cava: { type: Number, default: 0 },
    castanuelas: { type: Number, default: 0 },
    sombrero: { type: Number, default: 0 },
    sagradaFamilia: { type: Number, default: 0 },
    soccerBall: { type: Number, default: 0 },
    wine: { type: Number, default: 0 },
    sol: { type: Number, default: 0 },
    spanishFlag: { type: Number, default: 0 },
  },
  lastDaily: { type: Number, default: 0 },
  lastRoulette: { type: Number, default: 0 },
  lastRace: { type: Number, default: 0 },
});

const Player = mongoose.model('Player', PlayerSchema);
module.exports = Player;
