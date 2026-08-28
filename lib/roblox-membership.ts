import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "@/lib/supabase/config";

export const REQUIRED_ROBLOX_GROUP_ID = "596263047";

type RobloxGroupsResponse = {
  data?: Array<{ group?: { id?: number; name?: string; description?: string; memberCount?: number }; role?: { id?: number; name?: string; rank?: number } }>;
};

export type RobloxGroupMembership = {
  id: string;
  name: string;
  role: string;
  roleRank: number;
};

export async function listRobloxGroups(robloxUserId: string): Promise<{ ok: true; groups: RobloxGroupMembership[] } | { ok: false; error: string }> {
  if (!/^\d+$/.test(robloxUserId)) return { ok: false, error: "invalid_roblox_user_id" };
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);
  try {
    const response = await fetch(`https://groups.roblox.com/v1/users/${robloxUserId}/groups/roles`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: controller.signal,
    });
    if (!response.ok) return { ok: false, error: `roblox_http_${response.status}` };
    const payload = (await response.json()) as RobloxGroupsResponse;
    const groups = (payload.data ?? []).flatMap((entry) => {
      if (!entry.group?.id || !entry.group.name) return [];
      return [{
        id: String(entry.group.id),
        name: entry.group.name,
        role: entry.role?.name ?? "Member",
        roleRank: entry.role?.rank ?? 0,
      }];
    }).sort((a, b) => b.roleRank - a.roleRank || a.name.localeCompare(b.name));
    return { ok: true, groups };
  } catch (error) {
    return { ok: false, error: error instanceof Error && error.name === "AbortError" ? "roblox_timeout" : "roblox_unavailable" };
  } finally {
    clearTimeout(timeout);
  }
}

export async function checkRequiredRobloxMembership(robloxUserId: string) {
  const result = await listRobloxGroups(robloxUserId);
  if (!result.ok) return result;
  const membership = result.groups.find((group) => group.id === REQUIRED_ROBLOX_GROUP_ID);
  return { ok: true as const, member: Boolean(membership), role: membership?.role ?? null };
}

export function createMembershipAutomationClient() {
  return createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
