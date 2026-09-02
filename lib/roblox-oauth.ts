export const ROBLOX_OAUTH_AUTHORIZE_URL = "https://apis.roblox.com/oauth/v1/authorize";
export const ROBLOX_OAUTH_TOKEN_URL = "https://apis.roblox.com/oauth/v1/token";
export const ROBLOX_OAUTH_USERINFO_URL = "https://apis.roblox.com/oauth/v1/userinfo";
export const ROBLOX_OAUTH_RESOURCES_URL = "https://apis.roblox.com/oauth/v1/token/resources";
export const ROBLOX_OAUTH_INTROSPECT_URL = "https://apis.roblox.com/oauth/v1/token/introspect";
export const ROBLOX_OAUTH_SCOPES = "openid profile group:read group:write";
export const ROBLOX_VERIFICATION_SCOPES = "openid profile";
export const ROBLOX_VERIFICATION_CALLBACK = "/auth/roblox/verify/callback";

export function hasRobloxVerificationCredentials() {
  return Boolean(process.env.ROBLOX_VERIFICATION_CLIENT_ID && process.env.ROBLOX_VERIFICATION_CLIENT_SECRET);
}

export function isRobloxVerificationReady() {
  return process.env.ROBLOX_VERIFICATION_ENABLED === "true"
    && hasRobloxVerificationCredentials()
    && Boolean(process.env.CRON_SECRET);
}

export function hasRobloxOAuthCredentials() {
  return Boolean(process.env.ROBLOX_CLIENT_ID && process.env.ROBLOX_CLIENT_SECRET);
}

export async function createCodeChallenge(verifier: string) {
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  return base64UrlEncode(new Uint8Array(hash));
}

export function base64UrlEncode(bytes: Uint8Array) {
  let binary = "";
  bytes.forEach((value) => {
    binary += String.fromCharCode(value);
  });

  return btoa(binary).replaceAll("=", "").replaceAll("+", "-").replaceAll("/", "_");
}

export function randomState() {
  return base64UrlEncode(crypto.getRandomValues(new Uint8Array(24)));
}
