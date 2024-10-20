const mongoose = require('mongoose');

const GuildSchema = new mongoose.Schema({
  guildId: { type: Number, required: true, unique: true },
  lang: { type: String, required: true },
});

const Guild = mongoose.model('Guild', GuildSchema);
module.exports = Guild;
