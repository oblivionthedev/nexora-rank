"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { assignDiscordGuildRole } from "@/lib/discord-resources";
import {
  NEXORA_DISCORD_GUILD_ID,
  NEXORA_VERIFIED_ROLE_ID,
} from "@/lib/nexora-discord";

export async function verifyNexoraDiscordMember() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/verify");
  const { data: discord } = await supabase
    .from("account_links")
    .select("provider_user_id")
    .eq("user_id", user.id)
    .eq("provider", "discord")
    .maybeSingle();
  if (!discord) redirect("/login?next=/verify");
  const { data: queued, error: queueError } = await supabase.rpc(
    "request_verified_role",
  );
  if (queueError || !(queued as { ok?: boolean } | null)?.ok)
    redirect("/verify?error=verification_queue_failed");
  const result = await assignDiscordGuildRole({
    guildId: NEXORA_DISCORD_GUILD_ID,
    userId: discord.provider_user_id,
    roleId: NEXORA_VERIFIED_ROLE_ID,
  });
  // A configured web token makes delivery immediate. Otherwise the Nexora
  // bot consumes the durable queue and retries until Discord accepts it.
  redirect(
    result.ok || result.error === "bot_not_configured"
      ? "/verify?verified=1"
      : `/verify?error=${result.error}`,
  );
}
