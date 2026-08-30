import { REST, Routes } from "discord.js";
import { loadConfig } from "../config/index.js";
import { commands } from "./commands/index.js";

const config = loadConfig();
const rest = new REST({ version: "10" }).setToken(config.discordToken);
const publicBody = commands.filter((command) => !command.staffOnly).map((command) => command.data.toJSON());
const staffBody = commands.filter((command) => command.staffOnly).map((command) => command.data.toJSON());

if (config.discordGuildId) {
  await rest.put(Routes.applicationGuildCommands(config.discordClientId, config.discordGuildId), { body: config.discordGuildId === config.staffGuildId ? [...publicBody, ...staffBody] : publicBody });
  console.log(`Registered ${publicBody.length} public commands in development server ${config.discordGuildId}.`);
} else {
  await rest.put(Routes.applicationCommands(config.discordClientId), { body: publicBody });
  console.log(`Registered ${publicBody.length} global commands.`);
}
if (config.discordGuildId !== config.staffGuildId) {
  await rest.put(Routes.applicationGuildCommands(config.discordClientId, config.staffGuildId), { body: [...publicBody, ...staffBody] });
  console.log(`Registered ${publicBody.length + staffBody.length} commands in the Nexora Staff server.`);
}
