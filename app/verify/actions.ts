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
  const result = await assignDiscordGuildRole({
    guildId: NEXORA_DISCORD_GUILD_ID,
    userId: discord.provider_user_id,
    roleId: NEXORA_VERIFIED_ROLE_ID,
  });
  redirect(result.ok ? "/verify?verified=1" : `/verify?error=${result.error}`);
}
