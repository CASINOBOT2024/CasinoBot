const { SlashCommandBuilder } = require("discord.js");
const Player = require("../../../mongoDB/Player");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("profile")
    .setDescription("Check a user's profile, including balance and stats")
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("The user whose profile you want to check")
    ),
  category: "users",
  usage: "Check a user's profile information",
  async execute(interaction, client) {
    // Get the user to check, or default to the command executor
    const userToCheck = interaction.options.getUser("user") || interaction.user;

    let player = await Player.findOne({ userId: userToCheck.id });
    if (!player) {
      // If the player doesn't exist, create a new one
      player = new Player({
        userId: userToCheck.id,
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

    // Calculate experience needed for the next level
    const xpNeeded = player.level * 100; // Example: 100 XP needed for level 1, 200 for level 2, etc.
    const progressBarLength = 12; // Length of the progress bar
    const filledLength = Math.floor(
      (player.experience / xpNeeded) * progressBarLength
    );
    const progressBar =
      "🟩".repeat(filledLength) + "⬜".repeat(progressBarLength - filledLength); // Progress bar representation

    // Create an embed message for the profile
    const profileEmbed = {
      title: `${userToCheck.username}'s Profile`,
      fields: [
        { name: "Cash", value: `${player.balance.toLocaleString()} 💰`, inline: false },
        { name: "Level", value: `${player.level.toLocaleString()}`, inline: false },
        {
          name: "Experience",
          value: `${player.experience.toLocaleString()} / ${xpNeeded.toLocaleString()} XP`,
          inline: false,
        },
        { name: "Progress to next level:", value: progressBar, inline: false },
        {
          name: "Balloons",
          value: `${player.swag.balloons.toLocaleString()} 🎈`,
          inline: false,
        },
        { name: "Mobiles", value: `${player.swag.mobile.toLocaleString()} 📱`, inline: false },
        
      ],
      color: 0x3498db,
      thumbnail: {
        url: userToCheck.displayAvatarURL(), // Foto de perfil del usuario chequeado
      },
      footer: {
        text: interaction.user.username,
        icon_url: interaction.user.displayAvatarURL(),
      },
    };

    // Send the embed message
    return interaction.reply({ embeds: [profileEmbed] });
  },
};
