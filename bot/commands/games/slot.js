const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Player = require("../../../mongoDB/Player");
const Guild = require("../../../mongoDB/Guild");

const cooldowns = {};
const SLOT_COOLDOWN = 2000;

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
        lastSlot: 0,
      });
      await playerData.save();
    }

    if(betAmount > 50000) {
      return interaction.reply({
        embeds: [
          {
            title: lang.errorMaxBetTitle,
            description: lang.errorMaxBetContent,
            color: 0xff0000,
          },
        ],
        ephemeral: true,
      });
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
            title: lang.cooldownActiveTitle,
            description: lang.cooldownActiveSecondsContent
                             .replace("{seconds}", remainingTime),
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
            title: lang.errorEnoughMoneyTitle,
            description: lang.errorEnoughMoneyContent,
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
    const symbols = ['🍐','🍎','🍓','🥇','💰','💣','⚜️','🎈','🍒', '🍋', '🍊', '🍉', '🔔', '⭐', '💎']; // Extend this array for more symbols

    // Spin the slot machine
    const spinResults = [
      symbols[Math.floor(Math.random() * symbols.length)],
      symbols[Math.floor(Math.random() * symbols.length)],
      symbols[Math.floor(Math.random() * symbols.length)]
    ];

    // Create an embed for the results
    const slotEmbed = new EmbedBuilder()
      .setColor(0x3498DB)
      .setTitle(lang.slotSpinTitle)
      .setDescription(`${spinResults.join(' | ')}`)
      .setFooter({ text: lang.yourBetWithCoin
                             .replace("{amount}", betAmount.toLocaleString())
                 });

    // Determine winnings
    const winnings = calculateWinnings(spinResults, betAmount);
    if(winnings > 0 ) {
    
    playerData.balance += winnings;

    let experienceGained = 0; // Initialize experience gain variable
    let highestLevelGained = playerData.level; // Track the highest level gained in this session

    // Add experience for winning (reduced to half)
    experienceGained = Math.floor(winnings / 300); // Reduced: 0.5 XP for every 100 currency won
    playerData.experience += experienceGained;
        
    // Level up logic
    const xpNeeded = playerData.level * 300; // Example: 100 XP needed for level 1, 200 for level 2, etc.
    while (playerData.experience >= xpNeeded) {
      playerData.level += 1; // Level up
      playerData.experience -= xpNeeded; // Reduce experience by the required amount
      highestLevelGained = playerData.level; // Update highest level gained
    }
    }
        
    // Update player data in the database
    await playerData.save();
    playerData.lastSlot = Date.now();
    cooldowns[interaction.user.id] = Date.now() + SLOT_COOLDOWN;
    // Update embed with results
    const resultMessage = winnings > 0 
      ? lang.slotSpinResultWin
            .replace("{result}", winnings.toLocaleString())
      : lang.slotSpinResultLost;

    slotEmbed.addFields({ name: lang.resultSpin, value: resultMessage });
    
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
    return betAmount * 3.5; // 3 diamonds win 3.5x the bet
  } else if (symbolCount['💎'] === 2) {
    return betAmount * 2.5; // 2 diamonds win 2.5x the bet
  } else if (symbolCount['💎'] === 1) {
    return betAmount * 1.5; // 1 diamond wins 1.5x the bet
  }

  // Check for other winning combinations
  if (symbolCount[results[0]] === 3) {
    return betAmount * 1; // Example: 3 of a kind wins 1x the bet
  } else if (symbolCount[results[0]] === 2) {
    return betAmount; // Example: 2 of a kind wins the bet
  }

  return 0; // No winnings
}
