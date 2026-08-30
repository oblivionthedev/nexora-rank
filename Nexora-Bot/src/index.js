import {
  ActivityType,
  Client,
  Events,
  GatewayIntentBits,
  MessageFlags,
  REST,
  Routes,
} from "discord.js";
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
const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});
const nexora = createNexoraService(config, logger);
const healthServer = startHealthServer({ port: config.port, client, logger });
let securityTimer;
let securityPollActive = false;

async function pollSecurityIncidents() {
  if (securityPollActive || !client.isReady()) return;
  securityPollActive = true;
  try {
    const incidents = await nexora.claimSecurityIncidents();
    if (!incidents.length) return;
    const channel = await client.channels.fetch(config.securityAlertChannelId);
    if (!channel?.isTextBased()) throw new Error("Security alert channel is unavailable or is not text based.");
    for (const incident of incidents) {
      const details = incident.details && typeof incident.details === "object"
        ? Object.entries(incident.details).map(([key, value]) => `${key}: ${String(value)}`).join("\n")
        : "No additional details";
      const alert = embed(
        "Unresolved access incident",
        "Nexora blocked an unauthorized signed-in access attempt. This alert repeats every 60 seconds until a Staff member resolves it in the Security queue.",
        colors.danger,
      ).addFields(
        { name: "Incident", value: `#${incident.id} · ${String(incident.scope).replaceAll("_", " ")}`, inline: true },
        { name: "Occurrences", value: String(incident.occurrence_count ?? 1), inline: true },
        { name: "Account", value: incident.actor_email || incident.actor_user_id || "Unknown", inline: false },
        { name: "Target", value: incident.target_ref || "Nexora", inline: false },
        { name: "Details", value: details.slice(0, 1000) || "No additional details", inline: false },
      );
      await channel.send({
        content: `<@&${config.securityPingRoleId}>`,
        embeds: [alert],
        allowedMentions: { roles: [config.securityPingRoleId] },
      });
    }
  } catch (error) {
    logger.error("Security alert poll failed", { error: error?.stack || String(error) });
  } finally {
    securityPollActive = false;
  }
}

async function registerCommands(guildId = config.discordGuildId) {
  const rest = new REST({ version: "10" }).setToken(config.discordToken);
  const publicBody = commands
    .filter((command) => !command.staffOnly)
    .map((command) => command.data.toJSON());
  const staffBody = commands
    .filter((command) => command.staffOnly)
    .map((command) => command.data.toJSON());

  if (guildId) {
    await rest.put(
      Routes.applicationGuildCommands(config.discordClientId, guildId),
      {
        body:
          guildId === config.staffGuildId
            ? [...publicBody, ...staffBody]
            : publicBody,
      },
    );
    logger.info("Discord commands registered", {
      count: publicBody.length,
      scope: "server",
      guildId,
    });
  } else {
    await rest.put(Routes.applicationCommands(config.discordClientId), {
      body: publicBody,
    });
    logger.info("Discord commands registered", {
      count: publicBody.length,
      scope: "global",
    });
  }
  if (guildId !== config.staffGuildId) {
    await rest.put(
      Routes.applicationGuildCommands(
        config.discordClientId,
        config.staffGuildId,
      ),
      { body: [...publicBody, ...staffBody] },
    );
    logger.info("Private Staff commands registered", {
      count: staffBody.length,
      guildId: config.staffGuildId,
    });
  }
}

client.once(Events.ClientReady, async (readyClient) => {
  readyClient.user.setPresence({
    activities: [
      { name: "/help · nexorarank.tech", type: ActivityType.Watching },
    ],
    status: "online",
  });
  logger.info("Nexora Bot connected", {
    user: readyClient.user.tag,
    guilds: readyClient.guilds.cache.size,
    commands: commandMap.size,
  });
  await pollSecurityIncidents();
  securityTimer = setInterval(pollSecurityIncidents, 60_000);
  securityTimer.unref();
});

client.on(Events.GuildCreate, (guild) =>
  logger.info("Nexora added to server", {
    guildId: guild.id,
    guildName: guild.name,
  }),
);

client.on(Events.InteractionCreate, async (interaction) => {
  if (interaction.isAutocomplete()) {
    const command = commandMap.get(interaction.commandName);
    if (!command?.autocomplete) return;
    try {
      await command.autocomplete(interaction, { config, nexora, logger });
    } catch (error) {
      logger.warn("Autocomplete failed", {
        command: interaction.commandName,
        code: error.code,
      });
      await interaction.respond([]).catch(() => undefined);
    }
    return;
  }
  if (!interaction.isChatInputCommand()) return;
  const command = commandMap.get(interaction.commandName);
  if (!command) return;

  const remaining = consumeCooldown(
    `${interaction.user.id}:${interaction.commandName}`,
  );
  if (remaining > 0) {
    await interaction.reply({
      content: `Please wait ${(remaining / 1000).toFixed(1)} seconds before using that command again.`,
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  try {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    await command.execute(interaction, { config, nexora, logger });
    logger.info("Command completed", {
      command: interaction.commandName,
      guildId: interaction.guildId,
      userId: interaction.user.id,
    });
  } catch (error) {
    const isUserError = error instanceof UserError;
    logger[isUserError ? "warn" : "error"]("Command failed", {
      command: interaction.commandName,
      guildId: interaction.guildId,
      userId: interaction.user.id,
      code: error.code,
      error: isUserError ? error.message : error.stack,
    });
    const response = embed(
      isUserError ? "Request unavailable" : "Something went wrong",
      isUserError
        ? error.message
        : "Nexora could not complete that request. The error was logged.",
      isUserError ? colors.warning : colors.danger,
    );
    if (interaction.deferred || interaction.replied)
      await interaction.editReply({ embeds: [response] }).catch(() => undefined);
    else
      await interaction.reply({ embeds: [response], flags: MessageFlags.Ephemeral }).catch(() => undefined);
  }
});

client.on(Events.Error, (error) =>
  logger.error("Discord client error", { error: error.stack }),
);
process.on("unhandledRejection", (error) =>
  logger.error("Unhandled promise rejection", {
    error: error?.stack || String(error),
  }),
);
process.on("uncaughtException", (error) =>
  logger.error("Uncaught exception", { error: error.stack }),
);

async function shutdown(signal) {
  logger.info("Shutting down Nexora Bot", { signal });
  if (securityTimer) clearInterval(securityTimer);
  healthServer.close();
  client.destroy();
  process.exit(0);
}

process.once("SIGINT", () => shutdown("SIGINT"));
process.once("SIGTERM", () => shutdown("SIGTERM"));

await registerCommands();
await client.login(config.discordToken);
