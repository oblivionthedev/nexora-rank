import { redirect } from "next/navigation";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export type WorkspaceControl = {
  workspace: {
    id: string; public_id: string; name: string; slug: string; role: string;
    operational_status: string; moderation_status: string; moderation_reason: string | null;
    moderation_expires_at: string | null; appeal_allowed: boolean; appeal_note: string | null;
    roblox_group_id: string | null; roblox_group_name: string | null; roblox_group_icon_url: string | null;
    discord_guild_id: string | null; discord_guild_name: string | null;
  };
  counts: { members: number; rank_actions: number; activity_sessions: number; log_events: number };
  integrations: Array<{ provider: string; status: string; external_id: string | null; updated_at: string }>;
  settings: {
    allowed_roblox_rank_min?: number;
    allowed_roblox_role_ids?: string[];
    theme_mode?: "solid" | "gradient";
    theme_color_start?: string;
    theme_color_end?: string;
    updated_at?: string;
  };
};

export const getWorkspaceControl = cache(async function getWorkspaceControl(publicId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/dashboard/${encodeURIComponent(publicId)}`);
  const { data, error } = await supabase.rpc("workspace_control_state", { target_public_id: publicId });
  if (error || !data) {
    await supabase.rpc("report_security_incident", {
      requested_scope: "workspace_access",
      requested_target: publicId.slice(0, 160),
      requested_details: { reason: error?.message || "workspace_not_found" },
    });
    redirect("/dashboard");
  }
  return { supabase, user, state: data as unknown as WorkspaceControl };
});
