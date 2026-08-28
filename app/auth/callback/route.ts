import { NextResponse, type NextRequest } from "next/server";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const requestedNext = url.searchParams.get("next");
  const safeNext = requestedNext?.startsWith("/") && !requestedNext.startsWith("//")
    ? requestedNext
    : "/dashboard";

  if (!isSupabaseConfigured() || !code) {
    return NextResponse.redirect(new URL("/login?error=oauth_not_ready", url.origin));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(new URL("/login?error=oauth_failed", url.origin));
  }

  const { error: syncError } = await supabase.rpc("sync_auth_identities");
  if (syncError) {
    return NextResponse.redirect(new URL("/login?error=identity_sync_failed", url.origin));
  }

  return NextResponse.redirect(new URL(safeNext, url.origin));
}
