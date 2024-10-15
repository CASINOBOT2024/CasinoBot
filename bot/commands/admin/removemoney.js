const { SlashCommandBuilder } = require("discord.js");
const Player = require("../../../mongoDB/Player");

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
  usage: "Remove money from a user's balance (admin only)",
  async execute(interaction) {
    // Check if the user executing the command is the authorized user
    if (interaction.user.id !== "714376484139040809") {
      return interaction.reply({
        embeds: [
          {
            title: "Unauthorized",
            description: "You do not have permission to use this command.",
            color: 0xff0000,
          },
        ],
        ephemeral: true, // Only the user who executed the command sees this message
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
            title: "Error",
            description: "The specified user does not have an account.",
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
            title: "Error",
            description: "The amount must be a positive number.",
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
            title: "Error",
            description:
              "The user does not have enough balance to remove that amount.",
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
          title: "Money Removed",
          description: `${amount.toLocaleString()} 💰 has been successfully removed from ${targetUser.username}'s balance.`,
          color: 0x00ff00,
        },
      ],
    });
  },
};
