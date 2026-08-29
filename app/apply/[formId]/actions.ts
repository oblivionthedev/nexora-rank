"use server";

import { redirect } from "next/navigation";
import { sendDiscordChannelMessage } from "@/lib/discord-messages";
import { createClient } from "@/lib/supabase/server";

type ApplicationField = {
  id: string;
  label: string;
  type: "short_text" | "long_text" | "select";
  required: boolean;
  options?: string[];
};

export async function submitPublicApplication(formData: FormData) {
  const formId = String(formData.get("form_id") || "");
  if (!/^[0-9a-f-]{36}$/i.test(formId)) redirect("/apply/invalid");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/apply/${formId}?error=signin_required`);

  const { data: form } = await supabase
    .from("application_forms")
    .select("id,workspace_id,name,target_role_name,fields,status,opens_at,closes_at,submissions_channel_id")
    .eq("id", formId)
    .maybeSingle();
  if (!form || form.status !== "open") redirect(`/apply/${formId}?error=not_open`);
  const now = Date.now();
  if ((form.opens_at && new Date(form.opens_at).getTime() > now) || (form.closes_at && new Date(form.closes_at).getTime() <= now))
    redirect(`/apply/${formId}?error=not_open`);

  const fields = normalizeFields(form.fields);
  if (!fields.length) redirect(`/apply/${formId}?error=form_invalid`);
  const responses: Record<string, string> = {};
  for (const field of fields) {
    const answer = String(formData.get(`response_${field.id}`) || "").trim().slice(0, 4000);
    if (field.required && !answer) redirect(`/apply/${formId}?error=required_answers`);
    if (field.type === "select" && answer && !field.options?.includes(answer)) redirect(`/apply/${formId}?error=invalid_answer`);
    responses[field.label] = answer;
  }

  const [{ data: discord }, { data: roblox }] = await Promise.all([
    supabase.from("account_links").select("provider_user_id,username,display_name,avatar_url").eq("user_id", user.id).eq("provider", "discord").maybeSingle(),
    supabase.from("account_links").select("provider_user_id").eq("user_id", user.id).eq("provider", "roblox").maybeSingle(),
  ]);
  if (!discord) redirect(`/apply/${formId}?error=discord_required`);

  const { data: submission, error } = await supabase
    .from("application_submissions")
    .insert({
      form_id: form.id,
      workspace_id: form.workspace_id,
      applicant_id: user.id,
      applicant_roblox_user_id: roblox?.provider_user_id || null,
      applicant_discord_user_id: discord.provider_user_id,
      applicant_discord_name: discord.display_name || discord.username,
      applicant_discord_avatar_url: discord.avatar_url,
      responses,
      status: "submitted",
    })
    .select("id")
    .single();
  if (error) redirect(`/apply/${formId}?error=${error.code === "23505" ? "already_submitted" : "submit_failed"}`);

  if (form.submissions_channel_id) {
    await sendDiscordChannelMessage({
      token: process.env.DISCORD_BOT_TOKEN?.trim() || "",
      channelId: form.submissions_channel_id,
      content: "",
      embed: {
        title: `New application · ${form.name}`,
        description: `**Applicant:** ${discord.display_name || discord.username}\n**Position:** ${form.target_role_name || "Community team"}\n**Submission ID:** \`${submission.id}\`\n\nReview it in the Nexora workspace dashboard.`,
        color: 0x111111,
        author: { name: discord.display_name || discord.username, icon_url: discord.avatar_url || undefined },
        footer: { text: "Nexora Rank applications" },
        timestamp: new Date().toISOString(),
      },
    }).catch(() => undefined);
  }

  redirect(`/apply/${formId}?submitted=1`);
}

function normalizeFields(value: unknown): ApplicationField[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((field) => {
      const candidate = field as ApplicationField;
      return candidate.type === ("text" as ApplicationField["type"])
        ? { ...candidate, type: "long_text" as const }
        : candidate;
    })
    .filter((field) => field.id && field.label && ["short_text", "long_text", "select"].includes(field.type));
}
