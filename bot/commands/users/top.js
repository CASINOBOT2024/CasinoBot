const { SlashCommandBuilder } = require('discord.js');
const Player = require("../../../mongoDB/Player");

module.exports = {
  data: new SlashCommandBuilder()
    .setName('top')
    .setDescription('Show the Top 10 players with the most money or highest level')
    .addStringOption(option =>
      option.setName('category')
        .setDescription('Choose whether to view the top by money or level')
        .setRequired(true)
        .addChoices(
          { name: 'Money', value: 'balance' },
          { name: 'Level', value: 'level' }
        )
    ),
  category: 'users',
  usage: 'Shows the Top 10 players',
  async execute(interaction, client) {
    const category = interaction.options.getString('category');

    // Find the top 10 players based on the selected category (money or level)
    let topPlayers;
    if (category === 'balance') {
      topPlayers = await Player.find().sort({ balance: -1 }).limit(10);
    } else if (category === 'level') {
      topPlayers = await Player.find().sort({ level: -1 }).limit(10);
    }

    if (!topPlayers || topPlayers.length === 0) {
      return interaction.reply({
        embeds: [{
          title: 'No players found in the database',
          color: 0xff0000,
        }],
        ephemeral: true,
      });
    }

    // Build the top 10 message
    let topMessage = topPlayers.map((player, index) => {
      const user = client.users.cache.get(player.userId);
      return `**#${index + 1}** - ${user ? `<@${user.id}>` : 'Unknown Player'}: ${
        category === 'balance' ? `**${player.balance.toLocaleString()}** 💰` : `Level ${player.level}`
      }`;
    }).join('\n\n');

    // Create an embed to display the top
    const topEmbed = {
      title: `🏆 Top 10 - ${category === 'balance' ? 'Money 💰' : 'Level 🎮'}`,
      description: topMessage,
      color: 0x00ff00,
      footer: {
        text: `Requested by ${interaction.user.username}`,
        icon_url: interaction.user.displayAvatarURL(),
      },
    };

    // Send the embed
    return interaction.reply({ embeds: [topEmbed] });
  }
};
