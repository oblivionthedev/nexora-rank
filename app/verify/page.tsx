import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BadgeCheck, Check, ExternalLink, RefreshCw, ShieldCheck } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { checkDiscordGuildMembership } from "@/lib/discord-resources";
import { NEXORA_DISCORD_GUILD_ID } from "@/lib/nexora-discord";
import { createClient } from "@/lib/supabase/server";
import { verifyNexoraMember } from "./actions";

export const metadata: Metadata = { title: "Account Verification", description: "Link Discord and Roblox securely to verify with Nexora Rank." };
export const dynamic = "force-dynamic";
const COMMUNITY_INVITE = "https://discord.gg/YY9nXqqWTk";
const errorMessages: Record<string, string> = {
  discord_identity_required: "Connect your Discord account before continuing.",
  roblox_identity_required: "Connect a Roblox account through official Roblox OAuth before continuing.",
  discord_member_not_found: "Join the Nexora Community & Support server, then try again.",
  discord_membership_unavailable: "Nexora could not confirm your server membership. Please try again shortly.",
  discord_role_permission_missing: "The Nexora bot cannot assign the Verified role right now. Staff have been notified.",
  verification_queue_failed: "The verification request could not be saved. Please try again.",
  discord_unavailable: "Discord did not respond in time. Please try again shortly.",
  roblox_authorization_declined: "Roblox authorization was cancelled. Nothing was connected.",
  roblox_oauth_failed: "Roblox could not complete the secure connection. Please try again.",
  roblox_permissions_required: "Approve the requested Roblox identity permissions to verify.",
  roblox_not_ready: "Roblox verification is temporarily unavailable. Please try again shortly.",
};

export default async function VerifyPage({ searchParams }: { searchParams: Promise<{ verified?: string; error?: string }> }) {
  const query = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: links = [] } = user
    ? await supabase.from("account_links").select("provider,provider_user_id,username,display_name,avatar_url,verified_at").eq("user_id", user.id).in("provider", ["discord", "roblox"]).not("verified_at", "is", null)
    : { data: [] };
  const discord = links?.find((link) => link.provider === "discord") ?? null;
  const roblox = links?.find((link) => link.provider === "roblox") ?? null;
  const membership = discord
    ? await checkDiscordGuildMembership({ guildId: NEXORA_DISCORD_GUILD_ID, userId: discord.provider_user_id })
    : { member: false, available: true };
  const ready = Boolean(discord && roblox && membership.member);
  const completed = query.verified === "1";
  const errorMessage = query.error ? errorMessages[query.error] ?? "Verification could not finish. Review the steps below and try again." : null;

  return <main className="verify-page">
    <nav><Link href="/" className="home-brand"><BrandMark /><span>Nexora Rank</span></Link><Link href={COMMUNITY_INVITE} target="_blank">Community server <ExternalLink /></Link></nav>
    <section className="verify-shell">
      <header className="verify-hero">
        <div className="verify-brand-pair" aria-hidden="true"><span className="discord"><Image src="/discord.svg" width={28} height={28} alt="" /></span><i /><span className="roblox"><Image src="/roblox.svg" width={28} height={28} alt="" /></span></div>
        <p>Official Nexora verification</p><h1>One account.<br /><span>Two trusted identities.</span></h1>
        <p className="verify-copy">Connect Discord and Roblox, confirm you are in the Nexora server, and receive access automatically. Nexora uses official OAuth only—never your password or Roblox cookie.</p>
      </header>
      {completed ? <div className="verify-result success"><BadgeCheck /><div><b>You&apos;re verified with Nexora</b><span>Your Verified role is active. Your server nickname and private receipt are updated when Discord permissions allow it.</span></div></div> : null}
      {errorMessage ? <div className="verify-result error"><ShieldCheck /><div><b>Verification could not finish</b><span>{errorMessage}</span></div></div> : null}
      <div className="verify-progress" aria-label="Verification progress"><span className={discord ? "complete" : "active"}>1</span><i className={discord ? "complete" : ""} /><span className={membership.member ? "complete" : discord ? "active" : ""}>2</span><i className={membership.member ? "complete" : ""} /><span className={roblox ? "complete" : membership.member ? "active" : ""}>3</span><i className={ready ? "complete" : ""} /><span className={completed ? "complete" : ready ? "active" : ""}>4</span></div>
      <div className="verify-steps">
        <article className={discord ? "complete" : "current"}>
          <StepHeading number="1" complete={Boolean(discord)} label="Discord identity" title={discord ? "Account connected" : "Connect your Discord"} />
          {discord ? <IdentityCard label="Discord" accent="discord" account={discord} /> : <Link href="/login?next=/verify" className="verify-button discord">Continue with Discord <ArrowRight /></Link>}
        </article>
        <article className={membership.member ? "complete" : discord ? "current" : "locked"}>
          <StepHeading number="2" complete={membership.member} label="Community check" title={membership.member ? "Server membership confirmed" : "Join the Nexora server"} />
          {discord && !membership.member ? <div className="verify-actions"><Link href={COMMUNITY_INVITE} target="_blank" className="verify-button discord">Join community server <ExternalLink /></Link><Link href="/verify" className="verify-secondary"><RefreshCw /> Check again</Link></div> : <p className="verify-step-note">The bot checks that your connected Discord account is in the official server.</p>}
          {discord && !membership.available ? <p className="verify-inline-warning">The Discord membership check is temporarily unavailable.</p> : null}
        </article>
        <article className={roblox ? "complete" : membership.member ? "current" : "locked"}>
          <StepHeading number="3" complete={Boolean(roblox)} label="Roblox identity" title={roblox ? "Account connected" : "Connect your Roblox"} />
          {roblox ? <><IdentityCard label="Roblox" accent="roblox" account={roblox} /><Link href="/auth/roblox/start?next=/verify" className="verify-switch">Switch Roblox account</Link></> : membership.member ? <Link href="/auth/roblox/start?next=/verify" className="verify-button roblox">Continue with Roblox <ArrowRight /></Link> : <p className="verify-step-note">Complete the Discord steps first. Roblox opens in its official authorization page.</p>}
        </article>
        <article className={completed ? "complete" : ready ? "current" : "locked"}>
          <StepHeading number="4" complete={completed} label="Finish" title={completed ? "Verification complete" : "Activate your access"} />
          {completed ? <Link href={COMMUNITY_INVITE} target="_blank" className="verify-button complete">Return to Discord <ArrowRight /></Link> : ready ? <form action={verifyNexoraMember}><button>Finish verification <BadgeCheck /></button></form> : <p className="verify-step-note">Once both accounts and server membership are confirmed, this final step unlocks automatically.</p>}
        </article>
      </div>
      <footer className="verify-privacy"><ShieldCheck /><span><b>Official connections only.</b> Nexora stores the minimum identity details needed to keep your account and server access synchronized.</span></footer>
    </section>
  </main>;
}
function StepHeading({ number, complete, label, title }: { number: string; complete: boolean; label: string; title: string }) {
  return <div className="verify-step-heading"><span>{complete ? <Check /> : number}</span><div><small>{label}</small><b>{title}</b></div></div>;
}

function IdentityCard({ label, accent, account }: { label: string; accent: "discord" | "roblox"; account: { username: string | null; display_name: string | null; avatar_url: string | null } }) {
  return <div className={`verify-account ${accent}`}>
    {account.avatar_url ? <Image src={account.avatar_url} width={48} height={48} unoptimized alt="" /> : <span>{label.slice(0, 2).toUpperCase()}</span>}
    <div><small>Connected {label} account</small><b>{account.display_name || account.username || `${label} user`}</b>{account.username && account.display_name !== account.username ? <em>@{account.username}</em> : null}</div><BadgeCheck />
  </div>;
}
