"use server";

import { redirect } from "next/navigation";
import { assignDiscordGuildRole, checkDiscordGuildMembership, sendDiscordVerificationReceipt, updateDiscordGuildNickname } from "@/lib/discord-resources";
import { NEXORA_DISCORD_GUILD_ID, NEXORA_VERIFIED_ROLE_ID } from "@/lib/nexora-discord";
import { createClient } from "@/lib/supabase/server";

export async function verifyNexoraMember() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/verify");

  const { data: links } = await supabase.from("account_links").select("provider,provider_user_id,username,display_name,avatar_url,verified_at").eq("user_id", user.id).in("provider", ["discord", "roblox"]).not("verified_at", "is", null);
  const discord = links?.find((link) => link.provider === "discord");
  const roblox = links?.find((link) => link.provider === "roblox");
  if (!discord) redirect("/verify?error=discord_identity_required");
  if (!roblox) redirect("/verify?error=roblox_identity_required");

  const membership = await checkDiscordGuildMembership({ guildId: NEXORA_DISCORD_GUILD_ID, userId: discord.provider_user_id });
  if (!membership.available) redirect("/verify?error=discord_membership_unavailable");
  if (!membership.member) redirect("/verify?error=discord_member_not_found");

  const { data: queued, error: queueError } = await supabase.rpc("request_verified_role");
  if (queueError || !(queued as { ok?: boolean } | null)?.ok) redirect("/verify?error=verification_queue_failed");

  const role = await assignDiscordGuildRole({ guildId: NEXORA_DISCORD_GUILD_ID, userId: discord.provider_user_id, roleId: NEXORA_VERIFIED_ROLE_ID });
  if (!role.ok && role.error !== "bot_not_configured") redirect(`/verify?error=${role.error}`);

  const robloxName = roblox.username || roblox.display_name || "Roblox member";
  await Promise.allSettled([
    updateDiscordGuildNickname({ guildId: NEXORA_DISCORD_GUILD_ID, userId: discord.provider_user_id, nickname: robloxName }),
    sendDiscordVerificationReceipt({ userId: discord.provider_user_id, robloxUsername: robloxName, robloxAvatarUrl: roblox.avatar_url }),
  ]);
  redirect("/verify?verified=1");
}

export const verifyNexoraDiscordMember = verifyNexoraMember;
