import { REST, Routes } from "discord.js";
import { loadConfig } from "../config/index.js";
import { officialServerCommands, publicCommands } from "./commands/index.js";

const config = loadConfig();
const rest = new REST({ version: "10" }).setToken(config.discordToken);
const publicBody = publicCommands.map((command) => command.data.toJSON());
const staffBody = officialServerCommands.map((command) => command.data.toJSON());

await rest.put(Routes.applicationCommands(config.discordClientId), { body: publicBody });
await rest.put(
  Routes.applicationGuildCommands(config.discordClientId, config.staffGuildId),
  { body: staffBody },
);

// Remove old guild-scoped public commands left by the former development mode.
// Their global definitions remain available in every server, including this one.
if (config.discordGuildId && config.discordGuildId !== config.staffGuildId) {
  await rest.put(
    Routes.applicationGuildCommands(config.discordClientId, config.discordGuildId),
    { body: [] },
  );
  console.log(`Cleared legacy guild commands from ${config.discordGuildId}.`);
}

console.log(`Registered ${publicBody.length} public commands globally.`);
console.log(`Registered ${staffBody.length} private commands in the Nexora server.`);
