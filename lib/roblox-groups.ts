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

export type RobloxGroupMember = {
  userId: string;
  username: string;
  displayName: string;
  roleId: string;
  roleName: string;
  roleRank: number;
};

export type RobloxGroupMembersPage = {
  members: RobloxGroupMember[];
  nextCursor: string | null;
  previousCursor: string | null;
};

export async function findRobloxGroupMember(
  groupId: string | null | undefined,
  query: string | null | undefined,
): Promise<RobloxGroupMember | null> {
  const username = query?.trim().replace(/^@/, "").slice(0, 50);
  if (!groupId || !/^\d+$/.test(groupId) || !username) return null;
  try {
    const userResponse = await fetch("https://users.roblox.com/v1/usernames/users", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ usernames: [username], excludeBannedUsers: false }),
      cache: "no-store",
      signal: AbortSignal.timeout(8_000),
    });
    if (!userResponse.ok) return null;
    const users = (await userResponse.json()) as {
      data?: Array<{ id?: number; name?: string; displayName?: string }>;
    };
    const user = users.data?.[0];
    if (!user?.id) return null;
    const membershipResponse = await fetch(
      `https://groups.roblox.com/v1/users/${user.id}/groups/roles`,
      { cache: "no-store", signal: AbortSignal.timeout(8_000) },
    );
    if (!membershipResponse.ok) return null;
    const memberships = (await membershipResponse.json()) as {
      data?: Array<{
        group?: { id?: number };
        role?: { id?: number; name?: string; rank?: number };
      }>;
    };
    const membership = memberships.data?.find(
      (entry) => String(entry.group?.id ?? "") === groupId,
    );
    if (!membership?.role?.id || !membership.role.name) return null;
    return {
      userId: String(user.id),
      username: user.name || username,
      displayName: user.displayName || user.name || username,
      roleId: String(membership.role.id),
      roleName: membership.role.name,
      roleRank: Number(membership.role.rank) || 0,
    };
  } catch {
    return null;
  }
}

export async function getRobloxGroupMembers(
  groupId?: string | null,
  cursor?: string | null,
): Promise<RobloxGroupMembersPage> {
  if (!groupId || !/^\d+$/.test(groupId))
    return { members: [], nextCursor: null, previousCursor: null };
  const safeCursor = cursor?.trim().slice(0, 500) || null;
  try {
    const query = new URLSearchParams({ sortOrder: "Desc", limit: "100" });
    if (safeCursor) query.set("cursor", safeCursor);
    const response = await fetch(
      `https://groups.roblox.com/v1/groups/${groupId}/users?${query}`,
      { cache: "no-store", signal: AbortSignal.timeout(8_000) },
    );
    if (!response.ok)
      return { members: [], nextCursor: null, previousCursor: null };
    const payload = (await response.json()) as {
      data?: Array<{
        user?: { userId?: number; username?: string; displayName?: string };
        role?: { id?: number; name?: string; rank?: number };
      }>;
      nextPageCursor?: string | null;
      previousPageCursor?: string | null;
    };
    return {
      members: (payload.data ?? []).flatMap((entry) => {
        if (!entry.user?.userId || !entry.role?.id || !entry.role.name)
          return [];
        return [{
          userId: String(entry.user.userId),
          username: entry.user.username || String(entry.user.userId),
          displayName: entry.user.displayName || entry.user.username || "Roblox member",
          roleId: String(entry.role.id),
          roleName: entry.role.name,
          roleRank: Number(entry.role.rank) || 0,
        }];
      }),
      nextCursor: payload.nextPageCursor || null,
      previousCursor: payload.previousPageCursor || null,
    };
  } catch {
    return { members: [], nextCursor: null, previousCursor: null };
  }
}

export async function getRobloxHeadshots(userIds: string[]) {
  const unique = [...new Set(userIds.filter((id) => /^\d+$/.test(id)))].slice(0, 100);
  if (!unique.length) return new Map<string, string>();
  try {
    const response = await fetch(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${unique.join(",")}&size=150x150&format=Png&isCircular=true`, {
      cache: "no-store",
      signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok) return new Map<string, string>();
    const payload = await response.json() as { data?: Array<{ targetId?: number; imageUrl?: string }> };
    return new Map((payload.data ?? []).filter((item) => item.targetId && item.imageUrl).map((item) => [String(item.targetId), String(item.imageUrl)]));
  } catch {
    return new Map<string, string>();
  }
}

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
