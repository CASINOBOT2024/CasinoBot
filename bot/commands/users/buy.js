const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Player = require('../../../mongoDB/Player');

const shopItems = {
  "🧑‍🎤 Flamenco Hat": 500000,
  "🥘 Paella Pan": 1000000,
  "🪁 Kite": 750000,
  "🎸 Spanish Guitar": 1200000,
  "🍷 Rioja Wine": 2000000,
  "🦜 Parrot": 3000000,
  "💃 Flamenco Dress": 5000000,
  "🛵 Vespa": 10000000,
  "🧲 Magnet": 150000,
  "🎨 Painting": 2500000,
  "🍇 Grapes": 50000,
  "⚽ Football": 800000
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('buy')
    .setDescription('Buy items from the shop')
    .addStringOption(option =>
      option.setName('item')
        .setDescription('The item you want to buy')
    )
    .addIntegerOption(option =>
      option.setName('quantity')
        .setDescription('The quantity you want to buy')
    ),
  category: 'users',
  usage: "Buy items from the shop",
  async execute(interaction) {
    const player = await Player.findOne({ userId: interaction.user.id });
    if (!player) {
      return interaction.reply({
        content: 'Player not found. Please register first!',
        ephemeral: true
      });
    }

    const item = interaction.options.getString('item');
    const quantity = interaction.options.getInteger('quantity') || 1;

    if (!item) {
      // If no item specified, show the shop with prices
      const embed = new EmbedBuilder()
        .setTitle('🛒 Spanish Shop Items')
        .setDescription('Here are the items available for purchase:')
        .setColor(0x3498db);

      Object.entries(shopItems).forEach(([itemName, price]) => {
        embed.addFields({
          name: itemName,
          value: `${price.toLocaleString()} 💰`,
          inline: true
        });
      });

      return interaction.reply({ embeds: [embed] });
    }

    const itemPrice = shopItems[item];
    if (!itemPrice) {
      return interaction.reply({
        content: `The item "${item}" is not available in the shop.`,
        ephemeral: true
      });
    }

    const totalPrice = itemPrice * quantity;

    if (player.balance < totalPrice) {
      return interaction.reply({
        content: `You do not have enough money to buy ${quantity} ${item}(s). Total cost: ${totalPrice.toLocaleString()} 💰.`,
        ephemeral: true
      });
    }

    // Deduct the money from the player's balance
    player.balance -= totalPrice;

    // Add the item to the player's swag
    if (player.swag[item]) {
      player.swag[item] += quantity;
    } else {
      player.swag[item] = quantity;
    }

    await player.save();

    const successEmbed = new EmbedBuilder()
      .setTitle('Purchase Successful')
      .setDescription(`You bought ${quantity} ${item}(s) for ${totalPrice.toLocaleString()} 💰`)
      .addFields(
        { name: 'Your new balance:', value: `${player.balance.toLocaleString()} 💰`, inline: true }
      )
      .setColor(0x00FF00);

    await interaction.reply({ embeds: [successEmbed] });
  }
};
