"use server";

import { redirect } from "next/navigation";
import { checkRequiredRobloxMembership, createMembershipAutomationClient } from "@/lib/roblox-membership";
import { createClient } from "@/lib/supabase/server";

const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]{1,46}[a-z0-9]$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function authenticatedClient() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/onboarding");
  return { supabase, user };
}

export async function deferRobloxLink() {
  const { supabase, user } = await authenticatedClient();
  const { error } = await supabase
    .from("profiles")
    .update({ roblox_link_deferred_at: new Date().toISOString() })
    .eq("id", user.id);
  if (error) redirect("/onboarding?error=identity_update_failed");
  redirect("/onboarding");
}

export async function saveOwnerProfile(formData: FormData) {
  const firstName = String(formData.get("first_name") ?? "").trim();
  const lastName = String(formData.get("last_name") ?? "").trim();
  const contactEmail = String(formData.get("contact_email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (
    firstName.length < 1 || firstName.length > 60 ||
    lastName.length < 1 || lastName.length > 60 ||
    contactEmail.length > 254 || !EMAIL_PATTERN.test(contactEmail)
  ) redirect("/onboarding?error=invalid_profile");

  if (password && (
    password.length < 10 ||
    password.length > 72 ||
    !/[a-z]/.test(password) ||
    !/[A-Z]/.test(password) ||
    !/[0-9]/.test(password)
  )) redirect("/onboarding?error=weak_password");

  const { supabase, user } = await authenticatedClient();
  let passwordSetAt: string | null = null;

  if (password) {
    const { error: passwordError } = await supabase.auth.updateUser({ password });
    if (passwordError) redirect("/onboarding?error=password_update_failed");
    passwordSetAt = new Date().toISOString();
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      first_name: firstName,
      last_name: lastName,
      display_name: `${firstName} ${lastName}`,
      contact_email: contactEmail,
      ...(passwordSetAt ? { password_set_at: passwordSetAt } : {}),
    })
    .eq("id", user.id);

  if (error) redirect("/onboarding?error=profile_update_failed");
  redirect("/onboarding");
}

export async function selectFreePlan() {
  const { supabase, user } = await authenticatedClient();
  const { error } = await supabase
    .from("profiles")
    .update({ plan_key: "free", plan_selected_at: new Date().toISOString() })
    .eq("id", user.id);
  if (error) redirect("/onboarding?error=plan_update_failed");
  redirect("/onboarding");
}

export async function createOnboardingWorkspace(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim().toLowerCase();
  if (name.length < 2 || name.length > 64 || !SLUG_PATTERN.test(slug)) {
    redirect("/onboarding?error=invalid_workspace");
  }

  const { supabase, user } = await authenticatedClient();

  const { data: policy } = await supabase.rpc("get_free_membership_policy");
  const membershipPolicy = policy as { enabled?: boolean } | null;
  if (membershipPolicy?.enabled) {
    const secret = process.env.CRON_SECRET;
    if (!secret) redirect("/onboarding?error=membership_check_unavailable");

    const { data: robloxLink } = await supabase
      .from("account_links")
      .select("provider_user_id")
      .eq("user_id", user.id)
      .eq("provider", "roblox")
      .maybeSingle();
    if (!robloxLink) redirect("/onboarding?error=roblox_identity_required");

    const membership = await checkRequiredRobloxMembership(robloxLink.provider_user_id);
    const automation = createMembershipAutomationClient();
    if (!membership.ok) {
      await automation.rpc("record_owner_membership_preflight", {
        candidate_secret: secret,
        target_user_id: user.id,
        check_result: "unverifiable",
      });
      redirect("/onboarding?error=membership_check_unavailable");
    }

    await automation.rpc("record_owner_membership_preflight", {
      candidate_secret: secret,
      target_user_id: user.id,
      check_result: membership.member ? "member" : "not_member",
    });
    if (!membership.member) redirect("/onboarding?error=roblox_membership_required");
  }

  const { error } = await supabase.rpc("create_workspace", {
    workspace_name: name,
    workspace_slug: slug,
  });

  if (error) {
    if (error.message.includes("free_workspace_limit")) redirect("/dashboard");
    if (error.message.includes("onboarding_incomplete")) redirect("/onboarding?error=onboarding_incomplete");
    if (error.message.includes("roblox_membership_required")) redirect("/onboarding?error=roblox_membership_required");
    if (error.code === "23505") redirect("/onboarding?error=slug_taken");
    redirect("/onboarding?error=workspace_failed");
  }

  redirect("/onboarding/complete");
}

