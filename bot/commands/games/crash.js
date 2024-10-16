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
    .setName('crash')
    .setDescription('Play Crash with a bet!')
    .addIntegerOption(option =>
      option.setName('bet')
        .setDescription('Amount to bet')
        .setRequired(true)
    ),
  category: 'game',
  async execute(interaction, client) {
    const betAmount = interaction.options.getInteger('bet');

    // Fetch player data from the database
    const playerData = await Player.findOne({ userId: interaction.user.id });
    if (!playerData) {
      // If the player doesn't exist, create a new one
      playerData = new Player({
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
      await playerData.save();
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

    if (betAmount > playerData.balance) {
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

    // Update player's balance
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
    await interaction.reply({
      embeds: [{
        title: 'CRASH 💥',
        description: `Multiplier:\n**x${multiplier.toFixed(1)}**`,
        color: 0x00ff00,
      }],
      components: [row],
    });

    const initialMessage = await interaction.fetchReply(); // Fetch the reply message

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
    const crashTimeout = setTimeout(async () => {
      crashed = true;
      clearInterval(updateMultiplier); // Stop updating multiplier

      // Player loses their bet amount
      await interaction.followUp({
        embeds: [{
          title: 'CRASH 💥 - You Lost!',
          description: `Your bet: **${betAmount} 🪙**\n\nMultiplier:\n**x${multiplier.toFixed(1)}**\n\nCRASHED!\n\nLost: **${betAmount}** 🪙\n\nYour cash: **${playerData.balance.toLocaleString()} 🪙**`,
          color: 0xff0000,
        }],
        components: [], // Remove button after crash
      });
    }, crashTime);

    // Handle cash out button interaction
    const filter = (buttonInteraction) => buttonInteraction.customId === 'cashout' && buttonInteraction.user.id === interaction.user.id;
    const collector = initialMessage.createMessageComponentCollector({ filter, time: crashTime });

    collector.on('collect', async (buttonInteraction) => {
      crashed = true;
      clearInterval(updateMultiplier); // Stop updating multiplier
      clearTimeout(crashTimeout); // Stop the crash timeout

      // Player wins
      playerData.balance += betAmount * multiplier; // Calculate total cash after cashing out
      await playerData.save();
      
      const won = betAmount * multiplier;
      // Send winning message
      await buttonInteraction.update({
        embeds: [{
          title: 'CRASH 💥 - You Cashed Out!',
          description: `Your bet: **${betAmount} 🪙**\n\nMultiplier:\n**x${multiplier.toFixed(1)}**\n\nYou won: **${Math.trunc(won).toLocaleString()}**\n\nYour cash: **${playerData.balance.toLocaleString()} 🪙**`,
          color: 0x00ff00,
        }],
        components: [], // Remove button after cash out
      });
    });
  },
};

