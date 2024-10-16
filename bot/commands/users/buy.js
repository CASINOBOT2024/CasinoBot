const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Player = require('../../../mongoDB/Player');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('buy')
    .setDescription('Buy items from the shop')
    .addStringOption(option =>
      option.setName('item')
        .setDescription('The item you want to buy')
        .setRequired(false)
        .addChoices(
          { name: '🇪🇸 Spanish Flag', value: '🇪🇸 Spanish Flag' },
          { name: '🧉 Mate', value: '🧉 Mate' },
          { name: '🥘 Paella', value: '🥘 Paella' },
          { name: '🍷 Wine', value: '🍷 Wine' },
          { name: '🎺 Flamenco Trumpet', value: '🎺 Flamenco Trumpet' },
          { name: '👒 Sombrero', value: '👒 Sombrero' },
          { name: '⚽ Soccer Ball', value: '⚽ Soccer Ball' },
          { name: '📱 Mobile', value: '📱 Mobile' },
          { name: '🎈 Balloon', value: '🎈 Balloon' }
        )
    )
    .addIntegerOption(option =>
      option.setName('quantity')
        .setDescription('The quantity you want to buy')
        .setRequired(false)
    ),
  category: 'economy',
  async execute(interaction) {
    const itemName = interaction.options.getString('item');
    const quantity = interaction.options.getInteger('quantity') || 1;
    
    // Price list for each item
    const itemPrices = {
      '🇪🇸 Spanish Flag': 100000,
      '🧉 Mate': 150000,
      '🥘 Paella': 500000,
      '🍷 Wine': 250000,
      '🎺 Flamenco Trumpet': 350000,
      '👒 Sombrero': 200000,
      '⚽ Soccer Ball': 300000,
      '📱 Mobile': 700000,
      '🎈 Balloon': 50000
    };

    // Get the player's data from the database
    let player = await Player.findOne({ userId: interaction.user.id });
    if (!player) {
      player = new Player({
        userId: interaction.user.id,
        balance: 0,
        level: 1,
        experience: 0,
        maxBet: 0,
        swag: {},
        lastDaily: 0,
        lastRoulette: 0,
      });
      await player.save();
    }

    // If no item is specified, show the prices in an embed
    if (!itemName) {
      const shopEmbed = new EmbedBuilder()
        .setTitle('🛒 Shop')
        .setDescription('Here are the items you can buy:')
        .setColor(0x3498db);

      for (const [item, price] of Object.entries(itemPrices)) {
        shopEmbed.addFields({ name: item, value: `Price: ${price.toLocaleString()} 💰`, inline: true });
      }

      return interaction.reply({ embeds: [shopEmbed] });
    }

    const itemPrice = itemPrices[itemName];

    if (!itemPrice) {
      return interaction.reply({ content: 'This item is not available in the shop.', ephemeral: true });
    }

    const totalCost = itemPrice * quantity;

    if (player.balance < totalCost) {
      return interaction.reply({
        content: `You don't have enough money to buy ${quantity}x ${itemName}. You need ${totalCost.toLocaleString()} 💰.`,
        ephemeral: true
      });
    }

    // Deduct the money and add the item to the player's inventory
    player.balance -= totalCost;

    if (player.swag[itemName]) {
      player.swag[itemName] += quantity;
    } else {
      player.swag[itemName] = quantity;
    }

    await player.save();

    const purchaseEmbed = new EmbedBuilder()
      .setTitle('🛒 Purchase Successful!')
      .setDescription(`You have successfully purchased **${quantity}x ${itemName}**.`)
      .addFields(
        { name: 'Total Cost:', value: `${totalCost.toLocaleString()} 💰`, inline: true },
        { name: 'Your new balance:', value: `${player.balance.toLocaleString()} 💰`, inline: true }
      )
      .setColor(0x00ff00);

    await interaction.reply({ embeds: [purchaseEmbed] });
  },
};
