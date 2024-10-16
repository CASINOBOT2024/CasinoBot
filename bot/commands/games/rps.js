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
    .setName('rps')
    .setDescription('Play Rock Paper Scissors with a bet!')
    .addIntegerOption(option =>
      option.setName('bet')
        .setDescription('Amount to bet')
        .setRequired(true)
    ),
  category: 'games',
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

    // Create buttons for Rock, Paper, Scissors
    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder().setCustomId('rock').setLabel('🪨 Rock').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('paper').setLabel('📄 Paper').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('scissors').setLabel('✂️ Scissors').setStyle(ButtonStyle.Primary),
      );

    // Send the initial message with options
    await interaction.reply({
      content: 'Choose your move!',
      components: [row],
    });

    const message = await interaction.fetchReply(); // Fetch the reply message

    // Filter for button interactions
    const filter = (buttonInteraction) => {
      return buttonInteraction.user.id === interaction.user.id;
    };

    const collector = message.createMessageComponentCollector({ filter, time: 60000 }); // 60 seconds for selection

    collector.on('collect', async (buttonInteraction) => {
      const userChoice = buttonInteraction.customId;
      const botChoice = ['rock', 'paper', 'scissors'][Math.floor(Math.random() * 3)];

      let result;
      if (userChoice === botChoice) {
        result = 'It\'s a tie! 🤝';
        playerData.balance += betAmount; // Refund bet
      } else if (
        (userChoice === 'rock' && botChoice === 'scissors') ||
        (userChoice === 'paper' && botChoice === 'rock') ||
        (userChoice === 'scissors' && botChoice === 'paper')
      ) {
        result = 'You win! 🎉';
        playerData.balance += betAmount * 2; // Double the bet
      } else {
        result = 'You lose! 😢';
      }

      await playerData.save(); // Update player balance in the database

      await buttonInteraction.update({
        content: `You chose: ${userChoice}\nBot chose: ${botChoice}\n\n${result}\nYour new balance: ${playerData.balance} 🪙`,
        components: [], // Disable buttons after interaction
      });

      collector.stop(); // Stop the collector after handling the choice
    });

    collector.on('end', async (collected) => {
      if (collected.size === 0) {
        await message.edit({
          content: 'Time is up! You didn\'t make a choice.',
          components: [],
        });
      }
    });
  },
};
