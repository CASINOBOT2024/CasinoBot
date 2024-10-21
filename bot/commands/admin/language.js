const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const Guild = require("../../../mongoDB/Guild");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("language")
    .setDescription("Change the language of the bot")
    .addStringOption((option) =>
      option
        .setName("lang")
        .setDescription("Choose the language")
        .setRequired(false) // Make this option not required
        .addChoices(
          { name: '🇪🇸 Spanish', value: 'es' },
          { name: '🇺🇸 English', value: 'en' },
        )
    )
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  category: "admin",
  usage: "Change the language of the bot",
  async execute(interaction, client) {

  const selectLang = interaction.options.getString("lang");
    
  let guildLang = await Guild.findOne({ guildId: interaction.guild.id });
    if(!guildLang) {
      guildLang = new Guild({
        guildId: interaction.guild.id,
        lang: "en",
      });
    }
  const lang = require(`../../languages/${guildLang.lang}.json`);

    if(guildLang.lang == item) {
      return interaction.reply({
        content: lang.sameLang
      })
    }
    
    await guildLang.save();

    await guildLang.lang = selectLang;

    await guildLang.save();
    return interaction.reply({
      content: lang.succesfulChangeLanguage
                   .replace("{language}", selectLang == "es" ? "🇪🇸 Español" : "🇺🇸 English"),
      color: 0x00ff00,
        },
    });
    }
  }
}
