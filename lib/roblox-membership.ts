import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "@/lib/supabase/config";

export const REQUIRED_ROBLOX_GROUP_ID = "596263047";

type RobloxGroupsResponse = {
  data?: Array<{ group?: { id?: number }; role?: { id?: number; name?: string; rank?: number } }>;
};

export async function checkRequiredRobloxMembership(robloxUserId: string) {
  if (!/^\d+$/.test(robloxUserId)) {
    return { ok: false as const, error: "invalid_roblox_user_id" };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);
  try {
    const response = await fetch(`https://groups.roblox.com/v1/users/${robloxUserId}/groups/roles`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: controller.signal,
    });
    if (!response.ok) return { ok: false as const, error: `roblox_http_${response.status}` };
    const payload = (await response.json()) as RobloxGroupsResponse;
    const membership = payload.data?.find((entry) => String(entry.group?.id) === REQUIRED_ROBLOX_GROUP_ID);
    return { ok: true as const, member: Boolean(membership), role: membership?.role?.name ?? null };
  } catch (error) {
    return { ok: false as const, error: error instanceof Error && error.name === "AbortError" ? "roblox_timeout" : "roblox_unavailable" };
  } finally {
    clearTimeout(timeout);
  }
}

export function createMembershipAutomationClient() {
  return createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

