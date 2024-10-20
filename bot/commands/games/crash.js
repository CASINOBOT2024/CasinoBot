const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} = require("discord.js");
const Player = require("../../../mongoDB/Player");
const Guild = require("../../../mongoDB/Guild");

const cooldowns = {};
const CRASH_COOLDOWN = 8000;

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
        lastCrash: 0,
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
          .setLabel(lang.cashOutButton)
          .setStyle(ButtonStyle.Success)
      );

    // Send initial embed with multiplier
    await interaction.reply({
      embeds: [{
        title: lang.crashTitleOnPlaying,
        description: lang.crashContentOnPlaying
                         .replace("{multiplier}",multiplier.toFixed(1)),
        color: 0x00ff00,
      }],
      components: [row],
    });

    const initialMessage = await interaction.fetchReply(); // Fetch the reply message
    playerData.lastCrash = Date.now();
      
    cooldowns[interaction.user.id] = Date.now() + CRASH_COOLDOWN;
    // Start the multiplier update loop
    const updateMultiplier = setInterval(() => {
      if (!crashed) {
        multiplier += 0.1; // Increment by 0.1

        // Update the embed with the new multiplier
        interaction.editReply({
          embeds: [{
            title: lang.crashTitleOnPlaying,
            description: lang.crashContentOnPlaying
                         .replace("{multiplier}",multiplier.toFixed(1)),
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
          title: lang.crashLoseTitle,
          description: crash.crashLostContent
                            .replace("{amount}", betAmount)
                            .replace("{multiplier}", multiplier.toFixed(1))
                            .replace("{balance}", playerData.balance.toLocaleString()),
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


      const won = betAmount * multiplier;

      let experienceGained = 0; // Initialize experience gain variable
      let highestLevelGained = playerData.level; // Track the highest level gained in this session

        // Add experience for winning (reduced to half)
        experienceGained = Math.floor(won / 300); // Reduced: 0.5 XP for every 100 currency won
        playerData.experience += experienceGained;
        
        // Level up logic
        const xpNeeded = playerData.level * 300; // Example: 100 XP needed for level 1, 200 for level 2, etc.
        while (playerData.experience >= xpNeeded) {
          playerData.level += 1; // Level up
          playerData.experience -= xpNeeded; // Reduce experience by the required amount
          highestLevelGained = playerData.level; // Update highest level gained
        }

      

      // Player wins
      playerData.balance += betAmount * multiplier; // Calculate total cash after cashing out
      await playerData.save();
      
      
      // Send winning message
      await buttonInteraction.update({
        embeds: [{
          title: lang.crashWinTitle,
          description: lang.crashWinContent
                           .replace("{amount}", betAmount)
                           .replace("{multiplier}", multiplier.toFixed(1))
                           .replace("{won}", Math.trunc(won).toLocaleString())
                           .replace("{cash}", Math.trunc(playerData.balance).toLocaleString()),
          color: 0x00ff00,
        }],
        components: [], // Remove button after cash out
      });
    });
  },
};

