const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Player = require('../../../mongoDB/Player');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('inventory')
    .setDescription('Check your or another user\'s inventory')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('The user whose inventory you want to check')
        .setRequired(false)
    ),
  category: 'economy',
  async execute(interaction) {
    // Get the user mentioned or default to the command user
    const targetUser = interaction.options.getUser('user') || interaction.user;

    // Fetch the player's inventory from the database
    let player = await Player.findOne({ userId: targetUser.id });

    if (!player || !player.swag || Object.keys(player.swag).length === 0) {
      return interaction.reply({
        content: `${targetUser.username} has no items in their inventory.`,
        ephemeral: true
      });
    }

    // Embed to show the inventory
    const inventoryEmbed = new EmbedBuilder()
      .setTitle(`${targetUser.username}'s Inventory`)
      .setColor(0x3498db)
      .setDescription('Here are the items they own:')
      .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
      .setFooter({ text: `Inventory of ${targetUser.username}` });

    // List of emoji representations for each item
    const itemEmojis = {
      '🇪🇸 Spanish Flag': '🇪🇸',
      '🧉 Mate': '🧉',
      '🥘 Paella': '🥘',
      '🍷 Wine': '🍷',
      '🎺 Flamenco Trumpet': '🎺',
      '👒 Sombrero': '👒',
      '⚽ Soccer Ball': '⚽',
      '📱 Mobile': '📱',
      '🎈 Balloon': '🎈'
    };

    // Iterate over the player's inventory and display the items with the corresponding emoji
    for (const [itemName, quantity] of Object.entries(player.swag)) {
      const emoji = itemEmojis[itemName] || ''; // Get emoji or empty string if not available
      inventoryEmbed.addFields({
        name: `${emoji} ${itemName}`,
        value: `Quantity: ${quantity.toLocaleString()}`,
        inline: true
      });
    }

    await interaction.reply({ embeds: [inventoryEmbed] });
  },
};
