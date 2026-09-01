import { NextResponse, type NextRequest } from "next/server";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const requestedNext = url.searchParams.get("next");
  const safeNext = requestedNext?.startsWith("/") && !requestedNext.startsWith("//")
    ? requestedNext
    : "/onboarding";

  if (!isSupabaseConfigured() || !code) {
    return NextResponse.redirect(new URL("/login?error=oauth_not_ready", url.origin));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(new URL("/login?error=oauth_failed", url.origin));
  }

  await supabase.rpc("sync_auth_identities");
  if (safeNext.startsWith("/dashboard") || safeNext.startsWith("/onboarding")) {
    const { data: access } = await supabase.rpc("dashboard_access_state");
    const accessState = access as { allowed?: boolean; reason?: string } | null;
    if (!accessState?.allowed) {
      if (accessState?.reason === "beta_selection_required") {
        return NextResponse.redirect(
          new URL("/beta?access=selection_required#apply", url.origin),
        );
      }
      if (accessState?.reason === "security_blocked") {
        await supabase.auth.signOut();
        return NextResponse.redirect(
          new URL("/login?error=security_blocked", url.origin),
        );
      }
      return NextResponse.redirect(
        new URL("/beta?access=selection_required#apply", url.origin),
      );
    }
  }
  return NextResponse.redirect(new URL(safeNext, url.origin));
}
