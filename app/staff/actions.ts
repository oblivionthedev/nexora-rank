"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import {
  assignDiscordGuildRole,
  removeDiscordGuildRole,
} from "@/lib/discord-resources";
import {
  NEXORA_BETA_ROLE_ID,
  NEXORA_DISCORD_GUILD_ID,
} from "@/lib/nexora-discord";
import { getRobloxGroupDetails } from "@/lib/roblox-groups";

function clean(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

function errorCode(message?: string) {
  const known = [
    "staff_access_denied",
    "staff_moderation_denied",
    "staff_ban_denied",
    "moderation_reason_required",
    "workspace_not_found",
    "staff_management_denied",
    "invalid_staff_role",
    "nexora_account_not_found",
    "owner_role_required",
    "owner_role_cannot_be_changed",
    "staff_member_not_found",
    "invalid_suspension_days",
    "invalid_moderation_request",
    "invalid_beta_status",
    "security_block_not_found",
  ];
  return known.find((code) => message?.includes(code)) ?? "action_failed";
}

async function authenticatedClient() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/staff");
  return supabase;
}

export async function moderateWorkspace(formData: FormData) {
  const workspaceId = clean(formData.get("workspace_id"));
  const action = clean(formData.get("moderation_action"));
  const reason = clean(formData.get("reason"));
  const daysValue = clean(formData.get("suspension_days"));
  const suspensionDays = action === "suspend" ? Number(daysValue) : undefined;
  const canAppeal = formData.get("appeal_allowed") === "on";
  const appealMessage = clean(formData.get("appeal_message"));
  if (
    !workspaceId ||
    !["suspend", "restore", "ban"].includes(action) ||
    reason.length < 4 ||
    reason.length > 500
  ) {
    redirect("/staff?error=invalid_moderation_request");
  }

  const supabase = await authenticatedClient();
  const { error } = await supabase.rpc("staff_moderate_workspace", {
    target_workspace_id: workspaceId,
    moderation_action: action,
    action_reason: reason,
    suspension_days: suspensionDays,
    can_appeal: canAppeal,
    appeal_message: appealMessage || undefined,
  });
  if (error) redirect(`/staff?error=${errorCode(error.message)}`);
  revalidatePath("/staff");
  revalidatePath("/dashboard");
  redirect(`/staff?notice=workspace_${action}`);
}

export async function grantStaffRole(formData: FormData) {
  const email = clean(formData.get("email")).toLowerCase();
  const role = clean(formData.get("role"));
  if (
    !email.includes("@") ||
    !["admin", "moderator", "support"].includes(role)
  ) {
    redirect("/staff?error=invalid_staff_request");
  }
  const supabase = await authenticatedClient();
  const { error } = await supabase.rpc("staff_grant_role", {
    target_email: email,
    target_role: role,
  });
  if (error) redirect(`/staff?error=${errorCode(error.message)}`);
  revalidatePath("/staff");
  redirect("/staff?notice=staff_updated");
}

export async function revokeStaffRole(formData: FormData) {
  const userId = clean(formData.get("user_id"));
  if (!userId) redirect("/staff?error=invalid_staff_request");
  const supabase = await authenticatedClient();
  const { error } = await supabase.rpc("staff_revoke_role", {
    target_user_id: userId,
  });
  if (error) redirect(`/staff?error=${errorCode(error.message)}`);
  revalidatePath("/staff");
  redirect("/staff?notice=staff_revoked");
}

export type StaffCodeState = { error?: string };

export async function beginStaffSignIn(
  _state: StaffCodeState,
  formData: FormData,
): Promise<StaffCodeState> {
  const code = clean(formData.get("staff_code")).toUpperCase();
  if (!/^[A-Z0-9]{25}$/.test(code))
    return {
      error: "Enter the complete 25-character code from the Nexora bot.",
    };
  const cookieStore = await cookies();
  cookieStore.set("nexora_staff_code", code, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 10 * 60,
  });
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/staff/authorize");
}

export async function staffSignOut() {
  const supabase = await createClient();
  await supabase.rpc("revoke_current_staff_session");
  await supabase.auth.signOut();
  redirect("/staff/login");
}

export async function updateBetaApplication(formData: FormData) {
  const applicationId = clean(formData.get("application_id"));
  const status = clean(formData.get("status"));
  if (
    !applicationId ||
    !["submitted", "reviewing", "selected", "waitlisted", "declined"].includes(
      status,
    )
  )
    redirect("/staff?error=invalid_beta_request");
  const supabase = await authenticatedClient();
  const { data, error } = await supabase.rpc("staff_update_beta_application", {
    application_id: applicationId,
    requested_status: status,
  });
  if (error) redirect(`/staff?error=${errorCode(error.message)}`);
  const result = data as unknown as {
    ok?: boolean;
    discord_user_id?: string | null;
  };
  if (result.discord_user_id) {
    const roleResult =
      status === "selected"
        ? await assignDiscordGuildRole({
            guildId: NEXORA_DISCORD_GUILD_ID,
            userId: result.discord_user_id,
            roleId: NEXORA_BETA_ROLE_ID,
          })
        : await removeDiscordGuildRole({
            guildId: NEXORA_DISCORD_GUILD_ID,
            userId: result.discord_user_id,
            roleId: NEXORA_BETA_ROLE_ID,
          });
    // The database has also queued this role change for the bot worker. A
    // failed direct request is therefore retried instead of losing the role.
    void roleResult;
  }
  revalidatePath("/staff");
  redirect("/staff?notice=beta_updated#beta-applications");
}

function robloxGroupId(value: string) {
  const direct = value.match(/^\d{1,20}$/)?.[0];
  if (direct) return direct;
  return value.match(/(?:groups|communities)\/(\d{1,20})/i)?.[1] || "";
}

export async function addPartner(formData: FormData) {
  const groupId = robloxGroupId(clean(formData.get("roblox_group")));
  const discordUrl = clean(formData.get("discord_invite"));
  const bannerUrl = clean(formData.get("group_banner_url"));
  if (
    !groupId ||
    !/^https:\/\/(?:www\.)?(?:discord\.gg|discord\.com\/invite)\/[A-Za-z0-9_-]+\/?$/.test(
      discordUrl,
    ) || (bannerUrl && !/^https:\/\//.test(bannerUrl))
  ) {
    redirect("/staff?error=invalid_partner#partners");
  }
  const group = await getRobloxGroupDetails(groupId);
  if (!group) redirect("/staff?error=roblox_group_not_found#partners");
  const supabase = await authenticatedClient();
  const { error } = await supabase.rpc("staff_add_partner", {
    group_id: group.id,
    group_name: group.name,
    group_logo_url: group.iconUrl || "",
    group_banner_url: bannerUrl,
    member_count: group.memberCount,
    owner_user_id: group.owner?.userId || "",
    owner_username: group.owner?.username || "",
    owner_display_name: group.owner?.displayName || "",
    discord_url: discordUrl,
  });
  if (error) redirect(`/staff?error=${errorCode(error.message)}#partners`);
  revalidatePath("/staff");
  revalidatePath("/partners");
  redirect("/staff?notice=partner_added#partners");
}

export async function removePartner(formData: FormData) {
  const partnerId = clean(formData.get("partner_id"));
  if (!partnerId) redirect("/staff?error=invalid_partner#partners");
  const supabase = await authenticatedClient();
  const { error } = await supabase.rpc("staff_remove_partner", {
    partner_id: partnerId,
  });
  if (error) redirect(`/staff?error=${errorCode(error.message)}#partners`);
  revalidatePath("/staff");
  revalidatePath("/partners");
  redirect("/staff?notice=partner_removed#partners");
}

export async function addNexoraGroup(formData: FormData) {
  const groupId = robloxGroupId(clean(formData.get("roblox_group")));
  const discordUrl = clean(formData.get("discord_invite"));
  const bannerUrl = clean(formData.get("group_banner_url"));
  if (!groupId || (discordUrl && !/^https:\/\/(?:www\.)?(?:discord\.gg|discord\.com\/invite)\/[A-Za-z0-9_-]+\/?$/.test(discordUrl)) || (bannerUrl && !/^https:\/\//.test(bannerUrl)))
    redirect("/staff?error=invalid_group_listing#nexora-groups");
  const group = await getRobloxGroupDetails(groupId);
  if (!group) redirect("/staff?error=roblox_group_not_found#nexora-groups");
  const supabase = await authenticatedClient();
  const { error } = await supabase.rpc("staff_add_nexora_group", {
    group_id: group.id, group_name: group.name, group_logo_url: group.iconUrl || "",
    group_banner_url: bannerUrl,
    member_count: group.memberCount, owner_user_id: group.owner?.userId || "",
    owner_username: group.owner?.username || "", owner_display_name: group.owner?.displayName || "",
    discord_url: discordUrl,
  });
  if (error) redirect(`/staff?error=${errorCode(error.message)}#nexora-groups`);
  revalidatePath("/staff"); revalidatePath("/groups");
  redirect("/staff?notice=group_added#nexora-groups");
}

export async function removeNexoraGroup(formData: FormData) {
  const id = Number(clean(formData.get("group_record_id")));
  if (!Number.isSafeInteger(id)) redirect("/staff?error=invalid_group_listing#nexora-groups");
  const supabase = await authenticatedClient();
  const { error } = await supabase.rpc("staff_remove_nexora_group", { group_record_id: id });
  if (error) redirect(`/staff?error=${errorCode(error.message)}#nexora-groups`);
  revalidatePath("/staff"); revalidatePath("/groups");
  redirect("/staff?notice=group_removed#nexora-groups");
}

export async function manageBetaApplication(formData: FormData) {
  const applicationId = clean(formData.get("application_id"));
  const action = clean(formData.get("manage_action"));
  if (!applicationId || !["archive", "delete"].includes(action)) redirect("/staff?error=invalid_beta_request#beta-applications");
  const supabase = await authenticatedClient();
  const rpc = action === "delete" ? "staff_delete_beta_application" : "staff_archive_beta_application";
  const { error } = await supabase.rpc(rpc, { application_id: applicationId });
  if (error) redirect(`/staff?error=${errorCode(error.message)}#beta-applications`);
  revalidatePath("/staff");
  redirect(`/staff?notice=beta_${action}d#beta-applications`);
}

export async function resolveSecurityIncident(formData: FormData) {
  const incidentId = Number(clean(formData.get("incident_id")));
  if (!Number.isSafeInteger(incidentId)) redirect("/staff?error=invalid_security_incident#security-incidents");
  const supabase = await authenticatedClient();
  const { data, error } = await supabase.rpc("staff_resolve_security_incident", { incident_id: incidentId });
  if (error) redirect(`/staff?error=${errorCode(error.message)}#security-incidents`);
  if (!data) redirect("/staff?error=security_incident_not_open#security-incidents");
  revalidatePath("/staff");
  redirect("/staff?notice=security_resolved#security-incidents");
}

export async function unblockSecurityAccount(formData: FormData) {
  const blockId = Number(clean(formData.get("block_id")));
  if (!Number.isSafeInteger(blockId))
    redirect("/staff?error=invalid_security_block#security-incidents");
  const supabase = await authenticatedClient();
  const { data, error } = await supabase.rpc(
    "staff_unblock_security_account",
    { requested_block_id: blockId },
  );
  if (error)
    redirect(`/staff?error=${errorCode(error.message)}#security-incidents`);
  if (!data)
    redirect("/staff?error=security_block_not_found#security-incidents");
  revalidatePath("/staff");
  redirect("/staff?notice=security_unblocked#security-incidents");
}
