const { SlashCommandBuilder } = require('discord.js');
const Player = require("../../../mongoDB/Player");

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rps')
    .setDescription('Play Rock, Paper, Scissors with a bet!')
    .addIntegerOption(option => 
      option.setName('bet')
        .setDescription('Amount to bet')
        .setRequired(true)
    )
    .addStringOption(option => 
      option.setName('choice')
        .setDescription('Your choice: rock, paper, or scissors')
        .setRequired(true)
        .addChoices(
          { name: 'Rock', value: 'rock' },
          { name: 'Paper', value: 'paper' },
          { name: 'Scissors', value: 'scissors' },
        )),
  category: 'game',
  usage: "Play Rock, Paper, Scissors with a bet!",
  async execute(interaction, client) {
    const betAmount = interaction.options.getInteger('bet');
    const playerChoice = interaction.options.getString('choice');

    
    // Fetch player data from the database
    const playerData = await Player.findOne({ userId: interaction.user.id });
    if (!playerData) {
      // If the player doesn't exist, create a new one
      playerData = new Player({
        userId: interaction.user.id,
        balance: 0,
        level: 1,
        experience: 0,
        maxBet: 0,
        swag: {
          balloons: 0,
          mobile: 0,
        },
        lastDaily: 0,
        lastRoulette: 0,
      });
      await playerData.save();
    }

    const currentTime = Date.now();

    // Check if the user is already in a roulette game
    if (
      cooldowns[interaction.user.id] &&
      currentTime < cooldowns[interaction.user.id]
    ) {
      const remainingTime = Math.ceil(
        (cooldowns[interaction.user.id] - currentTime) / 1000
      );
      return interaction.reply({
        embeds: [
          {
            title: "Cooldown Active",
            description: `You need to wait ${remainingTime} seconds before playing roulette again.`,
            color: 0xff0000,
          },
        ],
        ephemeral: true,
      });
    }
    
    if (!playerData || playerData.balance < betAmount) {
      return interaction.reply({
        content: `You do not have enough money to place this bet. Your current balance is ${playerData ? playerData.balance : 0} 🪙.`,
        ephemeral: true,
      });
    }

    // Define the choices
    const choices = ['rock', 'paper', 'scissors'];
    const botChoice = choices[Math.floor(Math.random() * choices.length)];

    // Determine the result
    let resultMessage;
    if (playerChoice === botChoice) {
      resultMessage = `It's a tie! Both chose **${playerChoice}**.`;
    } else if (
      (playerChoice === 'rock' && botChoice === 'scissors') ||
      (playerChoice === 'paper' && botChoice === 'rock') ||
      (playerChoice === 'scissors' && botChoice === 'paper')
    ) {
      // Player wins
      playerData.balance += betAmount;
      await playerData.save();
      resultMessage = `You win! You chose **${playerChoice}** and the bot chose **${botChoice}**. You gained ${betAmount} 🪙!`;
    } else {
      // Bot wins
      playerData.balance -= betAmount;
      await playerData.save();
      resultMessage = `You lost! You chose **${playerChoice}** and the bot chose **${botChoice}**. You lost ${betAmount} 🪙!`;
    }

    // Send the result
    return interaction.reply({
      embeds: [{
        title: 'Rock, Paper, Scissors 🎮',
        description: resultMessage,
        color: playerChoice === botChoice ? 0x3498DB : (resultMessage.includes('lost') ? 0xff0000 : 0x00ff00),
      }],
    });
  },
};
