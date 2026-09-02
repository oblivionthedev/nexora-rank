import { NextResponse, type NextRequest } from "next/server";
import {
  ROBLOX_OAUTH_TOKEN_URL,
  ROBLOX_OAUTH_USERINFO_URL,
  ROBLOX_OAUTH_RESOURCES_URL,
  hasRobloxOAuthCredentials,
} from "@/lib/roblox-oauth";
import {
  robloxTokenExpiry,
  type RobloxOAuthTokenSet,
} from "@/lib/roblox-open-cloud";
import { resolveRobloxGrantedScopes, RobloxPermissionError } from "@/lib/roblox-oauth-permissions";
import {
  encryptRobloxToken,
  hasRobloxTokenEncryption,
} from "@/lib/roblox-token-crypto";
import type { Json } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const rawNext = request.cookies.get("nexora_roblox_next")?.value;
  const nextPath = rawNext?.startsWith("/") && !rawNext.startsWith("//")
    ? rawNext
    : "/onboarding?provider=roblox";
  const destination = new URL(nextPath, url.origin);
  const error = url.searchParams.get("error");
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const expectedState = request.cookies.get("nexora_roblox_state")?.value;
  const verifier = request.cookies.get("nexora_roblox_verifier")?.value;

  if (error) {
    destination.searchParams.set("error", "roblox_authorization_declined");
    return cleanupAndRedirect(destination, url.origin, true);
  }

  if (!hasRobloxOAuthCredentials() || !hasRobloxTokenEncryption() || !code || !state || state !== expectedState || !verifier) {
    destination.searchParams.set("error", "roblox_not_ready");
    return cleanupAndRedirect(destination, url.origin, true);
  }

  const tokenResponse = await fetch(ROBLOX_OAUTH_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.ROBLOX_CLIENT_ID!,
      client_secret: process.env.ROBLOX_CLIENT_SECRET!,
      grant_type: "authorization_code",
      code,
      redirect_uri: `${url.origin}/auth/roblox/callback`,
      code_verifier: verifier,
    }),
  });

  if (!tokenResponse.ok) {
    destination.searchParams.set("error", "roblox_oauth_failed");
    return cleanupAndRedirect(destination, url.origin, true);
  }

  const tokenData = (await tokenResponse.json()) as Partial<RobloxOAuthTokenSet>;
  const accessToken = tokenData.access_token;

  if (!accessToken || !tokenData.refresh_token) {
    destination.searchParams.set("error", "roblox_oauth_failed");
    return cleanupAndRedirect(destination, url.origin, true);
  }

  const userinfoResponse = await fetch(ROBLOX_OAUTH_USERINFO_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!userinfoResponse.ok) {
    destination.searchParams.set("error", "roblox_oauth_failed");
    return cleanupAndRedirect(destination, url.origin, true);
  }

  const profile = (await userinfoResponse.json()) as {
    sub?: string;
    name?: string;
    nickname?: string;
    preferred_username?: string;
    picture?: string;
    email?: string;
  };

  if (!profile.sub || !/^\d{1,20}$/.test(profile.sub)) {
    destination.searchParams.set("error", "roblox_oauth_failed");
    return cleanupAndRedirect(destination, url.origin, true);
  }

  const resourceResponse = await fetch(ROBLOX_OAUTH_RESOURCES_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      token: accessToken,
      client_id: process.env.ROBLOX_CLIENT_ID!,
      client_secret: process.env.ROBLOX_CLIENT_SECRET!,
    }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!resourceResponse.ok) {
    destination.searchParams.set("error", "roblox_resource_access_failed");
    return cleanupAndRedirect(destination, url.origin, true);
  }
  const resourceSnapshot = (await resourceResponse.json()) as Json;
  let scopes: string[];
  try {
    scopes = await resolveRobloxGrantedScopes({
      accessToken,
      tokenScope: tokenData.scope,
      expectedUserId: profile.sub,
    });
  } catch (error) {
    const failure = error instanceof RobloxPermissionError
      ? error
      : new RobloxPermissionError("roblox_permission_check_failed");
    // Only error codes and known scope names; never log tokens or provider responses.
    console.warn("Roblox permission verification failed", {
      code: failure.code,
      missingScopes: failure.missingScopes,
    });
    destination.searchParams.set("error", failure.code);
    return cleanupAndRedirect(destination, url.origin, true);
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    const login = new URL("/login", url.origin);
    login.searchParams.set("error", "session_required");
    login.searchParams.set("next", nextPath);
    return cleanupAndRedirect(login, url.origin, true);
  }
  const { error: storeError } = await supabase.rpc(
    "store_roblox_oauth_credential",
    {
      provider_user_id: profile.sub,
      provider_username:
        profile.preferred_username ?? profile.nickname ?? profile.name ?? profile.sub,
      provider_display_name:
        profile.name ?? profile.nickname ?? profile.preferred_username ?? profile.sub,
      provider_avatar_url: profile.picture ?? "",
      access_token_ciphertext: await encryptRobloxToken(accessToken),
      refresh_token_ciphertext: await encryptRobloxToken(tokenData.refresh_token),
      token_expires_at: robloxTokenExpiry(tokenData.expires_in),
      token_scopes: scopes,
      resource_snapshot: resourceSnapshot,
    },
  );
  if (storeError) {
    destination.searchParams.set("error", "roblox_connection_save_failed");
    return cleanupAndRedirect(destination, url.origin, true);
  }

  const response = NextResponse.redirect(new URL(nextPath, url.origin));
  response.cookies.delete("nexora_roblox_state");
  response.cookies.delete("nexora_roblox_verifier");
  response.cookies.delete("nexora_roblox_next");

  return response;
}

function cleanupAndRedirect(destination: URL, origin: string, clearCookies: boolean) {
  const response = NextResponse.redirect(destination);

  if (clearCookies) {
    response.cookies.delete("nexora_roblox_state");
    response.cookies.delete("nexora_roblox_verifier");
    response.cookies.delete("nexora_roblox_next");
  }

  return response;
}
