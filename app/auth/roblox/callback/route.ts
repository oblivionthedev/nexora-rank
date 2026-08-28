import { NextResponse } from "next/server";

/**
 * Legacy Roblox callback kept as a safe re-entry route. New OAuth flows use
 * Supabase's shared provider callback and return through /auth/callback.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const destination = new URL("/login", url.origin);
  const providerError = url.searchParams.get("error");

  destination.searchParams.set(
    "roblox",
    providerError ? "authorization_declined" : "use_supabase_oauth",
  );

  return NextResponse.redirect(destination);
}
