import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Activity, Blocks, Bot, Check, Copy, FileCheck2, Fingerprint,
  Gamepad2, Gauge, GitBranch, KeyRound, Link2, ListChecks, LogOut, Plus,
  ShieldCheck, UsersRound, Webhook,
} from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { Button } from "@/components/ui/button";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { signOut } from "./actions";

export const dynamic = "force-dynamic";

/**
 * Workspace navigation, grouped by what the member is trying to do rather than
 * as one long undifferentiated list. Sections that are not built yet are shown
 * with a "Soon" marker and are not focusable, so the shape of the product is
 * legible without offering dead links.
 */
type RailItem = { icon: typeof Gauge; label: string; active?: boolean; soon?: boolean };

const railGroups: { label: string; items: RailItem[] }[] = [
  {
    label: "Workspace",
    items: [
      { icon: Gauge, label: "Overview", active: true },
      { icon: Activity, label: "Activity", soon: true },
      { icon: UsersRound, label: "Members", soon: true },
    ],
  },
  {
    label: "Operations",
    items: [
      { icon: GitBranch, label: "Ranking", soon: true },
      { icon: FileCheck2, label: "Applications", soon: true },
      { icon: Blocks, label: "Automations", soon: true },
      { icon: ListChecks, label: "Quotas", soon: true },
    ],
  },
  {
    label: "Identity",
    items: [
      { icon: Link2, label: "Connections" },
      { icon: Fingerprint, label: "Audit trail", soon: true },
    ],
  },
];

export default async function DashboardPage() {
  if (!isSupabaseConfigured()) redirect("/login?error=oauth_not_ready");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/dashboard");

  const { data: membership } = await supabase
    .from("workspace_members")
    .select("workspace_id, role")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();
  const displayName = String(user.user_metadata.global_name || user.user_metadata.full_name || user.user_metadata.name || user.user_metadata.user_name || "Operator");
  const avatarUrl = typeof user.user_metadata.avatar_url === "string" ? user.user_metadata.avatar_url : null;

  if (!membership) redirect("/onboarding");

  const [{ data: workspace }, { count: memberCount }, { count: rankCount }, { count: activityCount }, { data: integrations }] = await Promise.all([
    supabase.from("workspaces").select("id, public_id, name, slug, discord_guild_id, roblox_group_id").eq("id", membership.workspace_id).single(),
    supabase.from("workspace_members").select("workspace_id", { count: "exact", head: true }).eq("workspace_id", membership.workspace_id),
    supabase.from("rank_actions").select("id", { count: "exact", head: true }).eq("workspace_id", membership.workspace_id),
    supabase.from("activity_sessions").select("id", { count: "exact", head: true }).eq("workspace_id", membership.workspace_id),
    supabase.from("integrations").select("provider, status").eq("workspace_id", membership.workspace_id),
  ]);
  if (!workspace) redirect("/dashboard?error=workspace_failed");
  const integrationState = new Map((integrations ?? []).map((item) => [item.provider, item.status]));

  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <div className="app-shell">
      {/* Grouped rail. Hidden on phones, where the bottom island carries nav. */}
      <aside className="app-rail">
        <Link href="/" className="app-rail-brand" aria-label="Nexora Rank home">
          <BrandMark compact />
          <span>Nexora Rank</span>
        </Link>

        <div className="app-workspace glass-faint">
          <span className="app-workspace-avatar">{workspace.name.slice(0, 2).toUpperCase()}</span>
          <div className="min-w-0">
            <p className="microlabel">Workspace</p>
            <p className="truncate text-[13px] font-semibold text-white">{workspace.name}</p>
          </div>
        </div>

        <nav className="rail" aria-label="Workspace sections">
          {railGroups.map((group) => (
            <div key={group.label} className="rail-group">
              <p className="microlabel">{group.label}</p>
              {group.items.map((item) => (
                <span
                  key={item.label}
                  className="rail-item"
                  data-active={item.active ? "true" : undefined}
                  data-disabled={item.soon ? "true" : undefined}
                  aria-disabled={item.soon ? "true" : undefined}
                >
                  <item.icon className="size-4" aria-hidden="true" />
                  {item.label}
                  {item.soon && <span className="rail-soon">Soon</span>}
                </span>
              ))}
            </div>
          ))}
        </nav>
      </aside>

      <div className="app-main island-clearance">
        {/* Floating glass topbar island. */}
        <header className="app-topbar">
          <div className="app-topbar-island glass-strong">
            <Link href="/" className="app-topbar-brand lg:hidden" aria-label="Nexora Rank home">
              <BrandMark compact />
            </Link>
            <span className="microlabel hidden lg:block">Workspace</span>
            <span className="hidden truncate text-[13px] font-semibold text-white lg:block">{workspace.name}</span>
            <div className="ml-auto flex items-center gap-2">
              <form action={signOut}>
                <button type="submit" className="pill pill-ghost">
                  <LogOut className="size-3.5" aria-hidden="true" />
                  <span className="hidden sm:inline">Sign out</span>
                </button>
              </form>
              {avatarUrl ? (
                <Image className="size-9 flex-none rounded-full ring-1 ring-white/12" src={avatarUrl} width={36} height={36} alt="" />
              ) : (
                <span className="app-avatar">{initials}</span>
              )}
            </div>
          </div>
        </header>

        <div className="app-content">
          <section className="stage app-hero">
            <div className="stage-field" aria-hidden="true" />
            <div className="stage-inner glass-strong flex flex-col gap-6 p-6 sm:p-8 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <span className="chip" data-tone="live">
                  <span className="chip-dot" />
                  Authenticated workspace
                </span>
                <h1 className="mt-4 font-display text-3xl font-extrabold tracking-[-0.028em] text-white sm:text-4xl">
                  Welcome, {displayName}.
                </h1>
                <p className="mt-3 max-w-xl text-sm leading-7 text-white/58">
                  {workspace.name} is live. Connect Discord and Roblox, then operations will appear
                  here as they happen.
                </p>
              </div>
              <div className="glass-faint flex items-center gap-3 px-4 py-3">
                <div>
                  <p className="microlabel">Workspace ID</p>
                  <code className="mt-1 block font-mono text-[13px] text-[#e8c489]">{workspace.public_id}</code>
                </div>
                <Button variant="ghost" size="icon-sm" aria-label="Copy workspace ID" className="rounded-full">
                  <Copy />
                </Button>
              </div>
            </div>
          </section>

          <section className="mt-4 grid gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
            <Metric icon={UsersRound} label="Workspace members" value={memberCount ?? 0} />
            <Metric icon={GitBranch} label="Rank operations" value={rankCount ?? 0} />
            <Metric icon={Activity} label="Activity sessions" value={activityCount ?? 0} />
            <Metric icon={ShieldCheck} label="Your role" value={membership.role} capitalize />
          </section>

          <div className="mt-3.5 grid gap-3.5 lg:grid-cols-[1.1fr_.9fr]">
            <section className="glass p-6 sm:p-7">
              <PanelTitle title="Launch connections" description="Nexora requests only the access required for each operation." />
              <div className="mt-5 space-y-2.5">
                <Connection icon={Bot} name="Discord" detail="Identity, server membership, role sync, commands" status={integrationState.get("discord") ?? (workspace.discord_guild_id ? "connected" : "not connected")} href="/onboarding?manage=identities" />
                <Connection icon={Gamepad2} name="Roblox" detail="Official OAuth identity and Open Cloud group access" status={integrationState.get("roblox") ?? (workspace.roblox_group_id ? "connected" : "not connected")} href="/onboarding?manage=identities" />
                <Connection icon={Webhook} name="Developer API" detail="Scoped game-server keys and signed webhooks" status="ready" />
              </div>
            </section>

            <section className="glass p-6 sm:p-7">
              <PanelTitle title="Your next three steps" description="Complete these in order for a reliable launch." />
              <ol className="mt-5 space-y-2.5">
                <Step done title="Discord account verified" text="Your session is tied to Discord OAuth." />
                <Step title="Connect a Discord server" text="Select a server where you can manage integrations." />
                <Step title="Connect a Roblox group" text="Authorize official identity and minimum Open Cloud access." />
              </ol>
            </section>
          </div>

          <section className="glass mt-3.5 p-6 sm:p-7">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <PanelTitle title="Developer access" description="Use the stable workspace ID from server scripts; never expose API keys in LocalScripts." />
              <button disabled className="pill pill-ghost shrink-0 opacity-50">
                <KeyRound className="size-3.5" aria-hidden="true" /> Create API key
              </button>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <DeveloperItem title="API base" value="https://api.nexorarank.tech/v1" />
              <DeveloperItem title="Workspace" value={workspace.public_id} />
              <DeveloperItem title="Default scope" value="activity:write" />
            </div>
          </section>
        </div>

        {/* Phone navigation island. */}
        <div className="island-bottom">
          <span className="pill pill-ghost flex-1">
            <Gauge className="size-4" aria-hidden="true" /> Overview
          </span>
          <Link href="/" className="pill pill-solid">
            Site
          </Link>
        </div>
      </div>
    </div>
  );
}

function Metric({ icon: Icon, label, value, capitalize = false }: { icon: typeof UsersRound; label: string; value: number | string; capitalize?: boolean }) {
  return (
    <article className="stat glass">
      <div className="stat-head">
        <p className="microlabel">{label}</p>
        <span className="stat-icon"><Icon className="size-3.5" aria-hidden="true" /></span>
      </div>
      <p className={`numeral stat-value ${capitalize ? "capitalize" : ""}`}>{value}</p>
    </article>
  );
}

function PanelTitle({ title, description }: { title: string; description: string }) {
  return (
    <div>
      <h2 className="font-display text-base font-extrabold tracking-[-0.015em] text-white">{title}</h2>
      <p className="mt-1.5 max-w-md text-xs leading-6 text-white/48">{description}</p>
    </div>
  );
}

function Connection({ icon: Icon, name, detail, status, href }: { icon: typeof Bot; name: string; detail: string; status: string; href?: string }) {
  const ready = status.includes("connected") || status === "ready";
  const content = (
    <>
      <span className="stat-icon"><Icon className="size-4" aria-hidden="true" /></span>
      <div className="min-w-0 flex-1">
        <b className="block text-[13px] font-semibold text-white">{name}</b>
        <small className="block text-[11px] leading-5 text-white/48">{detail}</small>
      </div>
      <span className="chip" data-tone={ready ? "live" : undefined}>
        {ready && <span className="chip-dot" />}
        {status}
      </span>
    </>
  );
  const className = "glass-faint flex items-center gap-3 px-4 py-3.5 no-underline";
  return href ? <Link href={href} className={className}>{content}</Link> : <div className={className}>{content}</div>;
}

function Step({ title, text, done = false }: { title: string; text: string; done?: boolean }) {
  return (
    <li className="glass-faint flex items-start gap-3 px-4 py-3.5">
      <span className={`stat-icon ${done ? "!text-emerald-300" : ""}`}>
        {done ? <Check className="size-3.5" aria-hidden="true" /> : <Plus className="size-3.5" aria-hidden="true" />}
      </span>
      <div>
        <b className="block text-[13px] font-semibold text-white">{title}</b>
        <p className="mt-0.5 text-[11px] leading-5 text-white/48">{text}</p>
      </div>
    </li>
  );
}

function DeveloperItem({ title, value }: { title: string; value: string }) {
  return (
    <div className="glass-faint px-4 py-3.5">
      <p className="microlabel">{title}</p>
      <code className="mt-1.5 block truncate font-mono text-[12px] text-[#e8c489]">{value}</code>
    </div>
  );
}
