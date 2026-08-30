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

function clean(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

function errorCode(message?: string) {
  const known = [
    "staff_access_denied", "staff_moderation_denied", "staff_ban_denied",
    "moderation_reason_required", "workspace_not_found", "staff_management_denied",
    "invalid_staff_role", "nexora_account_not_found", "owner_role_required",
    "owner_role_cannot_be_changed", "staff_member_not_found",
    "invalid_suspension_days", "invalid_moderation_request", "invalid_beta_status",
  ];
  return known.find((code) => message?.includes(code)) ?? "action_failed";
}

async function authenticatedClient() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
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
  if (!workspaceId || !["suspend", "restore", "ban"].includes(action) || reason.length < 4 || reason.length > 500) {
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
  if (!email.includes("@") || !["admin", "moderator", "support"].includes(role)) {
    redirect("/staff?error=invalid_staff_request");
  }
  const supabase = await authenticatedClient();
  const { error } = await supabase.rpc("staff_grant_role", { target_email: email, target_role: role });
  if (error) redirect(`/staff?error=${errorCode(error.message)}`);
  revalidatePath("/staff");
  redirect("/staff?notice=staff_updated");
}

export async function revokeStaffRole(formData: FormData) {
  const userId = clean(formData.get("user_id"));
  if (!userId) redirect("/staff?error=invalid_staff_request");
  const supabase = await authenticatedClient();
  const { error } = await supabase.rpc("staff_revoke_role", { target_user_id: userId });
  if (error) redirect(`/staff?error=${errorCode(error.message)}`);
  revalidatePath("/staff");
  redirect("/staff?notice=staff_revoked");
}

export type StaffCodeState = { error?: string };

export async function beginStaffSignIn(_state: StaffCodeState, formData: FormData): Promise<StaffCodeState> {
  const code = clean(formData.get("staff_code")).toUpperCase();
  if (!/^[A-Z0-9]{25}$/.test(code)) return { error: "Enter the complete 25-character code from the Nexora bot." };
  const cookieStore = await cookies();
  cookieStore.set("nexora_staff_code", code, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 10 * 60 });
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
  if (!applicationId || !["submitted", "reviewing", "selected", "waitlisted", "declined"].includes(status)) redirect("/staff?error=invalid_beta_request");
  const supabase = await authenticatedClient();
  const { data, error } = await supabase.rpc("staff_update_beta_application", { application_id: applicationId, requested_status: status });
  if (error) redirect(`/staff?error=${errorCode(error.message)}`);
  const result = data as unknown as {
    ok?: boolean;
    discord_user_id?: string | null;
  };
  if (result.discord_user_id) {
    const roleResult = status === "selected"
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
    if (!roleResult.ok) redirect("/staff?error=beta_role_sync_failed#beta-applications");
  }
  revalidatePath("/staff");
  redirect("/staff?notice=beta_updated#beta-applications");
}
