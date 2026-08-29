import {
  ActivityType,
  Client,
  Events,
  GatewayIntentBits,
  MessageFlags,
  Partials,
  PermissionFlagsBits,
  REST,
  Routes,
} from "discord.js";
import { loadConfig } from "../config/index.js";
import { commands, commandMap } from "./commands/index.js";
import { startHealthServer } from "./lib/health-server.js";
import { createLogger } from "./lib/logger.js";
import { supportEmbed } from "./lib/response.js";
import { createSupportService } from "./services/support.js";

const config = loadConfig();
const logger = createLogger(config.logLevel);
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Channel],
});
const support = createSupportService(client, config, logger);
const healthServer = startHealthServer({ port: config.port, client, logger });

client.once(Events.ClientReady, (readyClient) => {
  readyClient.user.setPresence({
    activities: [
      { name: "your DMs · Nexora Support", type: ActivityType.Listening },
    ],
    status: "online",
  });
  logger.info("Nexora Support connected", { user: readyClient.user.tag });
});

client.on(Events.InteractionCreate, async (interaction) => {
  try {
    if (interaction.isButton() && interaction.customId.startsWith("ticket:")) {
      if (interaction.guildId !== config.supportGuildId) return;
      await support.requireAgent(interaction);
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      if (interaction.customId === "ticket:claim") {
        await support.claim(interaction.channel, interaction.user);
        await interaction.editReply({
          embeds: [
            supportEmbed(
              "Ticket claimed",
              "This conversation is assigned to you.",
            ),
          ],
        });
      } else {
        await interaction.editReply({
          embeds: [
            supportEmbed(
              "Closing ticket",
              "Creating the transcript and notifying the member…",
            ),
          ],
        });
        await support.close(interaction.channel, interaction.user);
      }
      return;
    }
    if (!interaction.isChatInputCommand()) return;
    if (interaction.guildId !== config.supportGuildId) return;
    const command = commandMap.get(interaction.commandName);
    if (!command) return;
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    await command.execute(interaction, { config, support, logger });
  } catch (error) {
    const messages = {
      support_not_configured: "Run `/setup` before using the Support system.",
      support_agent_required:
        "You need the Nexora Support role to manage tickets.",
      ticket_required: "Use this action inside an open Support ticket.",
      panel_channel_required: "Choose a text channel for the panel.",
    };
    const description =
      messages[error.message] ||
      "Nexora Support could not complete that action.";
    logger.error("Support action failed", {
      action: interaction.commandName || interaction.customId,
      userId: interaction.user?.id,
      error: error.stack || String(error),
    });
    if (interaction.deferred || interaction.replied) {
      await interaction
        .editReply({
          embeds: [supportEmbed("Action unavailable", description)],
        })
        .catch(() => undefined);
    } else {
      await interaction
        .reply({
          embeds: [supportEmbed("Action unavailable", description)],
          flags: MessageFlags.Ephemeral,
        })
        .catch(() => undefined);
    }
  }
});

client.on(Events.MessageCreate, async (message) => {
  try {
    if (message.author.bot) return;
    if (!message.guild) await support.receiveDm(message);
    else if (message.guild.id === config.supportGuildId)
      await support.relayAgentMessage(message);
  } catch (error) {
    logger.error("Message relay failed", {
      userId: message.author.id,
      channelId: message.channelId,
      error: error.stack || String(error),
    });
    if (!message.guild) {
      await message
        .reply({
          embeds: [
            supportEmbed(
              "Support unavailable",
              "Your message could not be delivered right now. Please try again shortly.",
            ),
          ],
        })
        .catch(() => undefined);
    }
  }
});

client.on(Events.Error, (error) =>
  logger.error("Discord client error", { error: error.stack }),
);
process.on("unhandledRejection", (error) =>
  logger.error("Unhandled rejection", { error: error?.stack || String(error) }),
);

async function shutdown(signal) {
  logger.info("Stopping Nexora Support", { signal });
  healthServer.close();
  client.destroy();
  process.exit(0);
}
process.once("SIGINT", () => shutdown("SIGINT"));
process.once("SIGTERM", () => shutdown("SIGTERM"));

const rest = new REST({ version: "10" }).setToken(config.discordToken);
await rest.put(
  Routes.applicationGuildCommands(
    config.discordClientId,
    config.supportGuildId,
  ),
  { body: commands.map((command) => command.data.toJSON()) },
);
await client.login(config.discordToken);
