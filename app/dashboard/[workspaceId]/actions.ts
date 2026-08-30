"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { sendDiscordChannelMessage } from "@/lib/discord-messages";
import {
  assignDiscordGuildRole,
  listDiscordWorkspaceResources,
} from "@/lib/discord-resources";
import { nexoraSiteUrl } from "@/lib/site-url";
import { getRobloxGroupDetails } from "@/lib/roblox-groups";
import { listRobloxGroups } from "@/lib/roblox-membership";

export type LinkCodeState = {
  code?: string;
  expiresAt?: string;
  error?: string;
};
async function context(publicId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/dashboard/${publicId}`);
  const { data, error } = await supabase.rpc("workspace_control_state", {
    target_public_id: publicId,
  });
  if (error || !data) redirect("/dashboard");
  return {
    supabase,
    user,
    state: data as unknown as {
      workspace: {
        id: string;
        public_id: string;
        name: string;
        role: string;
        operational_status: string;
        discord_guild_id: string | null;
      };
    },
  };
}

export async function createDiscordCode(
  _state: LinkCodeState,
  formData: FormData,
): Promise<LinkCodeState> {
  const publicId = String(formData.get("public_id") || "");
  const { supabase, state } = await context(publicId);
  const { data, error } = await supabase.rpc("create_discord_link_code", {
    target_workspace_id: state.workspace.id,
  });
  if (error)
    return {
      error: error.message.includes("suspended")
        ? "Workspace connections are locked while restricted."
        : "Could not create a link code.",
    };
  const result = data as { code?: string; expires_at?: string } | null;
  return result?.code
    ? { code: result.code, expiresAt: result.expires_at }
    : { error: "Could not create a link code." };
}

export async function connectRobloxGroup(formData: FormData) {
  const publicId = String(formData.get("public_id") || "");
  const groupId = String(formData.get("group_id") || "").trim();
  if (!/^\d+$/.test(groupId))
    redirect(`/dashboard/${publicId}/connections?error=invalid_group`);
  const { supabase, user, state } = await context(publicId);
  if (!["owner", "admin"].includes(state.workspace.role))
    redirect(`/dashboard/${publicId}/connections?error=manager_required`);
  const details = await getRobloxGroupDetails(groupId);
  if (!details)
    redirect(`/dashboard/${publicId}/connections?error=group_not_found`);
  const { data: link } = await supabase
    .from("account_links")
    .select("provider_user_id")
    .eq("user_id", user.id)
    .eq("provider", "roblox")
    .maybeSingle();
  if (link) {
    const groups = await listRobloxGroups(link.provider_user_id);
    const owned = groups.ok
      ? groups.groups.find((g) => g.id === groupId && g.roleRank === 255)
      : null;
    if (!owned)
      redirect(`/dashboard/${publicId}/connections?error=group_owner_required`);
  }
  const { error } = await supabase.rpc("set_workspace_roblox_group", {
    target_workspace_id: state.workspace.id,
    group_id: details.id,
    group_name: details.name,
    icon_url: details.iconUrl || "",
    oauth_verified: Boolean(link),
  });
  if (error) redirect(`/dashboard/${publicId}/connections?error=save_failed`);
  revalidatePath(`/dashboard/${publicId}`);
  redirect(`/dashboard/${publicId}/connections?saved=roblox`);
}

export async function saveWorkspaceAccess(formData: FormData) {
  const publicId = String(formData.get("public_id") || "");
  const rankMin = Number(formData.get("rank_min"));
  const roleIds = String(formData.get("role_ids") || "")
    .split(",")
    .map((v) => v.trim())
    .filter((v) => /^\d+$/.test(v));
  const { supabase, state } = await context(publicId);
  const { error } = await supabase.rpc("save_workspace_settings", {
    target_workspace_id: state.workspace.id,
    rank_min: rankMin,
    role_ids: roleIds,
  });
  if (error) redirect(`/dashboard/${publicId}/settings?error=settings_failed`);
  revalidatePath(`/dashboard/${publicId}`);
  redirect(`/dashboard/${publicId}/settings?saved=access`);
}

export async function saveWorkspaceTheme(formData: FormData) {
  const publicId = String(formData.get("public_id") || "");
  const mode = String(formData.get("theme_mode") || "");
  const start = String(formData.get("theme_color_start") || "").toLowerCase();
  const requestedEnd = String(
    formData.get("theme_color_end") || "",
  ).toLowerCase();
  const end = mode === "solid" ? start : requestedEnd;
  if (
    !["solid", "gradient"].includes(mode) ||
    !/^#[0-9a-f]{6}$/.test(start) ||
    !/^#[0-9a-f]{6}$/.test(end)
  )
    redirect(`/dashboard/${publicId}/settings?error=theme_invalid`);
  const { supabase, state } = await context(publicId);
  const { error } = await supabase.rpc("save_workspace_theme", {
    target_workspace_id: state.workspace.id,
    requested_theme_mode: mode,
    requested_color_start: start,
    requested_color_end: end,
  });
  if (error) redirect(`/dashboard/${publicId}/settings?error=theme_failed`);
  revalidatePath(`/dashboard/${publicId}`, "layout");
  redirect(`/dashboard/${publicId}/settings?saved=theme`);
}

function value(formData: FormData, key: string) {
  return String(formData.get(key) || "").trim();
}
async function finish(publicId: string, path: string, error: unknown) {
  if (error) redirect(`/dashboard/${publicId}/${path}?error=save_failed`);
  revalidatePath(`/dashboard/${publicId}/${path}`);
  redirect(`/dashboard/${publicId}/${path}?saved=1`);
}

export async function updateWorkspaceProfile(formData: FormData) {
  const publicId = value(formData, "public_id");
  const { supabase, state } = await context(publicId);
  const { error } = await supabase.rpc("update_workspace_profile", {
    target_workspace_id: state.workspace.id,
    requested_name: value(formData, "name"),
  });
  await finish(publicId, "settings", error);
}
export async function inviteMember(formData: FormData) {
  const publicId = value(formData, "public_id");
  const { supabase, state } = await context(publicId);
  const { error } = await supabase.rpc("invite_workspace_member", {
    target_workspace_id: state.workspace.id,
    target_email: value(formData, "email"),
    requested_role: value(formData, "role"),
  });
  await finish(publicId, "members", error);
}
export async function manageMember(formData: FormData) {
  const publicId = value(formData, "public_id");
  const { supabase, state } = await context(publicId);
  const { error } = await supabase.rpc("manage_workspace_member", {
    target_workspace_id: state.workspace.id,
    target_user_id: value(formData, "user_id"),
    requested_role: value(formData, "role"),
    requested_action: value(formData, "action"),
  });
  await finish(publicId, "members", error);
}
export async function transferOwnership(formData: FormData) {
  const publicId = value(formData, "public_id");
  const { supabase, state } = await context(publicId);
  const { error } = await supabase.rpc("transfer_workspace_ownership", {
    target_workspace_id: state.workspace.id,
    target_user_id: value(formData, "user_id"),
  });
  if (error) redirect(`/dashboard/${publicId}/settings?error=transfer_failed`);
  redirect("/dashboard");
}
export async function setWorkspaceLifecycle(formData: FormData) {
  const publicId = value(formData, "public_id");
  const action = value(formData, "action");
  const { supabase, state } = await context(publicId);
  const { error } = await supabase.rpc("set_workspace_lifecycle", {
    target_workspace_id: state.workspace.id,
    requested_action: action,
    confirmation_name: value(formData, "confirmation_name"),
  });
  if (error) redirect(`/dashboard/${publicId}/settings?error=lifecycle_failed`);
  redirect("/dashboard");
}
export async function disconnectIntegration(formData: FormData) {
  const publicId = value(formData, "public_id");
  const { supabase, state } = await context(publicId);
  const { error } = await supabase.rpc("disconnect_workspace_integration", {
    target_workspace_id: state.workspace.id,
    target_provider: value(formData, "provider"),
  });
  await finish(publicId, "connections", error);
}

export async function saveRankBinding(formData: FormData) {
  const publicId = value(formData, "public_id");
  const { supabase, state } = await context(publicId);
  const discordRoleId = value(formData, "discord_role_id");
  const resources = await listDiscordWorkspaceResources(state.workspace.discord_guild_id);
  const discordRole = discordRoleId ? resources.roles.find((role) => role.id === discordRoleId) : null;
  const payload = {
    workspace_id: state.workspace.id,
    roblox_role_id: value(formData, "roblox_role_id"),
    roblox_role_name: value(formData, "roblox_role_name"),
    discord_role_id: discordRole?.id || null,
    discord_role_name: discordRole?.name || null,
    minimum_activity_minutes: Number(
      value(formData, "minimum_activity_minutes") || 0,
    ),
    cooldown_minutes: Number(value(formData, "cooldown_minutes") || 0),
    requires_approval: formData.get("requires_approval") === "on",
  };
  const { error } = await supabase
    .from("rank_bindings")
    .upsert(payload, { onConflict: "workspace_id,roblox_role_id" });
  await finish(publicId, "ranking", error);
}
export async function deleteRankBinding(formData: FormData) {
  const publicId = value(formData, "public_id");
  const { supabase } = await context(publicId);
  const { error } = await supabase
    .from("rank_bindings")
    .delete()
    .eq("id", value(formData, "id"));
  await finish(publicId, "ranking", error);
}
export async function saveQuota(formData: FormData) {
  const publicId = value(formData, "public_id");
  const { supabase, state } = await context(publicId);
  const payload = {
    workspace_id: state.workspace.id,
    roblox_role_id: value(formData, "roblox_role_id"),
    period: value(formData, "period"),
    minutes_required: Number(value(formData, "minutes_required")),
    grace_minutes: Number(value(formData, "grace_minutes") || 0),
  };
  const { error } = await supabase
    .from("activity_quotas")
    .upsert(payload, { onConflict: "workspace_id,roblox_role_id,period" });
  await finish(publicId, "activity", error);
}
export async function addManualActivity(formData: FormData) {
  const publicId = value(formData, "public_id");
  const { supabase, state } = await context(publicId);
  const minutes = Math.max(1, Number(value(formData, "minutes") || 0));
  const ended = new Date();
  const started = new Date(ended.getTime() - minutes * 60000);
  const { error } = await supabase
    .from("activity_sessions")
    .insert({
      workspace_id: state.workspace.id,
      roblox_user_id: value(formData, "roblox_user_id"),
      roblox_username: value(formData, "roblox_username"),
      started_at: started.toISOString(),
      ended_at: ended.toISOString(),
      duration_seconds: minutes * 60,
      source: "manual",
    });
  await finish(publicId, "activity", error);
}
type ApplicationField = {
  id: string;
  label: string;
  type: "short_text" | "long_text" | "select";
  required: boolean;
  options: string[];
};
function applicationFields(raw: string): ApplicationField[] {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .slice(0, 25)
      .map((field, index) => {
        const item = field as Partial<ApplicationField>;
        const type = ["short_text", "long_text", "select"].includes(
          String(item.type),
        )
          ? (item.type as ApplicationField["type"])
          : "long_text";
        return {
          id: `q${index + 1}`,
          label: String(item.label || "")
            .trim()
            .slice(0, 180),
          type,
          required: item.required !== false,
          options:
            type === "select" && Array.isArray(item.options)
              ? item.options
                  .map((option) => String(option).trim().slice(0, 80))
                  .filter(Boolean)
                  .slice(0, 20)
              : [],
        };
      })
      .filter(
        (field) =>
          field.label && (field.type !== "select" || field.options.length >= 2),
      );
  } catch {
    return [];
  }
}
export async function createApplicationForm(formData: FormData) {
  const publicId = value(formData, "public_id");
  const { supabase, user, state } = await context(publicId);
  if (!["owner", "admin"].includes(state.workspace.role))
    redirect(
      `/dashboard/${publicId}/applications?error=application_manage_forbidden`,
    );
  const fields = applicationFields(value(formData, "fields_json"));
  const targetRoleId = value(formData, "target_role_id");
  const submissionsChannelId = value(formData, "submissions_channel_id");
  const resources = await listDiscordWorkspaceResources(
    state.workspace.discord_guild_id,
  );
  const role = resources.roles.find((item) => item.id === targetRoleId);
  const channel = submissionsChannelId
    ? resources.channels.find((item) => item.id === submissionsChannelId)
    : null;
  if (
    !value(formData, "name") ||
    !value(formData, "description") ||
    !role ||
    !fields.length ||
    (submissionsChannelId && !channel)
  )
    redirect(`/dashboard/${publicId}/applications?error=application_invalid`);
  const status = ["draft", "open", "paused"].includes(value(formData, "status"))
    ? value(formData, "status")
    : "draft";
  const { error } = await supabase
    .from("application_forms")
    .insert({
      workspace_id: state.workspace.id,
      name: value(formData, "name").slice(0, 80),
      description: value(formData, "description").slice(0, 1200),
      target_role_id: role.id,
      target_role_name: role.name,
      status,
      fields,
      submissions_channel_id: channel?.id || null,
      created_by: user.id,
    });
  await finish(publicId, "applications", error);
}

export async function setApplicationStatus(formData: FormData) {
  const publicId = value(formData, "public_id");
  const status = value(formData, "status");
  if (!["draft", "open", "paused", "closed"].includes(status))
    redirect(`/dashboard/${publicId}/applications?error=application_invalid`);
  const { supabase, state } = await context(publicId);
  if (!["owner", "admin"].includes(state.workspace.role))
    redirect(
      `/dashboard/${publicId}/applications?error=application_manage_forbidden`,
    );
  const { error } = await supabase
    .from("application_forms")
    .update({ status })
    .eq("workspace_id", state.workspace.id)
    .eq("id", value(formData, "id"));
  await finish(publicId, "applications", error);
}

export async function announceApplication(formData: FormData) {
  const publicId = value(formData, "public_id");
  const channelId = value(formData, "channel_id");
  const formId = value(formData, "id");
  const { supabase, state } = await context(publicId);
  if (!["owner", "admin", "operator"].includes(state.workspace.role))
    redirect(
      `/dashboard/${publicId}/applications?error=application_manage_forbidden`,
    );
  const { data: application } = await supabase
    .from("application_forms")
    .select("id,name,description,target_role_name,status")
    .eq("workspace_id", state.workspace.id)
    .eq("id", formId)
    .maybeSingle();
  if (!application || application.status !== "open")
    redirect(`/dashboard/${publicId}/applications?error=application_not_open`);
  const result = await sendDiscordChannelMessage({
    token: process.env.DISCORD_BOT_TOKEN?.trim() || "",
    guildId: state.workspace.discord_guild_id || undefined,
    channelId,
    content: "",
    embed: {
      title: application.name,
      description: `${application.description || "Applications are now open."}\n\n**Position:** ${application.target_role_name || "Community team"}\n**Application ID:** \`${application.id}\`\n\n[Apply through Nexora](${nexoraSiteUrl(`/apply/${application.id}`)})`,
      color: 0x111111,
      footer: { text: `${state.workspace.name} · Powered by Nexora Rank` },
      timestamp: new Date().toISOString(),
    },
  });
  if (!result.ok)
    redirect(`/dashboard/${publicId}/applications?error=${result.error}`);
  const { error } = await supabase
    .from("application_forms")
    .update({
      announcement_channel_id: channelId,
      announcement_message_id: result.messageId,
    })
    .eq("workspace_id", state.workspace.id)
    .eq("id", application.id);
  if (error) redirect(`/dashboard/${publicId}/applications?error=save_failed`);
  revalidatePath(`/dashboard/${publicId}/applications`);
  redirect(`/dashboard/${publicId}/applications?saved=application_announced`);
}

export async function reviewApplication(formData: FormData) {
  const publicId = value(formData, "public_id");
  const decision = value(formData, "decision");
  const submissionId = value(formData, "id");
  const { supabase, user, state } = await context(publicId);
  if (
    !["owner", "admin", "reviewer"].includes(state.workspace.role) ||
    !["approved", "declined"].includes(decision)
  )
    redirect(
      `/dashboard/${publicId}/applications?error=application_review_forbidden`,
    );
  const { data: submission } = await supabase
    .from("application_submissions")
    .select(
      "id,status,applicant_discord_user_id,application_forms(target_role_id)",
    )
    .eq("workspace_id", state.workspace.id)
    .eq("id", submissionId)
    .maybeSingle();
  if (!submission || !["submitted", "in_review"].includes(submission.status))
    redirect(
      `/dashboard/${publicId}/applications?error=application_already_reviewed`,
    );
  let roleWarning = "";
  const relatedForm = Array.isArray(submission.application_forms)
    ? submission.application_forms[0]
    : submission.application_forms;
  if (
    decision === "approved" &&
    state.workspace.discord_guild_id &&
    submission.applicant_discord_user_id &&
    relatedForm?.target_role_id
  ) {
    const roleResult = await assignDiscordGuildRole({
      guildId: state.workspace.discord_guild_id,
      userId: submission.applicant_discord_user_id,
      roleId: relatedForm.target_role_id,
    });
    if (!roleResult.ok) roleWarning = roleResult.error;
  }
  const notes =
    [
      value(formData, "review_notes"),
      roleWarning ? `Discord role warning: ${roleWarning}` : "",
    ]
      .filter(Boolean)
      .join("\n")
      .slice(0, 1000) || null;
  const { error } = await supabase
    .from("application_submissions")
    .update({
      status: decision,
      reviewed_by: user.id,
      review_notes: notes,
      reviewed_at: new Date().toISOString(),
    })
    .eq("workspace_id", state.workspace.id)
    .eq("id", submission.id)
    .in("status", ["submitted", "in_review"]);
  await finish(publicId, "applications", error);
}
export async function createAutomation(formData: FormData) {
  const publicId = value(formData, "public_id");
  const { supabase, user, state } = await context(publicId);
  const { error } = await supabase
    .from("automations")
    .insert({
      workspace_id: state.workspace.id,
      name: value(formData, "name"),
      trigger_type: value(formData, "trigger_type"),
      enabled: formData.get("enabled") === "on",
      definition: {
        action: value(formData, "action"),
        channel_id: value(formData, "channel_id") || null,
      },
      created_by: user.id,
    });
  await finish(publicId, "automations", error);
}
export async function deleteRecord(formData: FormData) {
  const publicId = value(formData, "public_id");
  const table = value(formData, "table") as
    | "activity_quotas"
    | "application_forms"
    | "automations"
    | "departments"
    | "community_sessions"
    | "leave_requests"
    | "workspace_tasks"
    | "knowledge_entries"
    | "announcement_templates"
    | "workspace_roblox_groups";
  const path = value(formData, "path");
  const allowed = [
    "activity_quotas",
    "application_forms",
    "automations",
    "departments",
    "community_sessions",
    "leave_requests",
    "workspace_tasks",
    "knowledge_entries",
    "announcement_templates",
    "workspace_roblox_groups",
  ];
  if (!allowed.includes(table)) redirect(`/dashboard/${publicId}`);
  const { supabase } = await context(publicId);
  const { error } = await supabase
    .from(table)
    .delete()
    .eq("id", value(formData, "id"));
  await finish(publicId, path, error);
}

export async function createDepartment(formData: FormData) {
  const publicId = value(formData, "public_id");
  const { supabase, state } = await context(publicId);
  const { error } = await supabase
    .from("departments")
    .insert({
      workspace_id: state.workspace.id,
      name: value(formData, "name"),
      description: value(formData, "description") || null,
      discord_role_id: value(formData, "discord_role_id") || null,
      roblox_group_id: value(formData, "roblox_group_id") || null,
    });
  await finish(publicId, "operations", error);
}
export async function createCommunitySession(formData: FormData) {
  const publicId = value(formData, "public_id");
  const { supabase, user, state } = await context(publicId);
  const { error } = await supabase
    .from("community_sessions")
    .insert({
      workspace_id: state.workspace.id,
      session_type: value(formData, "session_type"),
      title: value(formData, "title"),
      starts_at: new Date(value(formData, "starts_at")).toISOString(),
      host_user_id: user.id,
      discord_channel_id: value(formData, "discord_channel_id") || null,
      notes: value(formData, "notes") || null,
    });
  await finish(publicId, "operations", error);
}
export async function createLeaveRequest(formData: FormData) {
  const publicId = value(formData, "public_id");
  const { supabase, state } = await context(publicId);
  const { error } = await supabase
    .from("leave_requests")
    .insert({
      workspace_id: state.workspace.id,
      member_name: value(formData, "member_name"),
      starts_on: value(formData, "starts_on"),
      ends_on: value(formData, "ends_on"),
      reason: value(formData, "reason"),
    });
  await finish(publicId, "operations", error);
}
export async function createWorkspaceTask(formData: FormData) {
  const publicId = value(formData, "public_id");
  const { supabase, user, state } = await context(publicId);
  const due = value(formData, "due_at");
  const { error } = await supabase
    .from("workspace_tasks")
    .insert({
      workspace_id: state.workspace.id,
      title: value(formData, "title"),
      description: value(formData, "description") || null,
      priority: value(formData, "priority") || "normal",
      due_at: due ? new Date(due).toISOString() : null,
      created_by: user.id,
    });
  await finish(publicId, "operations", error);
}
export async function createKnowledgeEntry(formData: FormData) {
  const publicId = value(formData, "public_id");
  const { supabase, user, state } = await context(publicId);
  const { error } = await supabase
    .from("knowledge_entries")
    .insert({
      workspace_id: state.workspace.id,
      entry_type: value(formData, "entry_type"),
      title: value(formData, "title"),
      content: value(formData, "content"),
      visibility: value(formData, "visibility"),
      created_by: user.id,
    });
  await finish(publicId, "knowledge", error);
}
export async function createAnnouncementTemplate(formData: FormData) {
  const publicId = value(formData, "public_id");
  const { supabase, user, state } = await context(publicId);
  const { error } = await supabase
    .from("announcement_templates")
    .insert({
      workspace_id: state.workspace.id,
      name: value(formData, "name"),
      announcement_type: value(formData, "announcement_type"),
      title_template: value(formData, "title_template"),
      body_template: value(formData, "body_template"),
      discord_channel_id: value(formData, "discord_channel_id") || null,
      created_by: user.id,
    });
  await finish(publicId, "communications", error);
}
export async function saveCommunityMessaging(formData: FormData) {
  const publicId = value(formData, "public_id");
  const { supabase, state } = await context(publicId);
  const { error } = await supabase.rpc("save_community_messaging", {
    target_workspace_id: state.workspace.id,
    requested_welcome_enabled: formData.get("welcome_enabled") === "on",
    requested_welcome_channel_id: value(formData, "welcome_channel_id"),
    requested_welcome_message: value(formData, "welcome_message"),
    requested_goodbye_enabled: formData.get("goodbye_enabled") === "on",
    requested_goodbye_channel_id: value(formData, "goodbye_channel_id"),
    requested_goodbye_message: value(formData, "goodbye_message"),
    requested_nickname_sync_enabled:
      formData.get("nickname_sync_enabled") === "on",
    requested_verification_dm_enabled:
      formData.get("verification_dm_enabled") === "on",
    requested_role_sync_enabled: formData.get("role_sync_enabled") === "on",
    requested_member_count_channel_id: value(
      formData,
      "member_count_channel_id",
    ),
  });
  await finish(publicId, "communications", error);
}
export async function sendDiscordMessage(formData: FormData) {
  const publicId = value(formData, "public_id");
  const channelId = value(formData, "channel_id");
  const content = value(formData, "message");
  const useEmbed = formData.get("use_embed") === "on";
  const embedTitle = value(formData, "embed_title");
  const embedColor = value(formData, "embed_color").toLowerCase() || "#5865f2";
  const authorName = value(formData, "author_name");
  const authorIcon = value(formData, "author_icon_url");
  const footer = value(formData, "footer_text");
  const thumbnail = value(formData, "thumbnail_url");
  const botNickname =
    formData.get("update_bot_nickname") === "on"
      ? value(formData, "bot_nickname")
      : "";
  if (!/^\d{17,22}$/.test(channelId))
    redirect(
      `/dashboard/${publicId}/communications?error=discord_channel_invalid`,
    );
  if (!content || content.length > (useEmbed ? 4000 : 2000))
    redirect(
      `/dashboard/${publicId}/communications?error=discord_message_invalid`,
    );
  if (
    useEmbed &&
    (!/^#[0-9a-f]{6}$/.test(embedColor) ||
      embedTitle.length > 256 ||
      authorName.length > 256 ||
      footer.length > 2048)
  )
    redirect(
      `/dashboard/${publicId}/communications?error=discord_embed_invalid`,
    );
  if (botNickname.length > 32)
    redirect(
      `/dashboard/${publicId}/communications?error=discord_branding_invalid`,
    );
  if (
    (authorIcon && !validHttpUrl(authorIcon)) ||
    (thumbnail && !validHttpUrl(thumbnail))
  )
    redirect(
      `/dashboard/${publicId}/communications?error=discord_embed_invalid`,
    );
  const { state } = await context(publicId);
  if (!["owner", "admin", "operator"].includes(state.workspace.role))
    redirect(
      `/dashboard/${publicId}/communications?error=discord_send_forbidden`,
    );
  if (state.workspace.operational_status !== "active")
    redirect(
      `/dashboard/${publicId}/communications?error=workspace_restricted`,
    );
  if (!state.workspace.discord_guild_id)
    redirect(
      `/dashboard/${publicId}/communications?error=discord_not_connected`,
    );
  const description =
    formData.get("bold_message") === "on"
      ? `**${content.replaceAll("**", "")}**`
      : content;
  const embed = useEmbed
    ? {
        title: embedTitle || undefined,
        description,
        color: Number.parseInt(embedColor.slice(1), 16),
        author: authorName
          ? {
              name: authorName,
              ...(authorIcon ? { icon_url: authorIcon } : {}),
            }
          : undefined,
        footer: footer ? { text: footer } : undefined,
        thumbnail: thumbnail ? { url: thumbnail } : undefined,
      }
    : undefined;
  const result = await sendDiscordChannelMessage({
    token: process.env.DISCORD_BOT_TOKEN?.trim() || "",
    guildId: state.workspace.discord_guild_id,
    channelId,
    content,
    embed,
    botNickname: botNickname || undefined,
  });
  if (!result.ok)
    redirect(`/dashboard/${publicId}/communications?error=${result.error}`);
  revalidatePath(`/dashboard/${publicId}/communications`);
  redirect(`/dashboard/${publicId}/communications?saved=discord_message`);
}
function validHttpUrl(candidate: string) {
  try {
    const url = new URL(candidate);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}
export async function addWorkspaceRobloxGroup(formData: FormData) {
  const publicId = value(formData, "public_id");
  const groupId = value(formData, "group_id");
  if (!/^\d{1,20}$/.test(groupId))
    redirect(`/dashboard/${publicId}/connections?error=invalid_group`);
  const details = await getRobloxGroupDetails(groupId);
  if (!details)
    redirect(`/dashboard/${publicId}/connections?error=group_not_found`);
  const { supabase, state } = await context(publicId);
  const { error } = await supabase
    .from("workspace_roblox_groups")
    .insert({
      workspace_id: state.workspace.id,
      group_id: details.id,
      group_name: details.name,
      purpose: value(formData, "purpose") || "community",
      is_primary: false,
    });
  await finish(publicId, "connections", error);
}
export async function createDashboardRankRequest(formData: FormData) {
  const publicId = value(formData, "public_id");
  const { supabase, user, state } = await context(publicId);
  const bindingId = value(formData, "binding_id");
  const { data: binding, error: bindingError } = await supabase
    .from("rank_bindings")
    .select("roblox_role_id,roblox_role_name,requires_approval")
    .eq("id", bindingId)
    .eq("workspace_id", state.workspace.id)
    .maybeSingle();
  if (bindingError || !binding)
    await finish(
      publicId,
      "ranking",
      bindingError || new Error("binding_missing"),
    );
  const { error } = await supabase
    .from("rank_actions")
    .insert({
      workspace_id: state.workspace.id,
      target_roblox_user_id: value(formData, "roblox_user_id"),
      target_username: value(formData, "roblox_username"),
      requested_by: user.id,
      to_role_id: binding!.roblox_role_id,
      to_role_name: binding!.roblox_role_name,
      reason: value(formData, "reason") || "Dashboard rank request",
      status: binding!.requires_approval ? "pending" : "approved",
      policy_snapshot: {
        source: "dashboard",
        requires_approval: binding!.requires_approval,
      },
    });
  await finish(publicId, "ranking", error);
}
