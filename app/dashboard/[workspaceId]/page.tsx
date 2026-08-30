import Image from "next/image";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  Award,
  Bot,
  Check,
  FileCheck2,
  FileClock,
  KeyRound,
  MessageSquareText,
  ScrollText,
  Settings2,
  ShieldAlert,
  Timer,
  UsersRound,
  Workflow,
} from "lucide-react";
import { getWorkspaceControl } from "@/lib/workspace-control";

export const dynamic = "force-dynamic";

export default async function WorkspaceOverview({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params;
  const { state, supabase, user } = await getWorkspaceControl(workspaceId);
  const w = state.workspace;
  const [{ count: apiKeyCount }, { data: recentLogs }, { data: accountLinks }] =
    await Promise.all([
      supabase
        .from("api_keys")
        .select("id", { count: "exact", head: true })
        .eq("workspace_id", w.id)
        .is("revoked_at", null),
      supabase
        .from("workspace_logs")
        .select("id, source, summary, event_type, created_at")
        .eq("workspace_id", w.id)
        .order("created_at", { ascending: false })
        .limit(6),
      supabase
        .from("account_links")
        .select("provider,username,display_name,avatar_url")
        .eq("user_id", user.id),
    ]);
  const profile =
    accountLinks?.find((link) => link.provider === "discord") ||
    accountLinks?.find((link) => link.provider === "roblox");
  const welcomeName =
    profile?.display_name ||
    profile?.username ||
    user.user_metadata?.full_name ||
    user.email?.split("@")[0] ||
    "there";
  const avatarUrl =
    profile?.avatar_url || user.user_metadata?.avatar_url || null;
  const integrations = new Map(
    state.integrations.map((item) => [item.provider, item.status]),
  );
  const checks = [
    { label: "Workspace active", ready: true, icon: Check },
    { label: "API key created", ready: Boolean(apiKeyCount), icon: KeyRound },
    {
      label: "Discord connected",
      ready: integrations.get("discord") === "connected",
      icon: Bot,
    },
    {
      label: "Roblox group selected",
      ready: Boolean(w.roblox_group_id),
      icon: Award,
      optional: true,
    },
  ];
  const readyCount = checks.filter((item) => item.ready).length;
  const nextAction = !apiKeyCount
    ? {
        title: "Create an API key",
        text: "Connect a Roblox game server securely.",
        href: `/dashboard/${w.public_id}/settings`,
        label: "Open settings",
      }
    : integrations.get("discord") !== "connected"
      ? {
          title: "Connect Discord",
          text: "Install Nexora and link your community server.",
          href: `/dashboard/${w.public_id}/connections#discord`,
          label: "Connect server",
        }
      : {
          title: "Build your first workflow",
          text: "Automate a repeatable staff or ranking task.",
          href: `/dashboard/${w.public_id}/automations`,
          label: "Create workflow",
        };

  return (
    <div className="workspace-home">
      <header className="workspace-home-header">
        <div className="workspace-welcome">
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="workspace-welcome-avatar" />
          ) : (
            <span className="workspace-welcome-avatar flex items-center justify-center font-black">
              {welcomeName.slice(0, 2).toUpperCase()}
            </span>
          )}
          <div className="workspace-welcome-copy">
            <p>Welcome</p>
            <h1>{welcomeName}</h1>
            <span className="workspace-group-chip">
              {w.roblox_group_icon_url ? (
                <img src={w.roblox_group_icon_url} alt="" />
              ) : (
                <i>NX</i>
              )}
              <b>{w.roblox_group_name || w.name}</b>
              <i /> {w.role} access
            </span>
          </div>
        </div>
        <nav aria-label="Quick actions">
          <Link href={`/dashboard/${w.public_id}/communications`}>
            <MessageSquareText />
            Send message
          </Link>
          <Link href={`/dashboard/${w.public_id}/members`}>
            <UsersRound />
            Invite member
          </Link>
          <Link href={`/dashboard/${w.public_id}/settings`}>
            <Settings2 />
            Settings
          </Link>
        </nav>
      </header>

      {w.operational_status !== "active" ? (
        <section className="workspace-restriction-notice">
          <ShieldAlert />
          <div>
            <b>Workspace {w.moderation_status}</b>
            <p>{w.moderation_reason || "This workspace is restricted."}</p>
          </div>
        </section>
      ) : null}

      <section className="workspace-home-summary">
        <Link href={nextAction.href} className="workspace-priority">
          <div>
            <small>Up next</small>
            <h2>{nextAction.title}</h2>
            <p>{nextAction.text}</p>
          </div>
          <span>
            {nextAction.label}
            <ArrowRight />
          </span>
        </Link>
        <div className="workspace-setup-status">
          <header>
            <div>
              <small>Setup</small>
              <b>
                {readyCount} of {checks.length} complete
              </b>
            </div>
            <span>{Math.round((readyCount / checks.length) * 100)}%</span>
          </header>
          <div>
            {checks.map(({ label, ready, icon: Icon, optional }) => (
              <span key={label} className={ready ? "ready" : "pending"}>
                <Icon />
                {label}
                {optional && !ready ? <em>Optional</em> : null}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="workspace-home-metrics" aria-label="Workspace totals">
        <Metric
          icon={UsersRound}
          label="Members"
          value={state.counts.members}
        />
        <Metric
          icon={Award}
          label="Rank actions"
          value={state.counts.rank_actions}
        />
        <Metric
          icon={Timer}
          label="Sessions"
          value={state.counts.activity_sessions}
        />
        <Metric
          icon={ScrollText}
          label="Audit events"
          value={state.counts.log_events}
        />
      </section>

      <div className="workspace-home-columns">
        <section className="workspace-home-section workspace-activity-feed">
          <header>
            <div>
              <small>Latest updates</small>
              <h2>Recent activity</h2>
            </div>
            <Link href={`/dashboard/${w.public_id}/logs`}>
              Full audit log
              <ArrowRight />
            </Link>
          </header>
          <div>
            {recentLogs?.length ? (
              recentLogs.map((log) => (
                <article key={log.id}>
                  <span>
                    <LogIcon source={log.source} />
                  </span>
                  <div>
                    <b>{log.summary}</b>
                    <small>
                      {log.event_type.replaceAll("_", " ")} · {log.source}
                    </small>
                  </div>
                  <time>{relativeTime(log.created_at)}</time>
                </article>
              ))
            ) : (
              <div className="workspace-home-empty">
                <FileClock />
                <div>
                  <b>No activity yet</b>
                  <p>Important workspace actions will appear here.</p>
                </div>
              </div>
            )}
          </div>
        </section>

        <aside className="workspace-home-aside">
          <section className="workspace-home-section workspace-platforms">
            <header>
              <div>
                <small>Connected services</small>
                <h2>Platforms</h2>
              </div>
              <Link href={`/dashboard/${w.public_id}/connections`}>Manage</Link>
            </header>
            <Connection
              provider="discord"
              name="Discord"
              detail={w.discord_guild_name || "Not connected"}
              ready={integrations.get("discord") === "connected"}
              href={`/dashboard/${w.public_id}/connections#discord`}
            />
            <Connection
              provider="roblox"
              name="Roblox"
              detail={w.roblox_group_name || "Optional during beta"}
              ready={Boolean(w.roblox_group_id)}
              href={`/dashboard/${w.public_id}/connections#roblox`}
            />
          </section>
          <section className="workspace-home-section workspace-tool-list">
            <header>
              <div>
                <small>Shortcuts</small>
                <h2>Tools</h2>
              </div>
            </header>
            <Tool
              href={`/dashboard/${w.public_id}/ranking`}
              icon={Award}
              title="Ranking"
            />
            <Tool
              href={`/dashboard/${w.public_id}/activity`}
              icon={Activity}
              title="Activity & quotas"
            />
            <Tool
              href={`/dashboard/${w.public_id}/applications`}
              icon={FileCheck2}
              title="Applications"
            />
            <Tool
              href={`/dashboard/${w.public_id}/automations`}
              icon={Workflow}
              title="Automations"
            />
          </section>
        </aside>
      </div>
    </div>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Activity;
  label: string;
  value: number;
}) {
  return (
    <article>
      <span>
        <Icon />
      </span>
      <div>
        <strong>{value.toLocaleString()}</strong>
        <small>{label}</small>
      </div>
    </article>
  );
}
function Connection({
  provider,
  name,
  detail,
  ready,
  href,
}: {
  provider: "discord" | "roblox";
  name: string;
  detail: string;
  ready: boolean;
  href: string;
}) {
  return (
    <Link href={href} className={`workspace-home-connection ${provider}`}>
      <span>
        {provider === "discord" ? (
          <Image src="/discord.svg" alt="" width={21} height={21} />
        ) : (
          <Image src="/roblox.svg" alt="" width={20} height={20} />
        )}
      </span>
      <div>
        <b>{name}</b>
        <small>{detail}</small>
      </div>
      <em className={ready ? "ready" : "pending"}>
        {ready ? "Connected" : provider === "roblox" ? "Optional" : "Setup"}
      </em>
      <ArrowRight />
    </Link>
  );
}
function Tool({
  href,
  icon: Icon,
  title,
}: {
  href: string;
  icon: typeof Award;
  title: string;
}) {
  return (
    <Link href={href}>
      <span>
        <Icon />
      </span>
      <b>{title}</b>
      <ArrowRight />
    </Link>
  );
}
function LogIcon({ source }: { source: string }) {
  if (source === "discord") return <Bot />;
  if (source === "roblox") return <Award />;
  if (source === "game") return <Activity />;
  return <ScrollText />;
}
function relativeTime(value: string) {
  const minutes = Math.max(
    0,
    Math.floor((Date.now() - new Date(value).getTime()) / 60000),
  );
  if (minutes < 1) return "Now";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  return hours < 24 ? `${hours}h` : `${Math.floor(hours / 24)}d`;
}
