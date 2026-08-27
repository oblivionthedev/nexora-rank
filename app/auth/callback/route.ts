import { NextResponse, type NextRequest } from "next/server";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

/**
 * Only same-origin absolute paths are accepted. A leading "//" must be
 * rejected because a browser reads "//evil.example" as a protocol-relative
 * absolute URL, which would turn this callback into an open redirect.
 */
function safeNextPath(raw: string | null): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return "/dashboard";
  return raw;
}

function loginRedirect(origin: string, reason: string) {
  const destination = new URL("/login", origin);
  destination.searchParams.set("error", reason);
  return NextResponse.redirect(destination);
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const next = safeNextPath(url.searchParams.get("next"));
  const code = url.searchParams.get("code");

  // Discord refused, or the member declined the consent screen.
  if (url.searchParams.get("error")) {
    return loginRedirect(url.origin, "authorization_declined");
  }

  if (!isSupabaseConfigured() || !code) {
    return loginRedirect(url.origin, "oauth_not_ready");
  }

  const supabase = await createClient();

  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
  if (exchangeError) {
    return loginRedirect(url.origin, "oauth_failed");
  }

  // Record the verified Discord identity in account_links. The function reads
  // auth.identities server-side and accepts no arguments, so the browser never
  // supplies any part of the identity.
  const { error: identityError } = await supabase.rpc("sync_discord_identity");
  if (identityError) {
    const alreadyLinked =
      identityError.code === "23505" ||
      identityError.message?.includes("already linked");
    return loginRedirect(
      url.origin,
      alreadyLinked ? "discord_already_linked" : "identity_link_failed",
    );
  }

  return NextResponse.redirect(new URL(next, url.origin));
}
