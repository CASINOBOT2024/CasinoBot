const { SlashCommandBuilder } = require("discord.js");
const Player = require("../../../mongoDB/Player");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("daily")
    .setDescription("Collect your daily reward of 10,000 coins"),
  category: "economy",
  usage: "Collect your daily coins",
  async execute(interaction, client) {
    const rewardAmount = 10000;

    let player = await Player.findOne({ userId: interaction.user.id });
    if (!player) {
      // If the player doesn't exist, create a new one
      player = new Player({
        userId: interaction.user.id,
        balance: 0,
        level: 1,
        experience: 0,
        maxBet: 0,
        swag: {
          balloons: 0,
          mobile: 0,
        },
        lastDaily: null,
      });
      await player.save();
    }

    const currentTime = new Date();
    const cooldownTime = 86400000; // 24 hours in milliseconds

    // Check if the player can collect the daily reward
    if (player.lastDaily && currentTime - player.lastDaily < cooldownTime) {
      const timeLeft = cooldownTime - (currentTime - player.lastDaily);
      const hours = Math.floor((timeLeft / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((timeLeft / (1000 * 60)) % 60);
      const seconds = Math.floor((timeLeft / 1000) % 60);

      return interaction.reply({
        embeds: [
          {
            title: "Cooldown",
            description: `You need to wait **${hours}h ${minutes}m ${seconds}s** before collecting your daily reward again.`,
            color: 0xff0000,
          },
        ],
        ephemeral: true,
      });
    }

    // Update the player's balance and lastDaily time
    player.balance += rewardAmount;
    player.lastDaily = currentTime;
    await player.save();

    // Send a success message
    return interaction.reply({
      embeds: [
        {
          title: "Daily Reward Collected!",
          description: `You have collected **${rewardAmount.toLocaleString()} 💰** coins!`,
          color: 0x00ff00,
        },
      ],
    });
  },
};
