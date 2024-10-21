const { SlashCommandBuilder } = require("discord.js");
const Player = require("../../../mongoDB/Player");
const Guild = require("../../../mongoDB/Guild");

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
  async execute(interaction, client) {
    let guildLang = await Guild.findOne({ guildId: interaction.guild.id });
    if(!guildLang) {
      guildLang = new Guild ({
        guildId: interaction.guild.id,
        lang: "en",
      });
    }
    
    await guildLang.save();

    const lang = require(`../../languages/${guildLang.lang}.json`);
    
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
    const xpNeeded = player.level * 300; // Example: 100 XP needed for level 1, 200 for level 2, etc.
    const progressBarLength = 10; // Length of the progress bar
    const filledLength = Math.floor(
      (player.experience / xpNeeded) * progressBarLength
    );
    const progressBar =
      "🟩".repeat(filledLength) + "⬜".repeat(progressBarLength - filledLength); // Progress bar representation

    // Create an embed message for the profile
    const profileEmbed = {
      title: lang.profileTitle.replace("{user}", userToCheck.username),
      fields: [
        { name: lang.cash, value: `${player.balance.toLocaleString()} 💰`, inline: false },
        { name: lang.level, value: `${player.level.toLocaleString()}`, inline: false },
        {
          name: lang.experience,
          value: `${player.experience.toLocaleString()} / ${xpNeeded.toLocaleString()} XP`,
          inline: false,
        },
        { name: lang.progressLevel, value: progressBar, inline: false },
        {
          name: lang.balloonTitle,
          value: `${player.swag.balloons.toLocaleString()} 🎈`,
          inline: false,
        },
        { name: lang.mobileTitle, value: `${player.swag.mobile.toLocaleString()} 📱`, inline: false },
        
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
    await interaction.reply({ embeds: [profileEmbed] });
  },
};
