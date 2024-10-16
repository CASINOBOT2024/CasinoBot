const { SlashCommandBuilder } = require("discord.js");
const Player = require("../../../mongoDB/Player");

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
    .setDescription("Bet on a horse in a race")
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
  usage: "Bet on a horse to win big!",
  async execute(interaction, client) {
    
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
    /*
    if(playerData.balance <= 10000000 && betAmount > 30000) {
      return interaction.reply({
        embeds: [
          {
            title: "Error - Max Bet",
            description: `The max bet is **30.000 🪙**. Please enter a lower bet and try again.`,
            color: 0xff0000,
          },
        ],
        ephemeral: true,
      });
    } else if(playerData.balance > 10000000 && betAmount > 50000) {
      return interaction.reply({
        embeds: [
          {
            title: "Error - Max Bet",
            description: `The max bet is **50.000 🪙**. Please enter a lower bet and try again.`,
            color: 0xff0000,
          },
        ],
        ephemeral: true,
      });
    }
*/

    if(betAmount > 50000) {
      return interaction.reply({
        embeds: [
          {
            title: "Error - Max Bet",
            description: `The max bet is **50.000 🪙**. Please enter a lower bet and try again.`,
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
            title: "Cooldown Active",
            description: `You need to wait ${remainingTime} seconds before playing roulette again.`,
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
            title: "Error",
            description: "You do not have enough money to place this bet.",
            color: 0xff0000,
          },
        ],
        ephemeral: true,
      });
    }

    // Informing the user that the race is starting
    const raceEmbed = {
      title: "🏇 Horse Race - Starting Soon!",
      description: "The race is about to start! Please wait a moment...",
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
        title: `Race - You ${isWin ? "Won!" : "Lost!"}`,
        fields: [
          { name: "Your bet:", value: `${betAmount.toLocaleString()} 🪙`, inline: false },
          {
            name: "Your Racer:",
            value: `${String(chosenHorseIndex + 1).padStart(2, "0")}`,
            inline: false,
          },
          { name: "Race Result:", value: raceResult, inline: false },
          {
            name: `RACER ${String(winningHorseIndex + 1).padStart(
              2,
              "0"
            )} WON!`,
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
          name: "Congratulations!",
          value: `You won ${winnings.toLocaleString()} 🪙!`,
          inline: false,
        });
        resultEmbed.fields.push({
          name: "Your cash:",
          value: `${playerData.balance.toLocaleString()} 🪙`,
          inline: false,
        });

        // Gain experience for winning
        playerData.experience += EXPERIENCE_GAIN_WIN; // Add experience for winning
        resultEmbed.fields.push({
          name: "XP Gained:",
          value: `${EXPERIENCE_GAIN_WIN} XP`,
          inline: false,
        });
      } else {
        playerData.balance -= betAmount; // Lose the bet
        resultEmbed.fields.push({
          name: "Sorry!",
          value: `You lost ${betAmount.toLocaleString()} 🪙`,
          inline: false,
        });
        resultEmbed.fields.push({
          name: "Your cash:",
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
