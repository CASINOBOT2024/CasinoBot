const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} = require("discord.js");
const Player = require("../../../mongoDB/Player");

const cooldowns = {};

module.exports = {
  data: new SlashCommandBuilder()
    .setName("crash")
    .setDescription("Play the Crash game")
    .addIntegerOption((option) =>
      option
        .setName("bet")
        .setDescription("Amount of money to bet")
        .setRequired(true)
    ),
  category: "game",
  usage: "Play the Crash game",
  async execute(interaction) {
    // Get the bet amount from the interaction
    const betAmount = interaction.options.getInteger("bet");

    // Retrieve the player from the database
    const player = await Player.findOne({ userId: interaction.user.id });
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
        lastDaily: 0,
        lastRoulette: 0,
      });
      await player.save();
    }

    const currentTime = Date.now();

    // Check if the user is already in a roulette game
    if (
      cooldowns[interaction.user.id] &&
      currentTime < cooldowns[interaction.user.id]
    ) {
      const remainingTime = Math.ceil(
        (cooldowns[interaction.user.id] - currentTime) / 1000
      );
      return interaction.reply({
        embeds: [
          {
            title: "Cooldown Active",
            description: `You need to wait ${remainingTime} seconds before playing roulette again.`,
            color: 0xff0000,
          },
        ],
        ephemeral: true,
      });
    }

    if (betAmount > player.balance) {
      return interaction.reply({
        embeds: [
          {
            title: "Error",
            description: "You do not have enough money to place this bet.",
            color: 0xff0000,
          },
        ],
        ephemeral: true,
      });
    }

    playerData.balance -= betAmount;
    await playerData.save();

    let multiplier = 1.0;
    const crashTime = Math.random() * 15000 + 5000; // Between 5 and 20 seconds
    let crashed = false;

    // Create a row for the cash out button
    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('cashout')
          .setLabel('Cash Out 🛑')
          .setStyle(ButtonStyle.Success)
      );

    // Send initial embed with multiplier
    const initialEmbed = await interaction.reply({
      embeds: [{
        title: 'CRASH 💥',
        description: `Multiplier:\n**x${multiplier.toFixed(1)}**`,
        color: 0x00ff00,
      }],
      components: [row],
      fetchReply: true,
    });

    // Start the multiplier update loop
    const updateMultiplier = setInterval(() => {
      if (!crashed) {
        multiplier += 0.1; // Increment by 0.1

        // Update the embed with the new multiplier
        interaction.editReply({
          embeds: [{
            title: 'CRASH 💥',
            description: `Multiplier:\n**x${multiplier.toFixed(1)}**`,
            color: 0x00ff00,
          }],
          components: [row],
        });
      }
    }, Math.random() * 2000 + 1000); // Update every 1 to 3 seconds

    // Set a timeout for the crash event
    const crashTimeout = setTimeout(() => {
      crashed = true;
      clearInterval(updateMultiplier); // Stop updating multiplier

      // Player loses their bet amount
      interaction.followUp({
        embeds: [{
          title: 'CRASH 💥 - You Lost!',
          description: `Your bet: ${betAmount} 🪙\n\nMultiplier:\n**x${multiplier.toFixed(1)}**\n\nCRASHED!\n\nLost: ${betAmount} 🪙\n\nYour cash: ${playerData.balance} 🪙`,
          color: 0xff0000,
        }],
        components: [], // Remove button after crash
      });
    }, crashTime);

    // Handle cash out button interaction
    const filter = (buttonInteraction) => buttonInteraction.customId === 'cashout' && buttonInteraction.user.id === interaction.user.id;
    const collector = initialEmbed.createMessageComponentCollector({ filter, time: crashTime });

    collector.on('collect', async (buttonInteraction) => {
      crashed = true;
      clearInterval(updateMultiplier); // Stop updating multiplier
      clearTimeout(crashTimeout); // Stop the crash timeout

      // Player wins
      playerData.balance += betAmount * multiplier; // Calculate total cash after cashing out
      await playerData.save();

      // Send winning message
      await buttonInteraction.update({
        embeds: [{
          title: 'CRASH 💥 - You Cashed Out!',
          description: `Your bet: ${betAmount} 🪙\n\nMultiplier:\n**x${multiplier.toFixed(1)}**\n\nYou cashed out successfully!\n\nYour cash: ${playerData.balance} 🪙`,
          color: 0x00ff00,
        }],
        components: [], // Remove button after cash out
      });
    });
  },
};
