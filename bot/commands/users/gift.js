const { SlashCommandBuilder } = require("discord.js");
const Player = require("../../../mongoDB/Player");

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
    const recipient = interaction.options.getUser("recipient");
    const amount = interaction.options.getInteger("amount");
    const senderId = interaction.user.id;

    // Fetch sender's data
    let sender = await Player.findOne({ userId: senderId });
    if (!sender) {
      return interaction.reply({
        embeds: [
          {
            title: "Error",
            description: "You do not have an account. Please create one first.",
            color: 0xff0000,
          },
        ],
        ephemeral: true,
      });
    }

    // Fetch recipient's data
    let recipientData = await Player.findOne({ userId: recipient.id });
    if (!recipientData) {
      return interaction.reply({
        embeds: [
          {
            title: "Error",
            description: "The recipient does not have an account.",
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
            title: "Error",
            description: "You do not have enough money to gift this amount.",
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
          title: "Gift Successful",
          description: `You have successfully gifted ${amount.toLocaleString()} 💰 to ${recipient.username}.`,
          color: 0x00ff00,
        },
      ],
    });
  },
};
