const { SlashCommandBuilder } = require("discord.js");
const Player = require("../../../mongoDB/Player");
const Guild = require("../../../mongoDB/Guild");

const horses = [
  { emoji: "🐎" },
  { emoji: "🎠" },
  { emoji: "🦓" },
  { emoji: "🐱‍🏍" },
  { emoji: "🐲" },
  { emoji: "🦅" },
  { emoji: "🐷" },
  { emoji: "🦖" },
  { emoji: "🐕" },
  { emoji: "🏇" },
  { emoji: "🐈" },
  { emoji: "🦏" },
];

const cooldowns = {};
const RACE_COOLDOWN = 5000; // 2 seconds cooldown
const EXPERIENCE_GAIN_WIN = 100; // Experience gained for winning

module.exports = {
  data: new SlashCommandBuilder()
    .setName("race")
    .setDescription("Bet on a horse to win big!")
    .addStringOption((option) =>
      option
        .setName("horse")
        .setDescription("Choose a horse to bet on")
        .setRequired(true)
        .addChoices(
          ...horses.map((_, index) => ({
            name: `${String(index + 1).padStart(2, "0")}`,
            value: index.toString(),
          }))
        )
    )
    .addIntegerOption((option) =>
      option
        .setName("bet")
        .setDescription("Amount of money to bet")
        .setRequired(true)
    ),
  category: "game",
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
    
    const betAmount = interaction.options.getInteger("bet");
    
    let playerData = await Player.findOne({ userId: interaction.user.id });
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
        lastRace: 0, // Add lastRace property
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
    
    const chosenHorseIndex = parseInt(interaction.options.getString("horse"));

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

    // Informing the user that the race is starting
    const raceEmbed = {
      title: lang.horseStartingTitle,
      description: lang.horseStartingContent,
      color: 0x3498db,
    };

    await interaction.reply({ embeds: [raceEmbed] });
    // Update last race time
    playerData.lastRace = Date.now();
    cooldowns[interaction.user.id] = Date.now() + RACE_COOLDOWN;
    // Simulate race outcome after 1.5 seconds
    setTimeout(async () => {
      const winningHorseIndex = Math.floor(Math.random() * horses.length);
      const isWin = winningHorseIndex === chosenHorseIndex;

      // Create the race result string in the specified format
      const raceResult = horses
        .map((_, index) => {
          const horseNumber = String(index + 1).padStart(2, "0"); // Pad with leading zeros
          if (index === winningHorseIndex) {
            return `🏅 ${horseNumber} 🦖`; // Winning horse
          } else {
            // Generate a random number of dashes between 1 and 4
            const randomDashesCount = Math.floor(Math.random() * 4) + 1; // Between 1 and 4
            const dashes = "- ".repeat(randomDashesCount).trim(); // Create dashes
            return `🏁 ${horseNumber} ${dashes} 🦖`; // Non-winning horse
          }
        })
        .join("\n");

      const resultEmbed = {
        title: lang.horseIsWin
                   .replace("{wonLose}", isWin ? lang.hoseWin : lang.horseLost),
        fields: [
          { name: lang.yourBet, value: `${betAmount.toLocaleString()} 🪙`, inline: false },
          {
            name: lang.yourRace,
            value: `${String(chosenHorseIndex + 1).padStart(2, "0")}`,
            inline: false,
          },
          { name: lang.raceResult, value: raceResult, inline: false },
          {
            name: lang.raceResultContent
                      .replace("{number}",String(winningHorseIndex + 1).padStart(2,"0")),
            value: "\u200B",
            inline: false,
          },
        ],
        color: isWin ? 0x00ff00 : 0xff0000,
      };

      if (isWin) {
        const winnings = betAmount * 3; // 3x payout
        playerData.balance += winnings; // Add winnings to balance
        resultEmbed.fields.push({
          name: lang.congratulations,
          value: lang.youWon
                     .replace("{won}", winnings.toLocaleString()),
          inline: false,
        });
        resultEmbed.fields.push({
          name: lang.yourCash,
          value: `${playerData.balance.toLocaleString()} 🪙`,
          inline: false,
        });

        // Gain experience for winning
        playerData.experience += EXPERIENCE_GAIN_WIN; // Add experience for winning
        resultEmbed.fields.push({
          name: lang.xpGained,
          value: `${EXPERIENCE_GAIN_WIN} XP`,
          inline: false,
        });
      } else {
        playerData.balance -= betAmount; // Lose the bet
        resultEmbed.fields.push({
          name: lang.sorry,
          value: lang.youLost
                     .replace("{amount}", betAmount.toLocaleString()),
          inline: false,
        });
        resultEmbed.fields.push({
          name: lang.yourCash,
          value: `${playerData.balance.toLocaleString()} 🪙`,
          inline: false,
        });
      }

      // Save the updated player data
      await playerData.save();

      
      // Edit the original reply to show the result
      await interaction.editReply({ embeds: [resultEmbed] });
    }, 1500); // 1500 milliseconds = 1.5 seconds
  },
};
