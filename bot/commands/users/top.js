const { SlashCommandBuilder } = require('discord.js');
const Player = require("../../../mongoDB/Player");
const Guild = require("../../../mongoDB/Guild");

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
    let guildLang = await Guild.findOne({ guildId: interaction.guild.id });
    if(!guildLang) {
      guildLang = new Guild ({
        guildId: interaction.guild.id,
        lang: "en",
      });
    }
    
    await guildLang.save();

    const lang = require(`../../languages/${guildLang.lang}.json`);
    
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
          title: lang.errorNotPlayerFound,
          color: 0xff0000,
        }],
        ephemeral: true,
      });
    }

    // Build the top 10 message
    let topMessage = topPlayers.map((player, index) => {
      const user = client.users.cache.get(player.userId);
      return lang.top10Content
                 .replace("{topNumber}", index + 1)
                 .replace("{user}", user ? `${user.username} (${user.id})` : lang.unknownTopPlayer)
                 .replace("{category}", category === 'balance' ? `**${player.balance.toLocaleString()}** 💰` : lang.topLevelContent)
    }).join('\n\n');

    // Create an embed to display the top
    const topEmbed = {
      title: lang.topTitle
                 .replace("{category}", category === 'balance' ? lang.moneyTitle : lang.levelTitle),
      description: topMessage,
      color: 0x00ff00,
      footer: {
        text: lang.requestedBy
                  .replace("{user}", interaction.user.username),
        icon_url: interaction.user.displayAvatarURL(),
      },
    };

    // Send the embed
    return interaction.reply({ embeds: [topEmbed] });
  }
};
