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

    player.balance -= betAmount; // Deduct the bet amount from player's balance
    await player.save();

    // Create the initial embed
    let crashMultiplier = 1.0;
    const crashEmbed = new EmbedBuilder()
      .setTitle("💥 Crash Game")
      .setDescription(`Multiplier: **${crashMultiplier.toFixed(2)}x**`)
      .setColor(0xffa500) // Orange color for the game start
      .setFooter({ text: "Press the stop button to cash out!" });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("cashout")
        .setEmoji("🛑") // Button with stop emoji
        .setLabel("Cash Out")
        .setStyle(ButtonStyle.Danger)
    );

    await interaction.reply({ embeds: [crashEmbed], components: [row] });
    const message = await interaction.fetchReply();

    let hasCashedOut = false;
    const minMultiplierStep = 0.01;
    const maxMultiplierStep = 0.1;

    // Function to update the multiplier with random intervals
    const updateMultiplier = () => {
      if (hasCashedOut) return;

      // Random increment for the multiplier
      const increment =
        Math.random() * (maxMultiplierStep - minMultiplierStep) +
        minMultiplierStep;
      crashMultiplier += increment;

      // Edit the embed with the new multiplier
      const updatedEmbed = new EmbedBuilder()
        .setTitle("💥 Crash Game")
        .setDescription(`Multiplier: **${crashMultiplier.toFixed(2)}x**`)
        .setColor(0xffa500) // Keep orange color while in progress
        .setFooter({ text: "Press the stop button to cash out!" });

      message.edit({ embeds: [updatedEmbed], components: [row] });

      // Random time for the game to end (between 5 and 30 seconds)
      const nextUpdateTime = Math.random() * 3000 + 2000; // Between 2000ms and 5000ms
      setTimeout(() => {
        if (!hasCashedOut) {
          collector.stop("crashed"); // Stop collector if not cashed out
        }
      }, nextUpdateTime);
    };

    // Start updating the multiplier
    updateMultiplier();

    // Create a collector for the Cash Out button
    const collector = message.createMessageComponentCollector({ time: 30000 }); // Time limit for the game: 30 seconds

    collector.on("collect", async (buttonInteraction) => {
      if (buttonInteraction.customId === "cashout") {
        hasCashedOut = true;
        const winnings = Math.floor(betAmount * crashMultiplier);
        player.balance += winnings; // Add winnings to player's balance
        await player.save();

        const winningsEmbed = new EmbedBuilder()
          .setTitle("🎉 Congratulations!")
          .setDescription(
            `You cashed out at **${crashMultiplier.toFixed(
              2
            )}x** and won **${winnings} 💰**!`
          )
          .setColor(0x00ff00) // Green color for a successful outcome
          .addFields(
            { name: "Bet Amount", value: `${betAmount} 💰`, inline: true },
            {
              name: "Multiplier",
              value: `${crashMultiplier.toFixed(2)}x`,
              inline: true,
            },
            { name: "Winnings", value: `${winnings} 💰`, inline: true }
          )
          .setFooter({
            text: "Great timing! You cashed out just in time.",
            iconURL: interaction.user.displayAvatarURL(),
          })
          .setTimestamp();

        await buttonInteraction.update({
          embeds: [winningsEmbed],
          components: [],
        });
      }
    });

    collector.on("end", async (reason) => {
      if (!hasCashedOut) {
        // If the game ends and the user hasn't cashed out
        const lostEmbed = new EmbedBuilder()
          .setTitle("💥 CRASH 💥 - You Lost!")
          .setDescription(
            `Your bet: **${betAmount} 🪙**\n\nMultiplier:\n**x${crashMultiplier.toFixed(
              2
            )}**\n\nCRASHED!\n\nLost: **${betAmount} 🪙**\n\nYour cash: **${
              player.balance + betAmount
            } 🪙**`
          )
          .setColor(0xff0000) // Red for a failed outcome
          .setFooter({ text: "Better luck next time!" });

        player.balance += betAmount; // Refund the bet amount
        await player.save();

        await message.edit({ embeds: [lostEmbed], components: [] });
      }
    });
  },
};
