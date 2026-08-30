export type RobloxGroupDetails = {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  iconUrl: string | null;
  owner: {
    userId: string;
    username: string;
    displayName: string;
  } | null;
};

export type RobloxGroupRole = {
  id: string;
  name: string;
  rank: number;
  memberCount: number;
};

export async function getRobloxGroupRoles(
  groupId?: string | null,
): Promise<RobloxGroupRole[]> {
  if (!groupId || !/^\d+$/.test(groupId)) return [];
  try {
    const response = await fetch(
      `https://groups.roblox.com/v1/groups/${groupId}/roles`,
      {
        cache: "no-store",
        signal: AbortSignal.timeout(8_000),
      },
    );
    if (!response.ok) return [];
    const payload = (await response.json()) as {
      roles?: Array<{
        id?: number;
        name?: string;
        rank?: number;
        memberCount?: number;
      }>;
    };
    return (payload.roles ?? [])
      .filter((role) => role.id && role.name && Number(role.rank) > 0)
      .sort((left, right) => Number(right.rank) - Number(left.rank))
      .map((role) => ({
        id: String(role.id),
        name: String(role.name),
        rank: Number(role.rank) || 0,
        memberCount: Number(role.memberCount) || 0,
      }));
  } catch {
    return [];
  }
}

export async function getRobloxGroupDetails(
  groupId: string,
): Promise<RobloxGroupDetails | null> {
  if (!/^\d+$/.test(groupId)) return null;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const [groupResponse, iconResponse] = await Promise.all([
      fetch(`https://groups.roblox.com/v1/groups/${groupId}`, {
        cache: "no-store",
        signal: controller.signal,
      }),
      fetch(
        `https://thumbnails.roblox.com/v1/groups/icons?groupIds=${groupId}&size=150x150&format=Png&isCircular=false`,
        { cache: "no-store", signal: controller.signal },
      ),
    ]);
    if (!groupResponse.ok) return null;
    const group = (await groupResponse.json()) as {
      id: number;
      name: string;
      description?: string;
      memberCount?: number;
      owner?: {
        userId?: number;
        username?: string;
        displayName?: string;
      } | null;
    };
    const icons = iconResponse.ok
      ? ((await iconResponse.json()) as { data?: Array<{ imageUrl?: string }> })
      : { data: [] };
    return {
      id: String(group.id),
      name: group.name,
      description: group.description || "",
      memberCount: group.memberCount || 0,
      iconUrl: icons.data?.[0]?.imageUrl || null,
      owner: group.owner?.userId
        ? {
            userId: String(group.owner.userId),
            username: group.owner.username || "Unknown",
            displayName:
              group.owner.displayName || group.owner.username || "Unknown",
          }
        : null,
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
