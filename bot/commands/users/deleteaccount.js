const { SlashCommandBuilder } = require("discord.js");
const Player = require("../../../mongoDB/Player");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("deleteaccount")
    .setDescription("Permanently delete your account and all associated data"),
  category: "users",
  usage: "Delete your account after confirmation",
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
    
    const userId = interaction.user.id;

    // Primera confirmación
    await interaction.reply({
      content:
        lang.deleteAccountStep1,
      ephemeral: true,
    });

    // Recibir la respuesta del usuario
    const filter = (m) =>
      m.author.id === userId && m.content.toLowerCase() === "confirm";
    const collector = interaction.channel.createMessageCollector({
      filter,
      max: 1,
      time: 30000,
    }); // 30 seconds

    collector.on("collect", async (m) => {
      // Segunda confirmación
      await interaction.followUp({
        content:
          lang.deleteAccountStep2,
        ephemeral: true,
      });

      // Recibir la segunda respuesta del usuario
      const secondCollector = interaction.channel.createMessageCollector({
        filter,
        max: 1,
        time: 30000,
      }); // 30 seconds

      secondCollector.on("collect", async (m) => {
        // Eliminar datos del usuario
        await Player.deleteOne({ userId: userId });

        await interaction.followUp({
          content:
            lang.deletedAccountSuc,
          ephemeral: true,
        });
      });

      secondCollector.on("end", (collected) => {
        if (collected.size === 0) {
          interaction.followUp({
            content: lang.deletedAccountTimeOut,
            ephemeral: true,
          });
        }
      });
    });

    collector.on("end", (collected) => {
      if (collected.size === 0) {
        interaction.followUp({
          content: lang.deletedAccountTimeOut,
          ephemeral: true,
        });
      }
    });
  },
};
