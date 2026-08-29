import {
  sendDiscordChannelMessage,
  type DiscordEmbed,
} from "@/lib/discord-messages";

export const NEXORA_LOG_CHANNELS = {
  betaSubmissions: "1543327164118728704",
  workspacesCreated: "1543328201034702929",
  providerStatus: "1543328254453223434",
  purchasedPlans: null,
} as const;

export async function sendNexoraOperationalLog(
  channelId: string,
  embed: DiscordEmbed,
) {
  return sendDiscordChannelMessage({
    token: process.env.DISCORD_BOT_TOKEN || "",
    channelId,
    content: "",
    embed,
  });
}

export function nexoraLogBrand(label: string) {
  return {
    name: label,
    icon_url: "https://www.nexorarank.tech/nexora-discord-logo.png",
  };
}
