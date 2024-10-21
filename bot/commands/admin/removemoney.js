const { SlashCommandBuilder } = require("discord.js");
const Player = require("../../../mongoDB/Player");
const Guild = require("../../../mongoDB/Guild");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("removemoney")
    .setDescription("Remove a specified amount of money from a user's balance")
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("The user from whom to remove money")
        .setRequired(true)
    )
    .addIntegerOption((option) =>
      option
        .setName("amount")
        .setDescription("The amount of money to remove")
        .setRequired(true)
    ),
  category: "admin",
  usage: "Remove money from a user's balance (creator bot only)",
  async execute(interaction) {
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

    const targetUser = interaction.options.getUser("user");
    const amount = interaction.options.getInteger("amount");

    // Fetch target user's data
    let targetPlayer = await Player.findOne({ userId: targetUser.id });
    if (!targetPlayer) {
      return interaction.reply({
        embeds: [
          {
            title: lang.userNotFoundOnDataBaseTitle,
            description: lang.userNotFoundOnDataBaseContent
                             .replace("{user}", targetPlayer.id),
            color: 0xff0000,
          },
        ],
        ephemeral: true,
      });
    }

    // Check if the amount to remove is valid
    if (amount <= 0) {
      return interaction.reply({
        embeds: [
          {
            title: lang.amountErrorNumberTitle,
            description: lang.amountErrorNegativeNumberContent,
            color: 0xff0000,
          },
        ],
        ephemeral: true,
      });
    }

    // Remove the money from the target user's balance
    if (targetPlayer.balance < amount) {
      return interaction.reply({
        embeds: [
          {
            title: lang.amountErrorNumberTitle,
            description: lang.userNotHaveMoney,
            color: 0xff0000,
          },
        ],
        ephemeral: true,
      });
    }

    targetPlayer.balance -= amount; // Deduct the amount from the user's balance
    await targetPlayer.save(); // Save the updated user data

    // Confirm the removal
    return interaction.reply({
      embeds: [
        {
          title: lang.moneyRemovedTitle,
          description: lang.moneyRemovedTitle
                           .replace("{amount}", amount.toLocaleString())
                           .replace("{user}", targetUser.username),
          color: 0x00ff00,
        },
      ],
    });
  },
};
