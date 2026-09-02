import { ROBLOX_OAUTH_TOKEN_URL, ROBLOX_OAUTH_USERINFO_URL, ROBLOX_VERIFICATION_CALLBACK } from "@/lib/roblox-oauth";
import { resolveRobloxGrantedScopes } from "@/lib/roblox-oauth-permissions";

/** Verification tokens stay in this request, never in cookies or group credentials. */
export async function exchangeRobloxVerification(code: string, verifier: string, origin: string) {
  const response = await fetch(ROBLOX_OAUTH_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.ROBLOX_VERIFICATION_CLIENT_ID!,
      client_secret: process.env.ROBLOX_VERIFICATION_CLIENT_SECRET!,
      grant_type: "authorization_code",
      code,
      code_verifier: verifier,
      redirect_uri: `${origin}${ROBLOX_VERIFICATION_CALLBACK}`,
    }),
    cache: "no-store", signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error("roblox_oauth_failed");
  const token: unknown = await response.json();
  if (!token || typeof token !== "object" || !("access_token" in token)
    || typeof token.access_token !== "string" || !token.access_token) throw new Error("roblox_oauth_failed");

  const userinfo = await fetch(ROBLOX_OAUTH_USERINFO_URL, {
    headers: { Authorization: `Bearer ${token.access_token}` },
    cache: "no-store", signal: AbortSignal.timeout(10_000),
  });
  if (!userinfo.ok) throw new Error("roblox_oauth_failed");
  const profile: unknown = await userinfo.json();
  if (!profile || typeof profile !== "object") throw new Error("roblox_oauth_failed");
  const claims = profile as Record<string, unknown>;
  if (typeof claims.sub !== "string" || !/^\d{1,20}$/.test(claims.sub)) throw new Error("roblox_oauth_failed");
  await resolveRobloxGrantedScopes({
    accessToken: token.access_token,
    tokenScope: "scope" in token ? token.scope : undefined,
    expectedUserId: claims.sub,
    purpose: "verification",
  });
  const name = (value: unknown) => typeof value === "string" && value.trim() ? value.trim().slice(0, 100) : null;
  const username = name(claims.preferred_username) ?? name(claims.nickname) ?? name(claims.name) ?? claims.sub;
  const picture = typeof claims.picture === "string" && claims.picture.startsWith("https://") ? claims.picture : "";
  return { id: claims.sub, username, displayName: name(claims.name) ?? username, avatarUrl: picture };
}
