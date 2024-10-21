const { SlashCommandBuilder } = require("discord.js");
const Player = require("../../../mongoDB/Player");
const Guild = require("../../../mongoDB/Guild");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("gift")
    .setDescription("Gift money to another user")
    .addUserOption((option) =>
      option
        .setName("recipient")
        .setDescription("The user to whom you want to gift money")
        .setRequired(true)
    )
    .addIntegerOption((option) =>
      option
        .setName("amount")
        .setDescription("The amount of money to gift")
        .setRequired(true)
    ),
  category: "users",
  usage: "Gift money to another user",
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
    
    const recipient = interaction.options.getUser("recipient");
    const amount = interaction.options.getInteger("amount");
    const senderId = interaction.user.id;

    // Fetch sender's data
    let sender = await Player.findOne({ userId: senderId });
    if (!sender) {
      sender = new Player({
        userId: senderId,
        balance: 0,
        level: 1,
        experience: 0,
        maxBet: 0,
        swag: {
          balloons: 0,
          mobile: 0,
        },
        lastDaily: 0,
        lastSlot: 0,
      });
      await sender.save();
    }

    // Fetch recipient's data
    let recipientData = await Player.findOne({ userId: recipient.id });
    if (!recipientData) {
      return interaction.reply({
        embeds: [
          {
            title: lang.giftAccountNotExistTitle,
            description: lang.giftAccountNotExistContent,
            color: 0xff0000,
          },
        ],
        ephemeral: true,
      });
    }

    // Check if the sender has enough balance
    if (amount > sender.balance) {
      return interaction.reply({
        embeds: [
          {
            title: lang.giftSenderNotHaveMoneyTitle,
            description: lang.giftSenderNotHaveMoneyContent,
            color: 0xff0000,
          },
        ],
        ephemeral: true,
      });
    }

    // Perform the transfer
    sender.balance -= amount; // Subtract the amount from the sender's balance
    recipientData.balance += amount; // Add the amount to the recipient's balance

    // Save the updated data for both users
    await sender.save();
    await recipientData.save();

    // Respond to the interaction
    return interaction.reply({
      embeds: [
        {
          title: lang.giftSucTitle,
          description: lang.giftSucContent
                           .replace("{amount}", amount.toLocaleString())
                           .replace("{user}", recipient.username),
          color: 0x00ff00,
        },
      ],
    });
  },
};
