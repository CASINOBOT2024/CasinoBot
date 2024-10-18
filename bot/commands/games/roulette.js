const { SlashCommandBuilder } = require("discord.js"); 
const Player = require("../../../mongoDB/Player");

const ROULETTE_COOLDOWN = 5000; // 5 seconds cooldown

// Object to hold cooldowns for each user
const cooldowns = {};

module.exports = {
  data: new SlashCommandBuilder()
    .setName("roulette")
    .setDescription("Play roulette by guessing the color")
    .addStringOption((option) =>
      option
        .setName("prediction")
        .setDescription("Choose between black, red, or green")
        .setRequired(true)
        .addChoices(
          { name: "Black", value: "black" },
          { name: "Red", value: "red" },
          { name: "Green", value: "green" }
        )
    )
    .addIntegerOption((option) =>
      option
        .setName("bet")
        .setDescription("Amount of money to bet")
        .setRequired(true)
    ),
  category: "game",
  usage: "Bet on roulette by color",
  async execute(interaction, client) {
    const betAmount = interaction.options.getInteger("bet");
    const prediction = interaction.options.getString("prediction");
    
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

    // Simulate the roulette spin
    await interaction.reply({
      embeds: [
        {
          title: "Roulette - Spinning...",
          description: "The ball is spinning... Please wait!",
          color: 0x3498db,
        },
      ],
    });

    // Delay for 1 second to simulate the spin
    setTimeout(async () => {
      // Determine the outcome
      const result = Math.floor(Math.random() * 37);
      let resultColor;
      const redNumbers = [
        1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36,
      ];

      if (result === 0) {
        resultColor = "green"; // 0 is green
      } else if (redNumbers.includes(result)) {
        resultColor = "red";
      } else {
        resultColor = "black";
      }

      // Determine if the player won
      const isWin = prediction === resultColor;
      let messageEmbed = {
        title: `Roulette - You ${isWin ? "Won!" : "Lost!"}`,
        fields: [
          { name: "Your bet:", value: `${betAmount.toLocaleString()} 💰`, inline: false },
          { name: "Your Prediction:", value: prediction.toLocaleString(), inline: false },
          {
            name: "Ball landed on:",
            value: `${result} (${
              resultColor === "red"
                ? "🟥 red"
                : resultColor === "green"
                ? "🟩 green"
                : "⬛ black"
            })`,
            inline: false,
          },
        ],
        color: isWin ? 0x00ff00 : 0xff0000, // Green for win, red for loss
      };

      let experienceGained = 0; // Initialize experience gain variable
      let highestLevelGained = playerData.level; // Track the highest level gained in this session

      if (isWin) {
        // Calculate winnings
        let winnings = prediction === "green" ? betAmount * 3 : betAmount * 1;
        playerData.balance += winnings; // Add winnings to balance
        messageEmbed.fields.push({
          name: "You won:",
          value: `${winnings.toLocaleString()} 💰`,
          inline: false,
        });
        messageEmbed.fields.push({
          name: "Your cash:",
          value: `${playerData.balance.toLocaleString()} 💰`,
          inline: false,
        });

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

        // Check for balloon or mobile win (10% chance), but only one reward
        const winBalloon = Math.random() < 0.1; // 10% chance for balloon
        const winMobile = Math.random() < 0.1; // 10% chance for mobile

        if (winBalloon && !winMobile) {
          playerData.swag.balloons += 1; // Add a balloon
          messageEmbed.fields.push({
            name: "Congratulations!",
            value: "You also won a 🎈 balloon!",
            inline: false,
          });
        } else if (winMobile && !winBalloon) {
          playerData.swag.mobile += 1; // Add a mobile
          messageEmbed.fields.push({
            name: "Congratulations!",
            value: "You also won a 📱 mobile!",
            inline: false,
          });
        }
      } else {
        playerData.balance -= betAmount;
        messageEmbed.fields.push({
          name: "Lost:",
          value: `${betAmount.toLocaleString()} 💰`,
          inline: false,
        });
        messageEmbed.fields.push({
          name: "Your cash:",
          value: `${playerData.balance.toLocaleString()} 💰`,
          inline: false,
        });
      }

      // Save the updated player data
      await playerData.save();

      // Update last roulette time for the user
      playerData.lastRoulette = Date.now();
      cooldowns[interaction.user.id] = Date.now() + ROULETTE_COOLDOWN; // Set cooldown for this user

      // Edit the original reply to show the result
      await interaction.editReply({ embeds: [messageEmbed] });
    }, 1000); // 1000 milliseconds = 1 second
  },
};
