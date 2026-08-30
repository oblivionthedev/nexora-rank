const DISCORD_API = "https://discord.com/api/v10";

export type DiscordRoleOption = {
  id: string;
  name: string;
  color: number;
  position: number;
};

export type DiscordChannelOption = {
  id: string;
  name: string;
  position: number;
};

type DiscordRole = DiscordRoleOption & { managed?: boolean };
type DiscordChannel = DiscordChannelOption & { type: number; parent_id?: string };

export async function listDiscordWorkspaceResources(guildId?: string | null) {
  const token = process.env.DISCORD_BOT_TOKEN?.trim();
  if (!token || !guildId) return { roles: [], channels: [], available: false };

  const headers = { Authorization: `Bot ${token}` };
  try {
    const [rolesResponse, channelsResponse] = await Promise.all([
      fetch(`${DISCORD_API}/guilds/${guildId}/roles`, {
        headers,
        cache: "no-store",
        signal: AbortSignal.timeout(10_000),
      }),
      fetch(`${DISCORD_API}/guilds/${guildId}/channels`, {
        headers,
        cache: "no-store",
        signal: AbortSignal.timeout(10_000),
      }),
    ]);

    if (!rolesResponse.ok || !channelsResponse.ok)
      return { roles: [], channels: [], available: false };

    const roles = ((await rolesResponse.json()) as DiscordRole[])
      .filter((role) => role.name !== "@everyone" && !role.managed)
      .sort((left, right) => right.position - left.position)
      .map(({ id, name, color, position }) => ({ id, name, color, position }));
    const channels = ((await channelsResponse.json()) as DiscordChannel[])
      .filter((channel) => channel.type === 0 || channel.type === 5)
      .sort((left, right) => left.position - right.position)
      .map(({ id, name, position }) => ({ id, name, position }));

    return { roles, channels, available: true };
  } catch {
    return { roles: [], channels: [], available: false };
  }
}

export async function assignDiscordGuildRole({
  guildId,
  userId,
  roleId,
}: {
  guildId: string;
  userId: string;
  roleId: string;
}) {
  const token = process.env.DISCORD_BOT_TOKEN?.trim();
  if (!token) return { ok: false as const, error: "bot_not_configured" };
  try {
    const response = await fetch(
      `${DISCORD_API}/guilds/${guildId}/members/${userId}/roles/${roleId}`,
      {
        method: "PUT",
        headers: { Authorization: `Bot ${token}` },
        cache: "no-store",
        signal: AbortSignal.timeout(10_000),
      },
    );
    if (response.status === 404)
      return { ok: false as const, error: "discord_member_not_found" };
    if (response.status === 401 || response.status === 403)
      return { ok: false as const, error: "discord_role_permission_missing" };
    return response.ok
      ? { ok: true as const }
      : { ok: false as const, error: "discord_role_failed" };
  } catch {
    return { ok: false as const, error: "discord_unavailable" };
  }
}

export async function removeDiscordGuildRole({
  guildId,
  userId,
  roleId,
}: {
  guildId: string;
  userId: string;
  roleId: string;
}) {
  const token = process.env.DISCORD_BOT_TOKEN?.trim();
  if (!token) return { ok: false as const, error: "bot_not_configured" };
  try {
    const response = await fetch(
      `${DISCORD_API}/guilds/${guildId}/members/${userId}/roles/${roleId}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bot ${token}` },
        cache: "no-store",
        signal: AbortSignal.timeout(10_000),
      },
    );
    if (response.status === 404) return { ok: true as const };
    if (response.status === 401 || response.status === 403)
      return { ok: false as const, error: "discord_role_permission_missing" };
    return response.ok
      ? { ok: true as const }
      : { ok: false as const, error: "discord_role_failed" };
  } catch {
    return { ok: false as const, error: "discord_unavailable" };
  }
}
