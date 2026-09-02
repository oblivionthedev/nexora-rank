import {
  ROBLOX_OAUTH_TOKEN_URL,
} from "@/lib/roblox-oauth";

const ROBLOX_OPEN_CLOUD_URL = "https://apis.roblox.com/cloud/v2";

export type RobloxOAuthTokenSet = {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
};

export type RobloxCloudMembership = {
  path?: string;
  user?: string;
  role?: string;
  roles?: string[];
};

function oauthCredentials() {
  const clientId = process.env.ROBLOX_CLIENT_ID;
  const clientSecret = process.env.ROBLOX_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error("roblox_oauth_not_configured");
  return { clientId, clientSecret };
}

export function parseRobloxScopes(scope: unknown): string[] {
  const values = typeof scope === "string"
    ? [scope]
    : Array.isArray(scope) && scope.every((value) => typeof value === "string")
      ? scope as string[]
      : [];
  return [...new Set(values.flatMap((value) => value.split(/\s+/).filter(Boolean)))];
}

export function robloxTokenExpiry(expiresIn: number | undefined) {
  const seconds = Number.isFinite(expiresIn) ? Math.max(60, Number(expiresIn)) : 899;
  return new Date(Date.now() + seconds * 1000).toISOString();
}

export async function refreshRobloxOAuthToken(refreshToken: string) {
  const { clientId, clientSecret } = oauthCredentials();
  const response = await fetch(ROBLOX_OAUTH_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
    }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error(`roblox_refresh_http_${response.status}`);
  const token = (await response.json()) as Partial<RobloxOAuthTokenSet>;
  if (!token.access_token || !token.refresh_token) {
    throw new Error("roblox_refresh_invalid_response");
  }
  return token as RobloxOAuthTokenSet;
}

async function robloxCloudFetch(
  accessToken: string,
  path: string,
  init?: RequestInit,
) {
  return fetch(`${ROBLOX_OPEN_CLOUD_URL}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
    cache: "no-store",
    signal: AbortSignal.timeout(12_000),
  });
}

export async function getRobloxCloudMembership(
  accessToken: string,
  groupId: string,
  userId: string,
) {
  const query = new URLSearchParams({
    maxPageSize: "1",
    filter: `user == 'users/${userId}'`,
  });
  const response = await robloxCloudFetch(
    accessToken,
    `/groups/${groupId}/memberships?${query}`,
  );
  if (!response.ok) throw new Error(`roblox_membership_http_${response.status}`);
  const payload = (await response.json()) as {
    groupMemberships?: RobloxCloudMembership[];
  };
  return payload.groupMemberships?.[0] ?? null;
}

async function mutateMembershipRole(
  accessToken: string,
  groupId: string,
  userId: string,
  operation: "assignRole" | "unassignRole",
  rolePath: string,
) {
  const response = await robloxCloudFetch(
    accessToken,
    `/groups/${groupId}/memberships/${userId}:${operation}`,
    { method: "POST", body: JSON.stringify({ role: rolePath }) },
  );
  if (!response.ok) throw new Error(`roblox_${operation}_http_${response.status}`);
}

export async function setRobloxGroupMemberRole({
  accessToken,
  groupId,
  userId,
  targetRoleId,
}: {
  accessToken: string;
  groupId: string;
  userId: string;
  targetRoleId: string;
}) {
  if (![groupId, userId, targetRoleId].every((value) => /^\d{1,20}$/.test(value))) {
    throw new Error("roblox_group_action_invalid_identifiers");
  }
  const before = await getRobloxCloudMembership(accessToken, groupId, userId);
  if (!before) throw new Error("roblox_group_member_not_found");

  const targetRolePath = `groups/${groupId}/roles/${targetRoleId}`;
  const existingRoles = [...new Set(before.roles?.length ? before.roles : before.role ? [before.role] : [])];
  if (!existingRoles.includes(targetRolePath)) {
    await mutateMembershipRole(accessToken, groupId, userId, "assignRole", targetRolePath);
  }
  for (const rolePath of existingRoles) {
    if (rolePath !== targetRolePath) {
      await mutateMembershipRole(accessToken, groupId, userId, "unassignRole", rolePath);
    }
  }

  const after = await getRobloxCloudMembership(accessToken, groupId, userId);
  const observedRoles = after?.roles?.length
    ? after.roles
    : after?.role
      ? [after.role]
      : [];
  if (!after || !observedRoles.includes(targetRolePath)) {
    throw new Error("roblox_role_verification_failed");
  }
  return after;
}
