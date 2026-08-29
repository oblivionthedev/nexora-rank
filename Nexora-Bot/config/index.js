import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { z } from "zod";

const configDirectory = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(configDirectory, ".env"), quiet: true });

const NEXORA_DISCORD_CLIENT_ID = "1542533178554585099";
const NEXORA_STAFF_GUILD_ID = "1542617161825255474";
const discordId = z.string().regex(/^\d{17,22}$/);

const schema = z.object({
  DISCORD_TOKEN: z.string().min(20, "Add DISCORD_TOKEN to config/.env"),
  DISCORD_GUILD_ID: z.preprocess((value) => {
    const candidate = String(value ?? "").trim();
    return /^\d{17,22}$/.test(candidate) ? candidate : "";
  }, z.literal("").or(discordId)),
  SUPABASE_URL: z.url().startsWith("https://"),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(30, "Add SUPABASE_SERVICE_ROLE_KEY to config/.env"),
  NEXORA_SITE_URL: z.url().startsWith("https://").default("https://www.nexorarank.tech"),
  PORT: z.coerce.number().int().min(1).max(65535).default(3001),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
});

export function loadConfig(environment = process.env) {
  const result = schema.safeParse(environment);
  if (!result.success) {
    const problems = result.error.issues.map((issue) => `- ${issue.path.join(".") || "configuration"}: ${issue.message}`).join("\n");
    throw new Error(`Nexora Bot configuration is incomplete:\n${problems}`);
  }

  return {
    discordToken: result.data.DISCORD_TOKEN,
    discordClientId: NEXORA_DISCORD_CLIENT_ID,
    discordGuildId: result.data.DISCORD_GUILD_ID || null,
    staffGuildId: NEXORA_STAFF_GUILD_ID,
    supabaseUrl: result.data.SUPABASE_URL.replace(/\/$/, ""),
    supabaseServiceRoleKey: result.data.SUPABASE_SERVICE_ROLE_KEY,
    siteUrl: result.data.NEXORA_SITE_URL.replace(/\/$/, ""),
    port: result.data.PORT,
    logLevel: result.data.LOG_LEVEL,
  };
}
