const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const fs = require("fs");
const path = require("path");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("help")
    .setDescription("Show available commands"),
  category: "utils",
  async execute(interaction, client) {
    // Read command files and categorize them
    const commandFolders = fs.readdirSync(
      path.join(__dirname, "..", "..", "commands")
    );
    const commandCategories = {};

    for (const folder of commandFolders) {
      const commandFiles = fs
        .readdirSync(path.join(__dirname, "..", "..", "commands", folder))
        .filter((file) => file.endsWith(".js"));

      commandCategories[folder] = [];
      for (const file of commandFiles) {
        const command = require(path.join(
          __dirname,
          "..",
          "..",
          "commands",
          folder,
          file
        ));
        commandCategories[folder].push(command);
      }
    }

    // Create a message for each category
    const categoryEmbeds = Object.entries(commandCategories).map(
      ([category, commands]) => {
        const commandList = commands
          .map(
            (command) =>
              `**/${command.data.name}**: ${command.data.description}`
          )
          .join("\n");
        return {
          title: `🛠️ ${
            category.charAt(0).toUpperCase() + category.slice(1)
          } Commands`,
          description: commandList || "No commands available.",
          color: 0x3498db,
        };
      }
    );

    // Define emoji buttons for each category
    const categoryEmojis = ["💰", "🎮", "⚙️", "👤"]; // Replace with your actual emojis for categories
    const row = new ActionRowBuilder();

    categoryEmojis.forEach((emoji, index) => {
      row.addComponents(
        new ButtonBuilder()
          .setCustomId(`category_${index}`)
          .setLabel(`${emoji}`)
          .setStyle(ButtonStyle.Primary)
      );
    });

    // Create and send a welcome embed
    const welcomeEmbed = {
      title: "Welcome to the Help Section!",
      description:
        "Here you can find all available commands. Choose a category below to explore.",
      color: 0x3498db,
    };

    await interaction.reply({ embeds: [welcomeEmbed], components: [row] });

    const message = await interaction.fetchReply();

    // Button interaction to cycle through categories
    const collector = message.createMessageComponentCollector({ time: 60000 });

    collector.on("collect", async (buttonInteraction) => {
      const index = parseInt(buttonInteraction.customId.split("_")[1]);

      if (index >= 0 && index < categoryEmbeds.length) {
        await buttonInteraction.update({ embeds: [categoryEmbeds[index]] });
      }
    });

    collector.on("end", () => {
      message.edit({ components: [] }); // Disable the buttons after the time expires
    });
  },
};
