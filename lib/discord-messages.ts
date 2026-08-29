const DISCORD_API = "https://discord.com/api/v10";
const MESSAGE_CHANNEL_TYPES = new Set([0, 5, 10, 11, 12]);

export type DiscordMessageError =
  | "bot_not_configured"
  | "discord_channel_not_found"
  | "discord_channel_wrong_server"
  | "discord_channel_unsupported"
  | "discord_branding_permission_missing"
  | "discord_permission_missing"
  | "discord_unavailable"
  | "discord_send_failed";

type DiscordChannel = { guild_id?: string; type?: number };
type DiscordMessage = { id?: string };
export type DiscordEmbed = {
  title?: string;
  description: string;
  color: number;
  author?: { name: string; icon_url?: string };
  footer?: { text: string };
  thumbnail?: { url: string };
};

export async function sendDiscordChannelMessage({
  token,
  guildId,
  channelId,
  content,
  embed,
  botNickname,
  fetchImpl = fetch,
}: {
  token: string;
  guildId: string;
  channelId: string;
  content: string;
  embed?: DiscordEmbed;
  botNickname?: string;
  fetchImpl?: typeof fetch;
}): Promise<{ ok: true; messageId: string | null } | { ok: false; error: DiscordMessageError }> {
  if (!token) return { ok: false, error: "bot_not_configured" };

  const headers = { Authorization: `Bot ${token}` };
  let channelResponse: Response;
  try {
    channelResponse = await fetchImpl(`${DISCORD_API}/channels/${channelId}`, {
      headers,
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    return { ok: false, error: "discord_unavailable" };
  }

  if (channelResponse.status === 404) return { ok: false, error: "discord_channel_not_found" };
  if (channelResponse.status === 401 || channelResponse.status === 403) return { ok: false, error: "discord_permission_missing" };
  if (!channelResponse.ok) return { ok: false, error: "discord_unavailable" };

  const channel = await channelResponse.json() as DiscordChannel;
  if (channel.guild_id !== guildId) return { ok: false, error: "discord_channel_wrong_server" };
  if (!MESSAGE_CHANNEL_TYPES.has(channel.type ?? -1)) return { ok: false, error: "discord_channel_unsupported" };

  if (botNickname) {
    let nicknameResponse: Response;
    try {
      nicknameResponse = await fetchImpl(`${DISCORD_API}/guilds/${guildId}/members/@me`, {
        method: "PATCH",
        headers: { ...headers, "content-type": "application/json" },
        body: JSON.stringify({ nick: botNickname }),
        cache: "no-store",
        signal: AbortSignal.timeout(10_000),
      });
    } catch {
      return { ok: false, error: "discord_unavailable" };
    }
    if (nicknameResponse.status === 401 || nicknameResponse.status === 403) return { ok: false, error: "discord_branding_permission_missing" };
    if (!nicknameResponse.ok) return { ok: false, error: "discord_send_failed" };
  }

  let messageResponse: Response;
  try {
    messageResponse = await fetchImpl(`${DISCORD_API}/channels/${channelId}/messages`, {
      method: "POST",
      headers: { ...headers, "content-type": "application/json" },
      body: JSON.stringify({
        content: embed ? undefined : content,
        embeds: embed ? [embed] : undefined,
        allowed_mentions: { parse: [] },
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    return { ok: false, error: "discord_unavailable" };
  }

  if (messageResponse.status === 401 || messageResponse.status === 403) return { ok: false, error: "discord_permission_missing" };
  if (!messageResponse.ok) return { ok: false, error: "discord_send_failed" };
  const message = await messageResponse.json().catch(() => null) as DiscordMessage | null;
  return { ok: true, messageId: message?.id ?? null };
}
