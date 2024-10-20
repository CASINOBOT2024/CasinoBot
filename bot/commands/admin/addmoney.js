const { SlashCommandBuilder } = require("discord.js");
const Player = require("../../../mongoDB/Player");
const Guild = require("../../../mongoDB/Guild");


module.exports = {
  data: new SlashCommandBuilder()
    .setName("addmoney")
    .setDescription("Add money to a user")
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("User to whom you want to add money")
        .setRequired(true)
    )
    .addIntegerOption((option) =>
      option
        .setName("amount")
        .setDescription("Amount of money to add")
        .setRequired(true)
    ),
  category: "admin",
  usage: "Add money to a user (creator bot only)",
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
    // Check if the user executing the command is the authorized user
    if (interaction.user.id !== "714376484139040809") {
      return interaction.reply({
        content: lang.onlyCreatorBot,
        ephemeral: true,
      });
    }

    const user = interaction.options.getUser("user");
    const amount = interaction.options.getInteger("amount");

    // Find the player in the database
    let player = await Player.findOne({ userId: user.id });
    if (!player) {
      // If the player doesn't exist, create a new one
      player = new Player({
        userId: user.id,
        balance: 0,
        level: 1,
        experience: 0,
        maxBet: 0,
        swag: {
          balloons: 0,
          mobile: 0,
        },
        lastDaily: 0,
        lastRoulette: 0,
      });
    }

    // Add the amount to the user's balance
    player.balance += amount;

    // Save the updated player data
    await player.save();

    // Send a confirmation message
    return interaction.reply({
      embeds: [
        {
          title: lang.succesfulAddMoneyTitle,
          description: lang.successfulAddMoneyContent
                           .replace('{amount}', amount.toLocaleString())
                           .replace('{user}', user.username),
          color: 0x00ff00,
        },
      ],
    });
  },
};
