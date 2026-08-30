"use server";

import { redirect } from "next/navigation";
import {
  checkRequiredRobloxMembership,
  createMembershipAutomationClient,
  listRobloxGroups,
} from "@/lib/roblox-membership";
import { createClient } from "@/lib/supabase/server";
import {
  NEXORA_LOG_CHANNELS,
  nexoraLogBrand,
  sendNexoraOperationalLog,
} from "@/lib/operational-logs";
import { assignDiscordGuildRole } from "@/lib/discord-resources";
import {
  NEXORA_DISCORD_GUILD_ID,
  NEXORA_WORKSPACE_OWNER_ROLE_ID,
} from "@/lib/nexora-discord";

const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]{1,46}[a-z0-9]$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function authenticatedClient() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
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
  const contactEmail = String(formData.get("contact_email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (
    firstName.length < 1 ||
    firstName.length > 60 ||
    lastName.length < 1 ||
    lastName.length > 60 ||
    contactEmail.length > 254 ||
    !EMAIL_PATTERN.test(contactEmail)
  )
    redirect("/onboarding?error=invalid_profile");

  if (
    password &&
    (password.length < 10 ||
      password.length > 72 ||
      !/[a-z]/.test(password) ||
      !/[A-Z]/.test(password) ||
      !/[0-9]/.test(password))
  )
    redirect("/onboarding?error=weak_password");

  const { supabase } = await authenticatedClient();

  const { error: profileError } = await supabase.rpc(
    "save_onboarding_profile",
    {
      p_first_name: firstName,
      p_last_name: lastName,
      p_contact_email: contactEmail,
    },
  );
  if (profileError) redirect("/onboarding?error=profile_update_failed");

  if (password) {
    const { error: passwordError } = await supabase.auth.updateUser({
      password,
    });
    if (passwordError && passwordError.code !== "same_password")
      redirect("/onboarding?error=password_update_failed");
    const { error: confirmError } = await supabase.rpc("confirm_password_set");
    if (confirmError) redirect("/onboarding?error=password_update_failed");
  }
  redirect("/onboarding");
}

export async function selectFreePlan() {
  const { supabase } = await authenticatedClient();
  const { error } = await supabase.rpc("select_onboarding_plan", {
    p_plan_key: "free",
  });
  if (error) redirect("/onboarding?error=plan_update_failed");
  redirect("/onboarding");
}

export async function selectRobloxGroup(formData: FormData) {
  const groupId = String(formData.get("roblox_group_id") ?? "").trim();
  if (!/^\d+$/.test(groupId))
    redirect("/onboarding?error=invalid_roblox_group");
  const { supabase, user } = await authenticatedClient();
  const { data: link } = await supabase
    .from("account_links")
    .select("provider_user_id")
    .eq("user_id", user.id)
    .eq("provider", "roblox")
    .maybeSingle();
  if (!link) redirect("/onboarding?error=roblox_identity_required");
  const memberships = await listRobloxGroups(link.provider_user_id);
  if (!memberships.ok) redirect("/onboarding?error=roblox_groups_unavailable");
  const chosen = memberships.groups.find(
    (group) => group.id === groupId && group.roleRank === 255,
  );
  if (!chosen) redirect("/onboarding?error=invalid_roblox_group");
  const { error } = await supabase.rpc("select_onboarding_roblox_group", {
    p_group_id: chosen.id,
    p_group_name: chosen.name,
    p_group_role: chosen.role,
  });
  if (error) redirect("/onboarding?error=roblox_group_update_failed");
  redirect("/onboarding");
}

export async function createOnboardingWorkspace(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const slug = String(formData.get("slug") ?? "")
    .trim()
    .toLowerCase();
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

    const membership = await checkRequiredRobloxMembership(
      robloxLink.provider_user_id,
    );
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
    if (!membership.member)
      redirect("/onboarding?error=roblox_membership_required");
  }

  const { error } = await supabase.rpc("create_workspace", {
    workspace_name: name,
    workspace_slug: slug,
  });

  if (error) {
    if (error.message.includes("free_workspace_limit")) redirect("/dashboard");
    if (error.message.includes("onboarding_incomplete"))
      redirect("/onboarding?error=onboarding_incomplete");
    if (error.message.includes("roblox_membership_required"))
      redirect("/onboarding?error=roblox_membership_required");
    if (error.code === "23505") redirect("/onboarding?error=slug_taken");
    redirect("/onboarding?error=workspace_failed");
  }

  const { data: workspace } = await supabase
    .from("workspaces")
    .select("id, public_id, name, slug, created_at")
    .eq("created_by", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (workspace) {
    const { data: discordLink } = await supabase
      .from("account_links")
      .select("provider_user_id")
      .eq("user_id", user.id)
      .eq("provider", "discord")
      .maybeSingle();
    if (discordLink?.provider_user_id) {
      await assignDiscordGuildRole({
        guildId: NEXORA_DISCORD_GUILD_ID,
        userId: discordLink.provider_user_id,
        roleId: NEXORA_WORKSPACE_OWNER_ROLE_ID,
      });
    }
    await sendNexoraOperationalLog(NEXORA_LOG_CHANNELS.workspacesCreated, {
      title: "Workspace created",
      description: `**${workspace.name}** is now live on Nexora.`,
      color: 0x000000,
      author: nexoraLogBrand("Nexora Workspaces"),
      fields: [
        {
          name: "Workspace ID",
          value: `\`${workspace.public_id}\``,
          inline: true,
        },
        { name: "URL", value: `\`${workspace.slug}\``, inline: true },
        { name: "Owner", value: `\`${user.id}\`` },
      ],
      timestamp: new Date().toISOString(),
    });
  }

  redirect("/onboarding/complete");
}
