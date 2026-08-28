"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function clean(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

function errorCode(message?: string) {
  const known = [
    "staff_access_denied", "staff_moderation_denied", "staff_ban_denied",
    "moderation_reason_required", "workspace_not_found", "staff_management_denied",
    "invalid_staff_role", "nexora_account_not_found", "owner_role_required",
    "owner_role_cannot_be_changed", "staff_member_not_found",
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
  if (!workspaceId || !["suspend", "restore", "ban"].includes(action) || reason.length < 4 || reason.length > 500) {
    redirect("/staff?error=invalid_moderation_request");
  }

  const supabase = await authenticatedClient();
  const { error } = await supabase.rpc("staff_moderate_workspace", {
    target_workspace_id: workspaceId,
    moderation_action: action,
    action_reason: reason,
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
