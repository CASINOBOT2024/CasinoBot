const { SlashCommandBuilder } = require("discord.js"); 
const Player = require("../../../mongoDB/Player");
const Guild = require("../../../mongoDB/Guild");

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

    // Simulate the roulette spin
    await interaction.reply({
      embeds: [
        {
          title: lang.rouletteSpiningTitle,
          description: lang.rouletteSpiningContent,
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
        title: lang.roulleteIsWin
                   .replace("{wonLose}", isWin ? lang.rouletteWin : lang.rouletteLost),
        fields: [
          { name: lang.yourBet, value: `${betAmount.toLocaleString()} 💰`, inline: false },
          { name: lang.yourPrediction, value: prediction.toLocaleString(), inline: false },
          {
            name: lang.rouletteBallLandedTitle,
            value: lang.rouletteBallLandedContent
                       .replace("{result}", result)
                       .replace("{resultColor}", resultColor === "red" ? lang.rouletteColorRed : resultColor === "green" ? lang.rouletteColorGreen : lang.rouletteColorBlack),
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
          name: lang.rouletteYouWon,
          value: `${winnings.toLocaleString()} 💰`,
          inline: false,
        });
        messageEmbed.fields.push({
          name: lang.yourCash,
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
            name: lang.congratulations,
            value: lang.wonBalloon,
            inline: false,
          });
        } else if (winMobile && !winBalloon) {
          playerData.swag.mobile += 1; // Add a mobile
          messageEmbed.fields.push({
            name: lang.congratulations,
            value: lang.wonMobile,
            inline: false,
          });
        }
      } else {
        playerData.balance -= betAmount;
        messageEmbed.fields.push({
          name: lang.youLostOnly,
          value: `${betAmount.toLocaleString()} 💰`,
          inline: false,
        });
        messageEmbed.fields.push({
          name: lang.yourCash,
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
