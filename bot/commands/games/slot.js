const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Player = require("../../../mongoDB/Player");

const cooldowns = {};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('slot')
    .setDescription('Play the slot machine with a bet!')
    .addIntegerOption(option =>
      option.setName('bet')
        .setDescription('Amount to bet')
        .setRequired(true)
    ),
  category: 'games',
  usage: "Play the slot machine with a bet!",
  async execute(interaction, client) {
    const betAmount = interaction.options.getInteger('bet');

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

    // Deduct the bet from the player's balance
    playerData.balance -= betAmount;
    await playerData.save();

    // Slot machine symbols
    const symbols = ['🍒', '🍋', '🍊', '🍉', '🔔', '⭐', '💎']; // Extend this array for more symbols

    // Spin the slot machine
    const spinResults = [
      symbols[Math.floor(Math.random() * symbols.length)],
      symbols[Math.floor(Math.random() * symbols.length)],
      symbols[Math.floor(Math.random() * symbols.length)]
    ];

    // Create an embed for the results
    const slotEmbed = new EmbedBuilder()
      .setColor(0x3498DB)
      .setTitle('🎰 Slot Machine Spin!')
      .setDescription(`${spinResults.join(' | ')}`)
      .setFooter({ text: `You bet: ${betAmount} 🪙` });

    // Determine winnings
    const winnings = calculateWinnings(spinResults, betAmount);
    playerData.balance += winnings;

    // Update player data in the database
    await playerData.save();

    // Update embed with results
    const resultMessage = winnings > 0 
      ? `🎉 You win! You gained: ${winnings} 🪙.`
      : `😢 You lose! Better luck next time!`;

    slotEmbed.addFields({ name: 'Result', value: resultMessage });
    
    // Reply with the embed
    await interaction.reply({ embeds: [slotEmbed] });
  },
};

// Function to calculate winnings based on slot results
function calculateWinnings(results, betAmount) {
  // Winning conditions: 3 of a kind, 2 of a kind, or specific combinations
  const symbolCount = {};
  results.forEach(symbol => {
    symbolCount[symbol] = (symbolCount[symbol] || 0) + 1;
  });

  // Check for diamonds
  if (symbolCount['💎'] === 3) {
    return betAmount * 50; // 3 diamonds win 50x the bet
  } else if (symbolCount['💎'] === 2) {
    return betAmount * 5; // 2 diamonds win 5x the bet
  } else if (symbolCount['💎'] === 1) {
    return betAmount * 1.5; // 1 diamond wins 1.5x the bet
  }

  // Check for other winning combinations
  if (symbolCount[results[0]] === 3) {
    return betAmount * 10; // Example: 3 of a kind wins 10x the bet
  } else if (symbolCount[results[0]] === 2) {
    return betAmount * 2; // Example: 2 of a kind wins 2x the bet
  }

  return 0; // No winnings
}
