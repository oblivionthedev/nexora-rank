import { REST, Routes } from "discord.js";
import { loadConfig } from "../config/index.js";
import { commands } from "./commands/index.js";

const config = loadConfig();
const rest = new REST({ version: "10" }).setToken(config.discordToken);
const body = commands.map((command) => command.data.toJSON());

if (config.discordGuildId) {
  await rest.put(Routes.applicationGuildCommands(config.discordClientId, config.discordGuildId), { body });
  console.log(`Registered ${body.length} commands in development server ${config.discordGuildId}.`);
} else {
  await rest.put(Routes.applicationCommands(config.discordClientId), { body });
  console.log(`Registered ${body.length} global commands.`);
}
