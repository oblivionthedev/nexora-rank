"use server";

import { createClient } from "@/lib/supabase/server";
import { sendDiscordChannelMessage } from "@/lib/discord-messages";
import { NEXORA_LOG_CHANNELS, nexoraLogBrand } from "@/lib/operational-logs";

const BETA_CHANNEL_ID = NEXORA_LOG_CHANNELS.betaSubmissions;

export type BetaApplyState = {
  success?: boolean;
  code?: string;
  error?: string;
};
export type BetaStatusState = {
  found?: boolean;
  status?: string;
  name?: string;
  submittedAt?: string;
  error?: string;
};

function field(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function submitBetaApplication(
  _state: BetaApplyState,
  formData: FormData,
): Promise<BetaApplyState> {
  const name = field(formData, "name");
  const email = field(formData, "email").toLowerCase();
  const age = Number(field(formData, "age"));
  const acceptedPrivacy = formData.get("accept_beta_privacy") === "on";
  const acceptedPolicy = formData.get("accept_beta_policy") === "on";
  if (field(formData, "company"))
    return { error: "The application could not be submitted." };
  if (name.length < 2 || name.length > 80)
    return { error: "Enter your full name." };
  if (!email.includes("@") || email.length > 254)
    return { error: "Enter a valid email address." };
  if (!Number.isInteger(age) || age < 13 || age > 100)
    return { error: "Applicants must be at least 13 years old." };
  if (!acceptedPrivacy || !acceptedPolicy)
    return {
      error:
        "Accept the Beta Privacy Notice and Participation Policy to apply.",
    };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("submit_beta_application", {
    applicant_name: name,
    applicant_email: email,
    applicant_age: age,
  });
  if (error || !data || typeof data !== "object" || Array.isArray(data))
    return {
      error: "Applications are temporarily unavailable. Please try again.",
    };
  const result = data as {
    ok?: boolean;
    error?: string;
    retry_at?: string;
    application_id?: string;
    lookup_code?: string;
  };
  if (!result.ok)
    return {
      error:
        result.error === "beta_closed"
          ? "Beta applications are currently closed. You can still check an existing application below."
          : result.error === "already_registered"
            ? "That email already has a Beta application. Use your saved code to check it below."
            : result.error === "reapply_wait"
              ? `You can reapply 24 hours after your previous decision${result.retry_at ? ` — after ${new Date(result.retry_at).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" })} UTC` : ""}.`
              : result.error === "discord_required"
                ? "Sign in with Discord before submitting a Beta application."
                : "Check your information and try again.",
    };
  if (!result.application_id || !result.lookup_code)
    return {
      error:
        "The application was saved, but its confirmation code could not be created.",
    };

  const token = process.env.DISCORD_BOT_TOKEN || "";
  const notification = await sendDiscordChannelMessage({
    token,
    channelId: BETA_CHANNEL_ID,
    content: "",
    embed: {
      title: "New Nexora Beta application",
      description: `**Name**\n${name}\n\n**Email address**\n${email}\n\n**Age**\n${age}\n\n**Discord**\nVerified with Nexora`,
      color: 0x000000,
      author: nexoraLogBrand("Nexora Beta"),
      footer: {
        text: `Application ${result.application_id.slice(0, 8)} · Review in Nexora Staff`,
      },
      timestamp: new Date().toISOString(),
    },
  });
  await supabase.rpc("record_beta_notification", {
    application_id: result.application_id,
    lookup_code: result.lookup_code,
    delivered: notification.ok,
    message_id: notification.ok
      ? notification.messageId || undefined
      : undefined,
  });
  return { success: true, code: result.lookup_code };
}

export async function checkBetaStatus(
  _state: BetaStatusState,
  formData: FormData,
): Promise<BetaStatusState> {
  const email = field(formData, "status_email").toLowerCase();
  const code = field(formData, "lookup_code").toUpperCase();
  if (!email || !code)
    return { error: "Enter your application email and confirmation code." };
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("check_beta_application", {
    applicant_email: email,
    lookup_code: code,
  });
  if (error || !data || typeof data !== "object" || Array.isArray(data))
    return { error: "Status checking is temporarily unavailable." };
  const result = data as {
    ok?: boolean;
    name?: string;
    status?: string;
    created_at?: string;
  };
  if (!result.ok)
    return {
      error: "No application matched that email and confirmation code.",
    };
  return {
    found: true,
    name: result.name,
    status: result.status,
    submittedAt: result.created_at,
  };
}
