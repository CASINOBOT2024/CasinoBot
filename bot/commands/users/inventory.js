const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Player = require('../../../mongoDB/Player');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('inventory')
    .setDescription('View your inventory or someone else\'s')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('The user whose inventory you want to view')
    ),
  category: 'economy',
  async execute(interaction) {
    const targetUser = interaction.options.getUser('user') || interaction.user;

    // Fetch the player data from the database for the specified user or the interaction user
    const player = await Player.findOne({ userId: targetUser.id });

    if (!player || !player.swag || Object.keys(player.swag).length === 0) {
      return interaction.reply({
        content: `${targetUser.username} has no items in their inventory.`,
        ephemeral: true
      });
    }

    const inventoryEmbed = new EmbedBuilder()
      .setTitle(`${targetUser.username}'s Inventory`)
      .setColor(0x3498db);

    // Add the items from swag to the embed
    for (const [item, quantity] of Object.entries(player.swag)) {
      inventoryEmbed.addFields({
        name: item,
        value: `Quantity: ${quantity}`,
        inline: true
      });
    }

    inventoryEmbed.setFooter({ text: `Total balance: ${player.balance.toLocaleString()} 💰` });

    await interaction.reply({ embeds: [inventoryEmbed] });
  }
};
