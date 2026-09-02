import { ROBLOX_OAUTH_INTROSPECT_URL, ROBLOX_OAUTH_SCOPES, ROBLOX_VERIFICATION_SCOPES } from "@/lib/roblox-oauth";
import { parseRobloxScopes } from "@/lib/roblox-open-cloud";

export class RobloxPermissionError extends Error {
  constructor(
    public readonly code: "roblox_permissions_required" | "roblox_permission_check_failed",
    public readonly missingScopes: string[] = [],
  ) {
    super(code);
  }
}

/** Resolve grants from Roblox, never from the scopes we requested or browser data. */
export async function resolveRobloxGrantedScopes({
  accessToken,
  tokenScope,
  expectedUserId,
  purpose = "group",
}: {
  accessToken: string;
  tokenScope: unknown;
  expectedUserId: string;
  purpose?: "group" | "verification";
}): Promise<string[]> {
  const requiredScopes = (purpose === "verification" ? ROBLOX_VERIFICATION_SCOPES : ROBLOX_OAUTH_SCOPES).split(" ");
  const tokenScopes = parseRobloxScopes(tokenScope);
  if (requiredScopes.every((scope) => tokenScopes.includes(scope))) {
    return tokenScopes;
  }

  // An absent/incomplete scope field in the token response is not evidence that
  // the user declined permission. Ask Roblox for the actual token claims.
  const clientId = purpose === "verification" ? process.env.ROBLOX_VERIFICATION_CLIENT_ID : process.env.ROBLOX_CLIENT_ID;
  const clientSecret = purpose === "verification" ? process.env.ROBLOX_VERIFICATION_CLIENT_SECRET : process.env.ROBLOX_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new RobloxPermissionError("roblox_permission_check_failed");
  }

  let claims: unknown;
  try {
    const response = await fetch(ROBLOX_OAUTH_INTROSPECT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        token: accessToken,
        client_id: clientId,
        client_secret: clientSecret,
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) throw new Error("introspection_failed");
    claims = await response.json();
  } catch {
    throw new RobloxPermissionError("roblox_permission_check_failed");
  }

  if (!claims || typeof claims !== "object" || Array.isArray(claims)) {
    throw new RobloxPermissionError("roblox_permission_check_failed");
  }
  const result = claims as Record<string, unknown>;
  if (result.active !== true || result.client_id !== clientId || result.sub !== expectedUserId) {
    throw new RobloxPermissionError("roblox_permission_check_failed");
  }

  const grantedScopes = parseRobloxScopes(result.scope);
  const missingScopes = requiredScopes.filter((scope) => !grantedScopes.includes(scope));
  if (missingScopes.length) {
    throw new RobloxPermissionError("roblox_permissions_required", missingScopes);
  }
  return grantedScopes;
}
