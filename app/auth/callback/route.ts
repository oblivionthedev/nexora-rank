import { NextResponse, type NextRequest } from "next/server";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const safeNext = url.searchParams.get("next")?.startsWith("/")
    ? url.searchParams.get("next")!
    : "/dashboard";

  if (!isSupabaseConfigured() || !code) {
    return NextResponse.redirect(new URL("/login?error=oauth_not_ready", url.origin));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(new URL("/login?error=oauth_failed", url.origin));
  }

  return NextResponse.redirect(new URL(safeNext, url.origin));
}
