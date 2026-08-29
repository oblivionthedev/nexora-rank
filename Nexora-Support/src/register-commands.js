import { REST, Routes } from "discord.js";
import { loadConfig } from "../config/index.js";
import { commands } from "./commands/index.js";

const config = loadConfig();
const rest = new REST({ version: "10" }).setToken(config.discordToken);
await rest.put(
  Routes.applicationGuildCommands(
    config.discordClientId,
    config.supportGuildId,
  ),
  { body: commands.map((command) => command.data.toJSON()) },
);
console.log(`Registered ${commands.length} Nexora Support commands.`);
