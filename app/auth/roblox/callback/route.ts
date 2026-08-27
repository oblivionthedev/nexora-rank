import { NextResponse } from "next/server";

/**
 * Stable Roblox OAuth re-entry URL. The full authorization-code exchange is
 * intentionally kept disabled until ROBLOX_CLIENT_ID and
 * ROBLOX_CLIENT_SECRET are attached as server-only production secrets.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const destination = new URL("/login", url.origin);
  const providerError = url.searchParams.get("error");

  destination.searchParams.set(
    "roblox",
    providerError ? "authorization_declined" : "provider_configuration_pending",
  );

  return NextResponse.redirect(destination);
}
