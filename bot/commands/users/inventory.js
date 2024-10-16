const { SlashCommandBuilder } = require("discord.js");
const Player = require("../../../mongoDB/Player");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("inventory")
    .setDescription("View your inventory or another user's inventory")
    .addUserOption((option) =>
      option.setName("user").setDescription("The user whose inventory to view")
    ),
  category: "game",
  usage: "View your or another user's inventory",
  async execute(interaction, client) {
    const user = interaction.options.getUser("user") || interaction.user;
    const player = await Player.findOne({ userId: user.id });

    if (!player) {
      return interaction.reply({
        content: "This user doesn't have an account.",
        ephemeral: true,
      });
    }

    const inventoryItems = [
      { name: '🇪🇸 Spanish Flag', count: player.swag.balloons, emoji: '🇪🇸' },
      { name: '🧉 Mate', count: player.swag.mobile, emoji: '🧉' },
      { name: '🥘 Paella', count: player.swag.jamon, emoji: '🥘' },
      { name: '🍷 Wine', count: player.swag.paella, emoji: '🍷' },
      { name: '🎺 Flamenco Trumpet', count: player.swag.guitarra, emoji: '🎺' },
      { name: '👒 Sombrero', count: player.swag.torero, emoji: '👒' },
      { name: '⚽ Soccer Ball', count: player.swag.flamenco, emoji: '⚽' },
      { name: '📱 Mobile', count: player.swag.siesta, emoji: '📱' },
      { name: '🎈 Balloon', count: player.swag.cava, emoji: '🎈' },
      { name: '🐖 Jamón', count: player.swag.castanuelas, emoji: '🐖' },
      { name: '🎸 Guitarra', count: player.swag.sagradaFamilia, emoji: '🎸' },
      { name: '🐂 Torero', count: player.swag.futbol, emoji: '🐂' },
      { name: '💃 Flamenco', count: player.swag.vino, emoji: '💃' },
      { name: '💤 Siesta', count: player.swag.sol, emoji: '💤' },
      { name: '🍾 Cava', count: player.swag.cava, emoji: '🍾' },
      { name: '🎶 Castañuelas', count: player.swag.castanuelas, emoji: '🎶' },
      { name: '🏰 Sagrada Familia', count: player.swag.sagradaFamilia, emoji: '🏰' },
      { name: '⚽ Fútbol', count: player.swag.futbol, emoji: '⚽' },
      { name: '🍷 Vino', count: player.swag.vino, emoji: '🍷' },
      { name: '☀️ Sol', count: player.swag.sol, emoji: '☀️' },
    ];

    const inventoryList = inventoryItems
      .filter(item => item.count > 0) // Filter out items with a count of 0
      .map(item => `${item.emoji} **${item.name}:** ${item.count}`)
      .join("\n");

    const embed = {
      title: `${user.username}'s Inventory`,
      description: inventoryList || "This inventory is empty.",
      color: 0x00ff00,
    };

    return interaction.reply({ embeds: [embed] });
  },
};
