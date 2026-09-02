import { NextResponse, type NextRequest } from "next/server";
import {
  ROBLOX_OAUTH_AUTHORIZE_URL,
  ROBLOX_OAUTH_SCOPES,
  createCodeChallenge,
  hasRobloxOAuthCredentials,
  randomState,
} from "@/lib/roblox-oauth";
import { hasRobloxTokenEncryption } from "@/lib/roblox-token-crypto";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const requestedNext = url.searchParams.get("next");
  // Older verification links must never ask members for group-management scopes.
  if (requestedNext === "/verify" || requestedNext?.startsWith("/verify?")) {
    return NextResponse.redirect(new URL("/auth/roblox/verify/start", url.origin));
  }
  const nextPath =
    requestedNext?.startsWith("/") && !requestedNext.startsWith("//")
      ? requestedNext
      : "/onboarding?provider=roblox";

  if (!hasRobloxOAuthCredentials()) {
    return NextResponse.redirect(new URL("/login?error=roblox_credentials_missing", url.origin));
  }
  if (!hasRobloxTokenEncryption()) {
    return NextResponse.redirect(new URL("/login?error=roblox_storage_not_ready", url.origin));
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    const login = new URL("/login", url.origin);
    login.searchParams.set("next", nextPath);
    return NextResponse.redirect(login);
  }

  const clientId = process.env.ROBLOX_CLIENT_ID!;
  const redirectUri = `${url.origin}/auth/roblox/callback`;
  const state = randomState();
  const verifierBytes = crypto.getRandomValues(new Uint8Array(32));
  const verifier = Array.from(verifierBytes, (value) => value.toString(16).padStart(2, "0")).join("");
  const challenge = await createCodeChallenge(verifier);

  const authorizeUrl = new URL(ROBLOX_OAUTH_AUTHORIZE_URL);
  authorizeUrl.searchParams.set("client_id", clientId);
  authorizeUrl.searchParams.set("redirect_uri", redirectUri);
  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("scope", ROBLOX_OAUTH_SCOPES);
  authorizeUrl.searchParams.set("state", state);
  authorizeUrl.searchParams.set("code_challenge", challenge);
  authorizeUrl.searchParams.set("code_challenge_method", "S256");

  const response = NextResponse.redirect(authorizeUrl);
  const cookieOptions = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: url.protocol === "https:",
    path: "/",
    maxAge: 60 * 10,
  };

  response.cookies.set("nexora_roblox_state", state, cookieOptions);
  response.cookies.set("nexora_roblox_verifier", verifier, cookieOptions);
  response.cookies.set("nexora_roblox_next", nextPath, cookieOptions);

  return response;
}
