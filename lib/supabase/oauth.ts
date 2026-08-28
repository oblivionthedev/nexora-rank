import type { Provider } from "@supabase/supabase-js";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

export type NexoraOAuthProvider = "discord" | "custom:roblox";

export const nexoraOAuthProviders = {
  discord: "discord",
  roblox: "custom:roblox",
} as const satisfies Record<string, NexoraOAuthProvider>;

function safeNextPath(next: string) {
  return next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
}

function callbackUrl(next: string) {
  const url = new URL("/auth/callback", window.location.origin);
  url.searchParams.set("next", safeNextPath(next));
  return url.toString();
}

export async function startOAuthSignIn(
  provider: NexoraOAuthProvider,
  next = "/dashboard",
) {
  if (!isSupabaseConfigured()) {
    return { error: new Error("Supabase is not configured for this deployment.") };
  }

  const supabase = createClient();
  return supabase.auth.signInWithOAuth({
    provider: provider as Provider,
    options: { redirectTo: callbackUrl(next) },
  });
}

export async function linkOAuthIdentity(
  provider: NexoraOAuthProvider,
  next = "/dashboard",
) {
  if (!isSupabaseConfigured()) {
    return { error: new Error("Supabase is not configured for this deployment.") };
  }

  const supabase = createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    return { error: userError ?? new Error("Sign in before linking another identity.") };
  }

  return supabase.auth.linkIdentity({
    provider: provider as Provider,
    options: { redirectTo: callbackUrl(next) },
  });
}
