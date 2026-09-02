import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isRobloxVerificationReady } from "@/lib/roblox-oauth";
import { RobloxPermissionError } from "@/lib/roblox-oauth-permissions";
import { exchangeRobloxVerification } from "@/lib/roblox-verification";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const finish = (error?: string) => {
    const destination = new URL("/verify", url.origin);
    if (error) destination.searchParams.set("error", error);
    const response = NextResponse.redirect(destination);
    response.headers.set("Cache-Control", "no-store");
    for (const name of ["nexora_verify_state", "nexora_verify_pkce", "nexora_verify_user"]) {
      response.cookies.set(name, "", { path: "/auth/roblox/verify", maxAge: 0, httpOnly: true, sameSite: "lax", secure: url.protocol === "https:" });
    }
    return response;
  };
  if (!isRobloxVerificationReady()) return finish("roblox_verification_pending");
  const state = url.searchParams.get("state");
  const verifier = request.cookies.get("nexora_verify_pkce")?.value;
  if (!state || state !== request.cookies.get("nexora_verify_state")?.value || !verifier) return finish("roblox_not_ready");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.id !== request.cookies.get("nexora_verify_user")?.value) return finish("verification_session_changed");
  if (url.searchParams.has("error")) return finish("roblox_authorization_declined");
  const code = url.searchParams.get("code");
  if (!code) return finish("roblox_not_ready");

  try {
    const profile = await exchangeRobloxVerification(code, verifier, url.origin);
    const { data, error } = await supabase.rpc("store_roblox_verification", {
      candidate_secret: process.env.CRON_SECRET!,
      provider_user_id: profile.id,
      provider_username: profile.username,
      provider_display_name: profile.displayName,
      provider_avatar_url: profile.avatarUrl,
    });
    if (error || data !== true) {
      if (error?.code === "23505") return finish("roblox_account_already_linked");
      if (error?.message === "roblox_group_account_mismatch") return finish("roblox_group_account_mismatch");
      return finish("roblox_connection_save_failed");
    }
    return finish();
  } catch (error) {
    return finish(error instanceof RobloxPermissionError ? error.code : "roblox_oauth_failed");
  }
}
