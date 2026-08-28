"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type Provider = "discord" | "roblox";

const ID_PATTERN = /^\d{5,22}$/;

async function getManagerContext() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/dashboard/connections");

  const { data: membership } = await supabase
    .from("workspace_members")
    .select("workspace_id, role")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (!membership) redirect("/onboarding");
  if (!["owner", "admin"].includes(membership.role)) {
    redirect("/dashboard/connections?error=manager_required");
  }

  return { supabase, user, membership };
}

export async function saveConnection(formData: FormData) {
  const provider = String(formData.get("provider") ?? "") as Provider;
  const externalId = String(formData.get("external_id") ?? "").trim();

  if (!["discord", "roblox"].includes(provider) || !ID_PATTERN.test(externalId)) {
    redirect("/dashboard/connections?error=invalid_id");
  }

  const { supabase, user, membership } = await getManagerContext();
  const { data: identity } = await supabase
    .from("account_links")
    .select("id")
    .eq("user_id", user.id)
    .eq("provider", provider)
    .maybeSingle();

  if (!identity) redirect("/dashboard/connections?error=identity_required");

  const workspacePatch =
    provider === "discord"
      ? { discord_guild_id: externalId }
      : { roblox_group_id: externalId };
  const { error: workspaceError } = await supabase
    .from("workspaces")
    .update(workspacePatch)
    .eq("id", membership.workspace_id);

  if (workspaceError) {
    redirect(
      `/dashboard/connections?error=${workspaceError.code === "23505" ? "already_claimed" : "save_failed"}`,
    );
  }

  const { error: integrationError } = await supabase.from("integrations").upsert(
    {
      workspace_id: membership.workspace_id,
      provider,
      external_id: externalId,
      status: "pending",
      connected_by: user.id,
      connected_at: null,
      settings: { verification: "required" },
    },
    { onConflict: "workspace_id,provider" },
  );

  if (integrationError) redirect("/dashboard/connections?error=save_failed");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/connections");
  redirect(`/dashboard/connections?saved=${provider}`);
}

export async function disconnectConnection(formData: FormData) {
  const provider = String(formData.get("provider") ?? "") as Provider;
  if (!["discord", "roblox"].includes(provider)) {
    redirect("/dashboard/connections?error=invalid_id");
  }

  const { supabase, membership } = await getManagerContext();
  const workspacePatch =
    provider === "discord"
      ? { discord_guild_id: null }
      : { roblox_group_id: null };

  const [{ error: workspaceError }, { error: integrationError }] = await Promise.all([
    supabase.from("workspaces").update(workspacePatch).eq("id", membership.workspace_id),
    supabase
      .from("integrations")
      .update({ status: "disconnected", external_id: null, connected_at: null })
      .eq("workspace_id", membership.workspace_id)
      .eq("provider", provider),
  ]);

  if (workspaceError || integrationError) {
    redirect("/dashboard/connections?error=save_failed");
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/connections");
  redirect(`/dashboard/connections?removed=${provider}`);
}
