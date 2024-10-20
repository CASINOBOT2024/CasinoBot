const { SlashCommandBuilder } = require('discord.js');
const Player = require("../../../mongoDB/Player");
const Guild = require("../../../mongoDB/Guild");

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
  usage: 'Delete a user from the database (creator bot only)',
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
    
    // Check if the user executing the command is the admin
   if (interaction.user.id !== "714376484139040809") {
      return interaction.reply({
        content: lang.onlyCreatorBot,
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
          title: lang.userNotFoundOnDataBaseTitle,
          description: lang.userNotFoundOnDataBase
                           .replace("{user}", targetUser.id),
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
        title: lang.succesfulDeletedUserTitle,
        description: lang.succesfulDeletedUserContent
                         .replace("{user}", targetUser.id),
        color: 0x00ff00,
      }],
    });
  }
};
