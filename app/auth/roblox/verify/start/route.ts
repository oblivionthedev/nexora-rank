import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createCodeChallenge, randomState, isRobloxVerificationReady, ROBLOX_OAUTH_AUTHORIZE_URL, ROBLOX_VERIFICATION_CALLBACK, ROBLOX_VERIFICATION_SCOPES } from "@/lib/roblox-oauth";

export async function GET(request: NextRequest) {
  const origin = new URL(request.url).origin;
  if (!isRobloxVerificationReady()) {
    return NextResponse.redirect(new URL("/verify?error=roblox_verification_pending", origin));
  }
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login?next=/verify", origin));
  const { data: discord } = await supabase.from("account_links")
    .select("id").eq("user_id", user.id).eq("provider", "discord")
    .not("verified_at", "is", null).maybeSingle();
  if (!discord) return NextResponse.redirect(new URL("/verify?error=discord_identity_required", origin));

  const state = randomState();
  const verifier = randomState() + randomState();
  const authorize = new URL(ROBLOX_OAUTH_AUTHORIZE_URL);
  authorize.search = new URLSearchParams({
    client_id: process.env.ROBLOX_VERIFICATION_CLIENT_ID!,
    redirect_uri: `${origin}${ROBLOX_VERIFICATION_CALLBACK}`,
    response_type: "code",
    scope: ROBLOX_VERIFICATION_SCOPES,
    state,
    code_challenge: await createCodeChallenge(verifier),
    code_challenge_method: "S256",
    prompt: "select_account",
  }).toString();
  const response = NextResponse.redirect(authorize);
  response.headers.set("Cache-Control", "no-store");
  const options = { httpOnly: true, secure: origin.startsWith("https:"), sameSite: "lax" as const, path: "/auth/roblox/verify", maxAge: 600 };
  response.cookies.set("nexora_verify_state", state, options);
  response.cookies.set("nexora_verify_pkce", verifier, options);
  response.cookies.set("nexora_verify_user", user.id, options);
  return response;
}
