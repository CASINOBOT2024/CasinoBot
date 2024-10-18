const { SlashCommandBuilder } = require("discord.js");
const Player = require("../../../mongoDB/Player");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("buy")
    .setDescription("Buy items from the store")
    .addStringOption((option) =>
      option
        .setName("item")
        .setDescription("Choose an item to buy")
        .setRequired(false) // Make this option not required
        .addChoices(
          { name: '🇪🇸 Spanish Flag', value: 'spanishFlag' },
          { name: '🧉 Mate', value: 'mate' },
          { name: '🥘 Paella', value: 'paella' },
          { name: '🍷 Wine', value: 'wine' },
          { name: '👒 Sombrero', value: 'sombrero' },
          { name: '⚽ Soccer Ball', value: 'soccerBall' },
          { name: '🐖 Jamón', value: 'jamon' },
          { name: '🎸 Guitarra', value: 'guitarra' },
          { name: '🐂 Torero', value: 'torero' },
          { name: '💃 Flamenco', value: 'flamenco' },
          { name: '💤 Siesta', value: 'siesta' },
          { name: '🍾 Cava', value: 'cava' },
          { name: '🎶 Castañuelas', value: 'castanuelas' },
          { name: '🏰 Sagrada Familia', value: 'sagradaFamilia' },
          { name: '☀️ Sol', value: 'sol' },
        )
    )
    .addIntegerOption((option) =>
      option
        .setName("amount")
        .setDescription("Amount of items to buy")
        .setRequired(false) // Make this option not required
    ),
  category: "users",
  usage: "Buy items from the store",
  async execute(interaction, client) {
    const item = interaction.options.getString("item");
    const amount = interaction.options.getInteger("amount") || 1; // Default amount is 1
    const prices = {
      spanishFlag: 10000000,
      mate: 8000000,
      paella: 2000000,
      wine: 2500000,
      flamencoTrumpet: 5000000,
      sombrero: 5500000,
      soccerBall: 4500000, 
      jamon: 12000000,     
      guitarra: 6000000,    
      torero: 9000000, 
      flamenco: 12000000,        
      siesta: 20000000,         
      cava: 10000000,       
      castanuelas: 7500000,     
      sagradaFamilia: 25000000, 
      sol: 500000000,        
    };

    let player = await Player.findOne({ userId: interaction.user.id });
    if (!player) {
      return interaction.reply({
        content: "You don't have an account yet! Please create one first.",
        ephemeral: true,
      });
    }

    // Show the list of items if no item is specified
    if (!item) {
      const embed = {
        title: 'Store Items',
        fields: Object.entries(prices).map(([key, price]) => ({
          name: `**${key.replace(/([A-Z])/g, ' $1').toUpperCase()}:**`,
          value: `${price.toLocaleString()} 💰`,
          inline: true,
        })),
        color: 0x3498db,
      };
      return interaction.reply({ embeds: [embed] });
    }

    // Check if the selected item is in the price list
    if (!prices[item]) {
      return interaction.reply({
        content: "Invalid item selected.",
        ephemeral: true,
      });
    }

    const totalCost = prices[item] * amount;

    if (player.balance < totalCost) {
      return interaction.reply({
        embeds: [
          {
            title: "Error",
            description: "You do not have enough money to buy this item.",
            color: 0xff0000,
          },
        ],
        ephemeral: true,
      });
    }

    // Deduct the cost from the player's balance and add the item to swag
    player.balance -= totalCost;
    player.swag[item] += amount;

    // Save the updated player data
    await player.save();

    return interaction.reply({
      embeds: [
        {
          title: "Purchase Successful!",
          description: `You bought ${amount} ${item.replace(/([A-Z])/g, ' $1')} for ${totalCost.toLocaleString()} 💰.`,
          color: 0x00ff00,
        },
      ],
    });
  },
};
