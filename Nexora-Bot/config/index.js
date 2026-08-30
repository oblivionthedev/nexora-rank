import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { z } from "zod";

const configDirectory = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(configDirectory, ".env"), quiet: true });

const NEXORA_DISCORD_CLIENT_ID = "1542533178554585099";
const NEXORA_STAFF_GUILD_ID = "1542617161825255474";
const NEXORA_AUTHORIZATION_OWNER_ID = "1515743540259328202";
const NEXORA_BETA_LOG_CHANNEL_ID = "1543327164118728704";
const NEXORA_WORKSPACE_LOG_CHANNEL_ID = "1543328201034702929";
const NEXORA_PROVIDER_STATUS_CHANNEL_ID = "1543328254453223434";
const NEXORA_BETA_ROLE_ID = "1543356004316614687";
const NEXORA_VERIFIED_ROLE_ID = "1543357165836705883";
const NEXORA_WORKSPACE_OWNER_ROLE_ID = "1543357235185324123";
const NEXORA_SECURITY_ALERT_CHANNEL_ID = "1543592799981535302";
const NEXORA_SECURITY_PING_ROLE_ID = "1543625600919404604";
const discordId = z.string().regex(/^\d{17,22}$/);

const schema = z.object({
  DISCORD_TOKEN: z.string().min(20, "Add DISCORD_TOKEN to config/.env"),
  DISCORD_GUILD_ID: z.preprocess((value) => {
    const candidate = String(value ?? "").trim();
    return /^\d{17,22}$/.test(candidate) ? candidate : "";
  }, z.literal("").or(discordId)),
  SUPABASE_URL: z.url().startsWith("https://"),
  SUPABASE_SERVICE_ROLE_KEY: z
    .string()
    .min(30, "Add SUPABASE_SERVICE_ROLE_KEY to config/.env"),
  NEXORA_SITE_URL: z
    .url()
    .startsWith("https://")
    .default("https://www.nexorarank.tech"),
  PORT: z.coerce.number().int().min(1).max(65535).default(3001),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
});

export function loadConfig(environment = process.env) {
  const result = schema.safeParse(environment);
  if (!result.success) {
    const problems = result.error.issues
      .map(
        (issue) =>
          `- ${issue.path.join(".") || "configuration"}: ${issue.message}`,
      )
      .join("\n");
    throw new Error(`Nexora Bot configuration is incomplete:\n${problems}`);
  }

  return {
    discordToken: result.data.DISCORD_TOKEN,
    discordClientId: NEXORA_DISCORD_CLIENT_ID,
    discordGuildId: result.data.DISCORD_GUILD_ID || null,
    staffGuildId: NEXORA_STAFF_GUILD_ID,
    authorizationOwnerId: NEXORA_AUTHORIZATION_OWNER_ID,
    betaLogChannelId: NEXORA_BETA_LOG_CHANNEL_ID,
    workspaceLogChannelId: NEXORA_WORKSPACE_LOG_CHANNEL_ID,
    providerStatusChannelId: NEXORA_PROVIDER_STATUS_CHANNEL_ID,
    betaRoleId: NEXORA_BETA_ROLE_ID,
    verifiedRoleId: NEXORA_VERIFIED_ROLE_ID,
    workspaceOwnerRoleId: NEXORA_WORKSPACE_OWNER_ROLE_ID,
    securityAlertChannelId: NEXORA_SECURITY_ALERT_CHANNEL_ID,
    securityPingRoleId: NEXORA_SECURITY_PING_ROLE_ID,
    purchasedPlansChannelId: null,
    supabaseUrl: result.data.SUPABASE_URL.replace(/\/$/, ""),
    supabaseServiceRoleKey: result.data.SUPABASE_SERVICE_ROLE_KEY,
    siteUrl: result.data.NEXORA_SITE_URL.replace(/\/$/, ""),
    port: result.data.PORT,
    logLevel: result.data.LOG_LEVEL,
  };
}
