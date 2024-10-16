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
          { name: '🎺 Flamenco Trumpet', value: 'flamencoTrumpet' },
          { name: '👒 Sombrero', value: 'sombrero' },
          { name: '⚽ Soccer Ball', value: 'soccerBall' },
          { name: '📱 Mobile', value: 'mobile' },
          { name: '🎈 Balloon', value: 'balloon' },
          { name: '🐖 Jamón', value: 'jamon' },
          { name: '🎸 Guitarra', value: 'guitarra' },
          { name: '🐂 Torero', value: 'torero' },
          { name: '💃 Flamenco', value: 'flamenco' },
          { name: '💤 Siesta', value: 'siesta' },
          { name: '🍾 Cava', value: 'cava' },
          { name: '🎶 Castañuelas', value: 'castanuelas' },
          { name: '🏰 Sagrada Familia', value: 'sagradaFamilia' },
          { name: '⚽ Fútbol', value: 'futbol' },
          { name: '🍷 Vino', value: 'vino' },
          { name: '☀️ Sol', value: 'sol' },
        )
    )
    .addIntegerOption((option) =>
      option
        .setName("amount")
        .setDescription("Amount of items to buy")
        .setRequired(false) // Make this option not required
    ),
  category: "game",
  usage: "Buy items from the store",
  async execute(interaction, client) {
    const item = interaction.options.getString("item");
    const amount = interaction.options.getInteger("amount") || 1; // Default amount is 1
    const prices = {
      spanishFlag: 50000,
      mate: 50000,
      paella: 100000,
      wine: 80000,
      flamencoTrumpet: 90000,
      sombrero: 40000,
      soccerBall: 30000, 
      mobile: 150000, 
      balloon: 20000,     
      jamon: 120000,     
      guitarra: 110000,    
      torero: 140000, 
      flamenco: 80000,        
      siesta: 70000,         
      cava: 100000,       
      castanuelas: 85000,     
      sagradaFamilia: 200000, 
      futbol: 110000,      
      vino: 90000,      
      sol: 50000,        
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
          name: `**${key.replace(/([A-Z])/g, ' $1').toUpperCase()}:** ${price.toLocaleString()} 💰`,
          value: `Available quantity: 100`, // Example quantity
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
