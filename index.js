const {
  Client,
  Collection,
  Partials,
  GatewayIntentBits,
  ActivityType
} = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildEmojisAndStickers,
    GatewayIntentBits.GuildIntegrations,
    GatewayIntentBits.GuildWebhooks,
    GatewayIntentBits.GuildInvites,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildMessageTyping,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.DirectMessageReactions,
    GatewayIntentBits.DirectMessageTyping,
    GatewayIntentBits.MessageContent,
  ],
  partials: [
    Partials.Message,
    Partials.Channel,
    Partials.GuildMember,
    Partials.Reaction,
    Partials.GuildScheduledEvent,
    Partials.User,
    Partials.ThreadMember,
  ],
  shards: "auto",
  allowedMentions: {
    parse: ["users", "roles"],
    repliedUser: true,
  },
});

client.commands = new Collection();

require("dotenv").config();

client.once("ready" , async (client) => {
  client.user.setPresence({
    activities: [
      {
        name: "steal your money",
        type: ActivityType.Playing,
      },
    ],
    status: "online",
  });
});


const Errors = require("./initMain/handlerErrors.js");
const KeepAlive = require("./initMain/keepAlive.js");
const MongoDB = require("./initMain/mongoDB.js");
const Events = require("./initMain/handlerEvents.js");
const SlashCommands = require("./initMain/handlerSlashCommands.js");

async function main(client) {
  //await Errors();
  await client.login(process.env.BOT_TOKEN);
  await KeepAlive();
  await MongoDB();
  await Events(client);
  await SlashCommands(client);
}

main(client);
