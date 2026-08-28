import { NextResponse, type NextRequest } from "next/server";
import {
  ROBLOX_OAUTH_AUTHORIZE_URL,
  createCodeChallenge,
  hasRobloxOAuthCredentials,
  randomState,
} from "@/lib/roblox-oauth";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const nextPath = url.searchParams.get("next")?.startsWith("/") ? url.searchParams.get("next")! : "/onboarding?provider=roblox";

  if (!hasRobloxOAuthCredentials()) {
    return NextResponse.redirect(new URL("/login?error=roblox_not_ready", url.origin));
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
  authorizeUrl.searchParams.set("scope", "openid profile");
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
