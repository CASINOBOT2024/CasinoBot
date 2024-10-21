const { SlashCommandBuilder } = require("discord.js");
const Player = require("../../../mongoDB/Player");
const Guild = require("../../../mongoDB/Guild");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("inventory")
    .setDescription("View your inventory or another user's inventory")
    .addUserOption((option) =>
      option.setName("user").setDescription("The user whose inventory to view")
    ),
  category: "users",
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
    
    const user = interaction.options.getUser("user") || interaction.user;
    const player = await Player.findOne({ userId: user.id });

    if (!player) {
      return interaction.reply({
        content: lang.userNotHaveAccount,
        ephemeral: true,
      });
    }

    const inventoryItems = [
      { name: lang.inventoryName1, count: player.swag.spanishFlag, emoji: '🇪🇸' },
      { name: lang.inventoryName2, count: player.swag.mate, emoji: '🧉' },
      { name: lang.inventoryName3, count: player.swag.paella, emoji: '🥘' },
      { name: lang.inventoryName4, count: player.swag.wine, emoji: '🍷' },
      { name: lang.inventoryName5, count: player.swag.sombrero, emoji: '👒' },
      { name: lang.inventoryName6, count: player.swag.soccerBall, emoji: '⚽' },
      { name: lang.inventoryName7, count: player.swag.jamon, emoji: '🐖' },
      { name: lang.inventoryName8, count: player.swag.guitarra, emoji: '🎸' },
      { name: lang.inventoryName9, count: player.swag.torero, emoji: '🐂' },
      { name: lang.inventoryName10, count: player.swag.flamenco, emoji: '💃' },
      { name: lang.inventoryName11, count: player.swag.siesta, emoji: '💤' },
      { name: lang.inventoryName12, count: player.swag.cava, emoji: '🍾' },
      { name: lang.inventoryName13, count: player.swag.castanuelas, emoji: '🎶' },
      { name: lang.inventoryName14, count: player.swag.sagradaFamilia, emoji: '🏰' },
      { name: lang.inventoryName15, count: player.swag.sol, emoji: '☀️' },
    ];

    const inventoryList = inventoryItems
      .filter(item => item.count > 0) // Filter out items with a count of 0
      .map(item => `${item.emoji} **${item.name}:** ${item.count}`)
      .join("\n");

    const embed = {
      title: lang.inventoryTitle
                 .replace("{user}", user.username),
      description: inventoryList || lang.inventoryEmpty,
      color: 0x00ff00,
    };

    await interaction.reply({ embeds: [embed] });
  },
};
