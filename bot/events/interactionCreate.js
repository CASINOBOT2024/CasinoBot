const { Events } = require("discord.js");
const Guild = require("../../mongoDB/Guild");

module.exports = {
  name: Events.InteractionCreate,
  once: false,
  async execute(interaction, client) {
    
    let guildLang = await Guild.findOne({ guildId: interaction.guild.id });
    if(!guildLang) {
      guildLang = new Guild ({
        guildId: interaction.guild.id,
        lang: "en",
      });
    }
    
    await guildLang.save();

    const lang = require(`../languages/${guildLang.lang}.json`);
    
    if (!interaction.isChatInputCommand()) return;
    const command = client.commands.get(interaction.commandName);

    if (!command) return;

    try {
      await command.execute(interaction, client);
    } catch (error) {
      console.log(error);
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({
          content: lang.errorCommand,
          ephemeral: true,
        });
      } else {
        console.log(error);
        await interaction.reply({
          content: lang.errorCommand,
          ephemeral: true,
        });
      }
    }
  },
};
