const { SlashCommandBuilder } = require("discord.js");
const Player = require("../../../mongoDB/Player");
const Guild = require("../../../mongoDB/Guild");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("sell")
    .setDescription("Sell your balloons and mobiles for coins")
    .addStringOption((option) =>
      option
        .setName("item")
        .setDescription("Choose an item to sell")
        .setRequired(true)
        .addChoices(
          { name: "Balloon", value: "balloon" },
          { name: "Mobile", value: "mobile" }
        )
    )
    .addIntegerOption((option) =>
      option
        .setName("quantity")
        .setDescription("Amount of items to sell")
        .setRequired(true)
    ),
  category: "economy",
  usage: "Sell an item to gain coins",
  async execute(interaction, client) {
    const item = interaction.options.getString("item");
    const quantity = interaction.options.getInteger("quantity");

    let guildLang = await Guild.findOne({ guildId: interaction.guild.id });
    if(!guildLang) {
      guildLang = new Guild ({
        guildId: interaction.guild.id,
        lang: "en",
      });
    }
    
    await guildLang.save();

    const lang = require(`../../languages/${guildLang.lang}.json`);

    let player = await Player.findOne({ userId: interaction.user.id });
    if (!player) {
      return interaction.reply({
        embeds: [
          {
            title: lang.nothingToSellTitle,
            description: lang.nothingToSellContent,
            color: 0xff0000,
          },
        ],
        ephemeral: true,
      });
    }

    let amountGained = 0; // Amount gained from selling

    if (item === "balloon") {
      if (player.swag.balloons >= quantity) {
        player.swag.balloons -= quantity; // Decrease the number of balloons
        amountGained = quantity * 50; // Amount gained from selling balloons
      } else {
        return interaction.reply({
          embeds: [
            {
              title: lang.errorBalloonSellTitle,
              description: lang.errorBalloonSellContent
                               .replace("{balloon}", player.swag.balloons),
              color: 0xff0000,
            },
          ],
          ephemeral: true,
        });
      }
    } else if (item === "mobile") {
      if (player.swag.mobile >= quantity) {
        player.swag.mobile -= quantity; // Decrease the number of mobiles
        amountGained = quantity * 200; // Amount gained from selling mobiles
      } else {
        return interaction.reply({
          embeds: [
            {
              title: lang.errorMobileSellTitle,
              description: lang.errorMobileSellContent
                               .replace("{mobile}", player.swag.mobile),
              color: 0xff0000,
            },
          ],
          ephemeral: true,
        });
      }
    }

    player.balance += amountGained; // Add the gained amount to the player's balance
    await player.save(); // Save the updated player data

    await interaction.reply({
      embeds: [
        {
          title: lang.succesfulSellTitle,
          description: lang.succesfulSellContent
                           .replace("{quantity}",quantity)
                           .replace("{item}", item === "balloon" ? "balloon" : "mobile")
                           .replace("{plural}", quantity > 1 ? "s" : "")
                           .replace("{amount", amountGained.toLocaleString()),
          fields: [
            {
              name: lang.succesfulSellFiledTitle,
              value: `${player.balance.toLocaleString()} 💰`,
              inline: false,
            },
            {
              name: lang.balloonTitle,
              value: `${player.swag.balloons.toLocaleString()} 🎈`,
              inline: false,
            },
            {
              name: lang.mobileTitle,
              value: `${player.swag.mobile.toLocaleString()} 📱`,
              inline: false,
            },
          ],
          color: 0x00ff00,
        },
      ],
    });
  },
};
