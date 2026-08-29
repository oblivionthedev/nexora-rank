import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { z } from "zod";

const directory = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(directory, ".env"), quiet: true });

const discordId = z.string().regex(/^\d{17,22}$/);
const schema = z.object({
  DISCORD_TOKEN: z.string().min(20, "Add DISCORD_TOKEN to config/.env"),
  DISCORD_CLIENT_ID: discordId,
  SUPPORT_GUILD_ID: discordId,
  PORT: z.coerce.number().int().min(1).max(65535).default(3002),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
});

export function loadConfig(environment = process.env) {
  const result = schema.safeParse(environment);
  if (!result.success) {
    const problems = result.error.issues
      .map((issue) => `- ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    throw new Error(`Nexora Support configuration is incomplete:\n${problems}`);
  }
  return {
    discordToken: result.data.DISCORD_TOKEN,
    discordClientId: result.data.DISCORD_CLIENT_ID,
    supportGuildId: result.data.SUPPORT_GUILD_ID,
    port: result.data.PORT,
    logLevel: result.data.LOG_LEVEL,
  };
}
