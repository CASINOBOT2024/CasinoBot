const { SlashCommandBuilder } = require("discord.js");
const Player = require("../../../mongoDB/Player");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("sell")
    .setDescription("Sell your balloons and mobiles for coins")
    .addStringOption((option) =>
      option
        .setName("item")
        .setDescription("Choose an item to sell")
        .setRequired(true)
        .addChoices(
          { name: "Balloon", value: "balloon" },
          { name: "Mobile", value: "mobile" }
        )
    )
    .addIntegerOption((option) =>
      option
        .setName("quantity")
        .setDescription("Amount of items to sell")
        .setRequired(true)
    ),
  category: "economy",
  usage: "Sell an item to gain coins",
  async execute(interaction, client) {
    const item = interaction.options.getString("item");
    const quantity = interaction.options.getInteger("quantity");

    let player = await Player.findOne({ userId: interaction.user.id });
    if (!player) {
      return interaction.reply({
        embeds: [
          {
            title: "Error",
            description: "You do not have any items to sell.",
            color: 0xff0000,
          },
        ],
        ephemeral: true,
      });
    }

    let amountGained = 0; // Amount gained from selling

    if (item === "balloon") {
      if (player.swag.balloons >= quantity) {
        player.swag.balloons -= quantity; // Decrease the number of balloons
        amountGained = quantity * 50; // Amount gained from selling balloons
      } else {
        return interaction.reply({
          embeds: [
            {
              title: "Error",
              description: `You do not have enough balloons. You only have ${player.swag.balloons}.`,
              color: 0xff0000,
            },
          ],
          ephemeral: true,
        });
      }
    } else if (item === "mobile") {
      if (player.swag.mobile >= quantity) {
        player.swag.mobile -= quantity; // Decrease the number of mobiles
        amountGained = quantity * 200; // Amount gained from selling mobiles
      } else {
        return interaction.reply({
          embeds: [
            {
              title: "Error",
              description: `You do not have enough mobiles. You only have ${player.swag.mobile}.`,
              color: 0xff0000,
            },
          ],
          ephemeral: true,
        });
      }
    }

    player.balance += amountGained; // Add the gained amount to the player's balance
    await player.save(); // Save the updated player data

    return interaction.reply({
      embeds: [
        {
          title: "Sale Successful!",
          description: `You sold ${quantity.toLocaleString()} ${
            item === "balloon" ? "balloon" : "mobile"
          }${quantity > 1 ? "s" : ""} for ${amountGained.toLocaleString()} 💰.`,
          fields: [
            {
              name: "New Balance",
              value: `${player.balance.toLocaleString()} 💰`,
              inline: false,
            },
            {
              name: "Balloons",
              value: `${player.swag.balloons.toLocaleString()} 🎈`,
              inline: false,
            },
            {
              name: "Mobiles",
              value: `${player.swag.mobile.toLocaleString()} 📱`,
              inline: false,
            },
          ],
          color: 0x00ff00,
        },
      ],
    });
  },
};
