import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Activity, ArrowRight, Bot, Check, Copy, Gamepad2, GitBranch, KeyRound, Link2, LogOut, Plus, ShieldCheck, UsersRound, Webhook } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { createWorkspace, signOut } from "./actions";

export const dynamic = "force-dynamic";

const errors: Record<string, string> = {
  invalid_workspace: "Use a 2–64 character name and a lowercase slug such as my-community.",
  slug_taken: "That workspace URL is already taken. Choose another slug.",
  workspace_failed: "The workspace could not be created. Please try again.",
};

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  if (!isSupabaseConfigured()) redirect("/login?error=oauth_not_ready");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/dashboard");

  const [{ data: membership }, params] = await Promise.all([
    supabase.from("workspace_members").select("workspace_id, role").eq("user_id", user.id).limit(1).maybeSingle(),
    searchParams,
  ]);
  const displayName = String(user.user_metadata.global_name || user.user_metadata.full_name || user.user_metadata.name || user.user_metadata.user_name || "Operator");
  const avatarUrl = typeof user.user_metadata.avatar_url === "string" ? user.user_metadata.avatar_url : null;

  if (!membership) return <WorkspaceOnboarding displayName={displayName} error={params.error ? errors[params.error] : undefined} />;

  const [{ data: workspace }, { count: memberCount }, { count: rankCount }, { count: activityCount }, { data: integrations }] = await Promise.all([
    supabase.from("workspaces").select("id, public_id, name, slug, discord_guild_id, roblox_group_id").eq("id", membership.workspace_id).single(),
    supabase.from("workspace_members").select("workspace_id", { count: "exact", head: true }).eq("workspace_id", membership.workspace_id),
    supabase.from("rank_actions").select("id", { count: "exact", head: true }).eq("workspace_id", membership.workspace_id),
    supabase.from("activity_sessions").select("id", { count: "exact", head: true }).eq("workspace_id", membership.workspace_id),
    supabase.from("integrations").select("provider, status").eq("workspace_id", membership.workspace_id),
  ]);
  if (!workspace) redirect("/dashboard?error=workspace_failed");
  const integrationState = new Map((integrations ?? []).map((item) => [item.provider, item.status]));

  return <main className="live-dashboard"><header className="live-topbar"><Link href="/" className="flex items-center gap-2.5"><BrandMark /><span>Nexora Rank</span></Link><div className="flex items-center gap-2"><ThemeToggle /><form action={signOut}><Button type="submit" variant="ghost" className="text-white/45"><LogOut /> Sign out</Button></form>{avatarUrl ? <Image className="size-9 rounded-xl" src={avatarUrl} width={36} height={36} alt="" /> : <span className="user-avatar">{displayName.slice(0,2).toUpperCase()}</span>}</div></header><div className="live-dashboard-frame">
    <section className="live-welcome"><div><span className="live-label"><i /> Authenticated workspace</span><h1>Welcome, {displayName}.</h1><p>{workspace.name} is live. Connect Discord and Roblox, then operations will appear here as they happen.</p></div><div className="live-id"><span>Workspace ID</span><code>{workspace.public_id}</code><Button variant="ghost" size="icon-sm" aria-label="Copy workspace ID"><Copy /></Button></div></section>
    <section className="live-metrics"><LiveMetric icon={UsersRound} label="Workspace members" value={memberCount ?? 0} /><LiveMetric icon={GitBranch} label="Rank operations" value={rankCount ?? 0} /><LiveMetric icon={Activity} label="Activity sessions" value={activityCount ?? 0} /><LiveMetric icon={ShieldCheck} label="Your role" value={membership.role} text /></section>
    <div className="grid gap-5 lg:grid-cols-[1.1fr_.9fr]"><section className="live-panel"><PanelTitle title="Launch connections" description="Nexora requests only the access required for each operation." /><div className="mt-5 space-y-3"><Connection icon={Bot} name="Discord" detail="Identity, server membership, role sync, commands" status={integrationState.get("discord") ?? (workspace.discord_guild_id ? "connected" : "not connected")} href="/login" /><Connection icon={Gamepad2} name="Roblox" detail="Official OAuth identity and Open Cloud group access" status={integrationState.get("roblox") ?? (workspace.roblox_group_id ? "connected" : "not connected")} /><Connection icon={Webhook} name="Developer API" detail="Scoped game-server keys and signed webhooks" status="ready" /></div></section><section className="live-panel"><PanelTitle title="Your next three steps" description="Complete these in order for a reliable launch." /><ol className="launch-checklist"><Step done title="Discord account verified" text="Your session is tied to Discord OAuth." /><Step title="Connect a Discord server" text="Select a server where you can manage integrations." /><Step title="Connect a Roblox group" text="Authorize official identity and minimum Open Cloud access." /></ol></section></div>
    <section className="live-panel"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><PanelTitle title="Developer access" description="Use the stable workspace ID from server scripts; never expose API keys in LocalScripts." /><Button disabled className="border border-white/[.08] bg-white/[.04] text-white/35"><KeyRound /> Create API key</Button></div><div className="mt-5 grid gap-3 sm:grid-cols-3"><DeveloperItem title="API base" value="https://api.nexorarank.tech/v1" /><DeveloperItem title="Workspace" value={workspace.public_id} /><DeveloperItem title="Default scope" value="activity:write" /></div></section>
  </div></main>;
}

function WorkspaceOnboarding({ displayName, error }: { displayName: string; error?: string }) { return <main className="onboarding-page"><div className="onboarding-glow" /><header className="onboarding-nav"><Link href="/" className="flex items-center gap-2.5"><BrandMark /><span>Nexora Rank</span></Link><div className="flex items-center gap-2"><ThemeToggle /><form action={signOut}><Button type="submit" variant="ghost" className="text-white/45"><LogOut /> Sign out</Button></form></div></header><section className="onboarding-card"><span className="live-label"><Check /> Discord identity verified</span><h1>Build your first workspace.</h1><p>Welcome, {displayName}. A workspace keeps one Roblox community, its Discord server, policies, API keys, and audit history together.</p>{error && <div className="onboarding-error" role="alert">{error}</div>}<form action={createWorkspace} className="mt-8 space-y-4"><label><span>Workspace name</span><input name="name" required minLength={2} maxLength={64} placeholder="Nexora Community" /></label><label><span>Workspace URL</span><div className="slug-input"><small>nexorarank.tech/w/</small><input name="slug" required pattern="[a-z0-9][a-z0-9-]{1,46}[a-z0-9]" placeholder="nexora-community" /></div></label><Button type="submit" className="button-glow h-12 w-full rounded-xl">Create secure workspace <ArrowRight /></Button></form><div className="onboarding-trust"><span><ShieldCheck /> Row-level access</span><span><Link2 /> Official OAuth</span><span><Webhook /> Audited actions</span></div></section></main>; }
function LiveMetric({ icon: Icon, label, value, text = false }: { icon: typeof UsersRound; label: string; value: number | string; text?: boolean }) { return <article><span><Icon /></span><div><small>{label}</small><strong className={text ? "capitalize" : ""}>{value}</strong></div></article>; }
function PanelTitle({ title, description }: { title: string; description: string }) { return <div><h2 className="text-sm font-semibold text-white/85">{title}</h2><p className="mt-1 text-[11px] text-white/30">{description}</p></div>; }
function Connection({ icon: Icon, name, detail, status, href }: { icon: typeof Bot; name: string; detail: string; status: string; href?: string }) { const content=<><span className="live-connection-icon"><Icon /></span><div><b>{name}</b><small>{detail}</small></div><span className={`live-state ${status === "connected" || status === "ready" ? "ready" : ""}`}>{status}</span></>; return href ? <Link href={href} className="live-connection">{content}</Link> : <div className="live-connection">{content}</div>; }
function Step({ title, text, done = false }: { title: string; text: string; done?: boolean }) { return <li className={done ? "done" : ""}><span>{done ? <Check /> : <Plus />}</span><div><b>{title}</b><p>{text}</p></div></li>; }
function DeveloperItem({ title, value }: { title: string; value: string }) { return <div className="developer-value"><span>{title}</span><code>{value}</code></div>; }
