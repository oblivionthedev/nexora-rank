import { ActivityType, Client, Events, GatewayIntentBits, MessageFlags, REST, Routes } from "discord.js";
import { loadConfig } from "../config/index.js";
import { commands, commandMap } from "./commands/index.js";
import { UserError } from "./lib/errors.js";
import { consumeCooldown } from "./lib/cooldown.js";
import { startHealthServer } from "./lib/health-server.js";
import { createLogger } from "./lib/logger.js";
import { colors, embed } from "./lib/response.js";
import { createNexoraService } from "./services/nexora.js";

const config = loadConfig();
const logger = createLogger(config.logLevel);
const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const nexora = createNexoraService(config, logger);
const healthServer = startHealthServer({ port: config.port, client, logger });

async function registerCommands(guildId = config.discordGuildId) {
  const rest = new REST({ version: "10" }).setToken(config.discordToken);
  const body = commands.map((command) => command.data.toJSON());

  if (guildId) {
    await rest.put(
      Routes.applicationGuildCommands(config.discordClientId, guildId),
      { body },
    );
    logger.info("Discord commands registered", {
      count: body.length,
      scope: "server",
      guildId,
    });
    return;
  }

  await rest.put(Routes.applicationCommands(config.discordClientId), { body });
  logger.info("Discord commands registered", { count: body.length, scope: "global" });
}

client.once(Events.ClientReady, async (readyClient) => {
  readyClient.user.setPresence({ activities: [{ name: "/help · nexorarank.tech", type: ActivityType.Watching }], status: "online" });
  logger.info("Nexora Bot connected", { user: readyClient.user.tag, guilds: readyClient.guilds.cache.size, commands: commandMap.size });
});

client.on(Events.GuildCreate, (guild) => logger.info("Nexora added to server", { guildId: guild.id, guildName: guild.name }));

client.on(Events.InteractionCreate, async (interaction) => {
  if (interaction.isAutocomplete()) {
    const command = commandMap.get(interaction.commandName);
    if (!command?.autocomplete) return;
    try { await command.autocomplete(interaction, { config, nexora, logger }); }
    catch (error) { logger.warn("Autocomplete failed", { command: interaction.commandName, code: error.code }); await interaction.respond([]).catch(() => undefined); }
    return;
  }
  if (!interaction.isChatInputCommand()) return;
  const command = commandMap.get(interaction.commandName);
  if (!command) return;

  const remaining = consumeCooldown(`${interaction.user.id}:${interaction.commandName}`);
  if (remaining > 0) {
    await interaction.reply({ content: `Please wait ${(remaining / 1000).toFixed(1)} seconds before using that command again.`, flags: MessageFlags.Ephemeral });
    return;
  }

  await interaction.deferReply({ flags: MessageFlags.Ephemeral });
  try {
    await command.execute(interaction, { config, nexora, logger });
    logger.info("Command completed", { command: interaction.commandName, guildId: interaction.guildId, userId: interaction.user.id });
  } catch (error) {
    const isUserError = error instanceof UserError;
    logger[isUserError ? "warn" : "error"]("Command failed", {
      command: interaction.commandName,
      guildId: interaction.guildId,
      userId: interaction.user.id,
      code: error.code,
      error: isUserError ? error.message : error.stack,
    });
    const response = embed(isUserError ? "Request unavailable" : "Something went wrong", isUserError ? error.message : "Nexora could not complete that request. The error was logged.", isUserError ? colors.warning : colors.danger);
    await interaction.editReply({ embeds: [response] }).catch(() => undefined);
  }
});

client.on(Events.Error, (error) => logger.error("Discord client error", { error: error.stack }));
process.on("unhandledRejection", (error) => logger.error("Unhandled promise rejection", { error: error?.stack || String(error) }));
process.on("uncaughtException", (error) => logger.error("Uncaught exception", { error: error.stack }));

async function shutdown(signal) {
  logger.info("Shutting down Nexora Bot", { signal });
  healthServer.close();
  client.destroy();
  process.exit(0);
}

process.once("SIGINT", () => shutdown("SIGINT"));
process.once("SIGTERM", () => shutdown("SIGTERM"));

await registerCommands();
await client.login(config.discordToken);
