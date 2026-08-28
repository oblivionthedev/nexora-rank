import { NextResponse, type NextRequest } from "next/server";
import {
  ROBLOX_OAUTH_TOKEN_URL,
  ROBLOX_OAUTH_USERINFO_URL,
  hasRobloxOAuthCredentials,
} from "@/lib/roblox-oauth";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const destination = new URL("/login", url.origin);
  const error = url.searchParams.get("error");
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const expectedState = request.cookies.get("nexora_roblox_state")?.value;
  const verifier = request.cookies.get("nexora_roblox_verifier")?.value;
  const nextPath = request.cookies.get("nexora_roblox_next")?.value ?? "/onboarding?provider=roblox";

  if (error) {
    destination.searchParams.set("roblox", "authorization_declined");
    return cleanupAndRedirect(destination, url.origin, true);
  }

  if (!hasRobloxOAuthCredentials() || !code || !state || state !== expectedState || !verifier) {
    destination.searchParams.set("roblox", "oauth_not_ready");
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
    destination.searchParams.set("roblox", "oauth_failed");
    return cleanupAndRedirect(destination, url.origin, true);
  }

  const tokenData = (await tokenResponse.json()) as { access_token?: string };
  const accessToken = tokenData.access_token;

  if (!accessToken) {
    destination.searchParams.set("roblox", "oauth_failed");
    return cleanupAndRedirect(destination, url.origin, true);
  }

  const userinfoResponse = await fetch(ROBLOX_OAUTH_USERINFO_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!userinfoResponse.ok) {
    destination.searchParams.set("roblox", "oauth_failed");
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

  const response = NextResponse.redirect(new URL(nextPath, url.origin));
  const cookieOptions = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: url.protocol === "https:",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  };

  response.cookies.set("nexora_roblox_identity", JSON.stringify({
    provider: "roblox",
    providerUserId: profile.sub ?? "",
    username: profile.preferred_username ?? profile.nickname ?? profile.name ?? "Roblox user",
    displayName: profile.name ?? profile.nickname ?? profile.preferred_username ?? "Roblox user",
    picture: profile.picture ?? null,
    email: profile.email ?? null,
  }), cookieOptions);
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
