const { SlashCommandBuilder } = require('discord.js');
const Player = require("../../../mongoDB/Player");

module.exports = {
  data: new SlashCommandBuilder()
    .setName('deleteuser')
    .setDescription('Delete a user from the database')
    .addUserOption(option => 
      option.setName('target')
        .setDescription('Select the user to delete from the database')
        .setRequired(true)
    ),
  category: 'admin',
  usage: 'Delete a user from the database (admin only)',
  async execute(interaction, client) {
    
    // Check if the user executing the command is the admin
    if (interaction.user.id !== "714376484139040809") {
      return interaction.reply({
        embeds: [{
          title: 'Permission Denied',
          description: 'You do not have permission to use this command.',
          color: 0xff0000,
        }],
        ephemeral: true,
      });
    }

    // Get the target user
    const targetUser = interaction.options.getUser('target');
    
    // Check if the target user exists in the database
    let player = await Player.findOne({ userId: targetUser.id });
    if (!player) {
      return interaction.reply({
        embeds: [{
          title: 'Error',
          description: `User <@${targetUser.id}> not found in the database.`,
          color: 0xff0000,
        }],
        ephemeral: true,
      });
    }

    // Delete the user from the database
    await Player.deleteOne({ userId: targetUser.id });

    // Confirm the deletion
    return interaction.reply({
      embeds: [{
        title: 'Success',
        description: `User <@${targetUser.id}> has been successfully deleted from the database.`,
        color: 0x00ff00,
      }],
    });
  }
};
