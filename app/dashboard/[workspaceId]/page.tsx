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
  PlugZap,
  ScrollText,
  Settings2,
  ShieldAlert,
  Sparkles,
  Timer,
  UsersRound,
  Workflow,
} from "lucide-react";
import { PageHeading } from "@/components/workspace-shell";
import { getWorkspaceControl } from "@/lib/workspace-control";

export const dynamic = "force-dynamic";

export default async function WorkspaceOverview({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params;
  const { state, supabase } = await getWorkspaceControl(workspaceId);
  const w = state.workspace;
  const [{ count: apiKeyCount }, { data: recentLogs }] = await Promise.all([
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
      .limit(5),
  ]);
  const integrations = new Map(
    state.integrations.map((item) => [item.provider, item.status]),
  );
  const checks = [
    {
      label: "Permanent workspace ID",
      detail: "Workspace ID is active",
      ready: true,
      icon: KeyRound,
    },
    {
      label: "Private API key",
      detail: "Connect Roblox game servers",
      ready: Boolean(apiKeyCount),
      icon: KeyRound,
    },
    {
      label: "Discord bot linked",
      detail: "Commands and messaging",
      ready: integrations.get("discord") === "connected",
      icon: Bot,
    },
    {
      label: "Roblox group selected",
      detail: "Optional during beta",
      ready: Boolean(w.roblox_group_id),
      icon: Award,
    },
  ];
  const readyCount = checks.filter((item) => item.ready).length;
  const readiness = Math.round((readyCount / checks.length) * 100);
  const nextAction = !checks[1].ready
    ? {
        title: "Create your API key",
        text: "Prepare secure game-server requests from Settings & API.",
        href: `/dashboard/${w.public_id}/settings`,
        label: "Open settings",
      }
    : !checks[2].ready
      ? {
          title: "Connect your Discord server",
          text: "Install the bot and link it with a private one-time code.",
          href: `/dashboard/${w.public_id}/connections#discord`,
          label: "Connect Discord",
        }
      : {
          title: "Configure your first workflow",
          text: "Add a rank policy, quota, form, or automation for your team.",
          href: `/dashboard/${w.public_id}/automations`,
          label: "Create workflow",
        };

  return (
    <>
      <PageHeading
        eyebrow="Command center"
        title={`Welcome to ${w.name}`}
        description="Monitor readiness, jump into daily operations, and see the latest workspace activity from one clear overview."
        action={
          <div className="workspace-overview-badges">
            <span>{w.role}</span>
            <code>{w.public_id}</code>
          </div>
        }
      />

      {w.operational_status !== "active" ? (
        <section className="mt-7 rounded-3xl border border-red-300/20 bg-red-300/8 p-6">
          <div className="flex gap-4">
            <ShieldAlert className="size-6 text-red-200" />
            <div>
              <h2 className="text-lg font-bold">
                Workspace {w.moderation_status}
              </h2>
              <p className="mt-2 text-sm leading-7 text-white/60">
                {w.moderation_reason}.{" "}
                {w.moderation_expires_at
                  ? `Scheduled to end ${formatDate(w.moderation_expires_at)}.`
                  : "No automatic end date."}{" "}
                {w.appeal_allowed
                  ? "You may appeal through the Nexora Discord server."
                  : "This action is not eligible for appeal."}
              </p>
            </div>
          </div>
        </section>
      ) : null}

      <nav className="workspace-quickbar" aria-label="Workspace quick actions">
        <Link href={`/dashboard/${w.public_id}/connections`}>
          <PlugZap />
          Connections
        </Link>
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

      <section className="workspace-overview-metrics">
        <Metric
          icon={UsersRound}
          label="Workspace members"
          value={state.counts.members}
          note="People with workspace access"
        />
        <Metric
          icon={Award}
          label="Rank actions"
          value={state.counts.rank_actions}
          note="Requested and recorded"
        />
        <Metric
          icon={Timer}
          label="Activity sessions"
          value={state.counts.activity_sessions}
          note="Game and manual sessions"
        />
        <Metric
          icon={ScrollText}
          label="Recorded events"
          value={state.counts.log_events}
          note="Protected audit history"
        />
      </section>

      <section className="workspace-overview-grid">
        <article className="workspace-readiness-card workspace-panel">
          <div className="workspace-card-heading">
            <div>
              <p>Workspace health</p>
              <h2>Setup readiness</h2>
            </div>
            <span className="workspace-health-pill">
              <i /> Operational
            </span>
          </div>
          <div className="workspace-readiness-summary">
            <div
              className="workspace-readiness-ring"
              style={
                {
                  "--readiness": `${readiness * 3.6}deg`,
                } as React.CSSProperties
              }
            >
              <strong>{readiness}%</strong>
              <span>ready</span>
            </div>
            <div>
              <h3>
                {readyCount === checks.length
                  ? "All essentials configured"
                  : `${readyCount} of ${checks.length} essentials ready`}
              </h3>
              <p>
                Roblox remains optional during beta, so it does not block your
                Discord and workspace tools.
              </p>
            </div>
          </div>
          <div className="workspace-check-list">
            {checks.map(({ label, detail, ready, icon: Icon }) => (
              <div key={label}>
                <span className={ready ? "ready" : "pending"}>
                  {ready ? <Check /> : <Icon />}
                </span>
                <div>
                  <b>{label}</b>
                  <small>{detail}</small>
                </div>
                <em>{ready ? "Ready" : "Action needed"}</em>
              </div>
            ))}
          </div>
        </article>

        <article className="workspace-next-card workspace-panel">
          <span className="workspace-panel-icon">
            <Sparkles />
          </span>
          <p className="workspace-card-eyebrow">Recommended next step</p>
          <h2>{nextAction.title}</h2>
          <p>{nextAction.text}</p>
          <Link href={nextAction.href}>
            {nextAction.label}
            <ArrowRight />
          </Link>
          <div className="workspace-next-decoration" aria-hidden="true">
            <Workflow />
            <i />
            <i />
            <i />
          </div>
        </article>
      </section>

      <section className="workspace-overview-lower">
        <article className="workspace-recent-card workspace-panel">
          <div className="workspace-card-heading">
            <div>
              <p>Audit trail</p>
              <h2>Recent activity</h2>
            </div>
            <Link href={`/dashboard/${w.public_id}/logs`}>
              View all <ArrowRight />
            </Link>
          </div>
          <div className="workspace-recent-list">
            {recentLogs?.length ? (
              recentLogs.map((log) => (
                <div key={log.id}>
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
                </div>
              ))
            ) : (
              <div className="workspace-empty-activity">
                <FileClock />
                <p>
                  <b>No activity yet</b>
                  <small>
                    Important workspace operations will appear here.
                  </small>
                </p>
              </div>
            )}
          </div>
        </article>

        <article className="workspace-connections-card workspace-panel">
          <div className="workspace-card-heading">
            <div>
              <p>Platforms</p>
              <h2>Connections</h2>
            </div>
            <Link href={`/dashboard/${w.public_id}/connections`}>
              Manage <ArrowRight />
            </Link>
          </div>
          <Connection
            provider="discord"
            name="Discord server"
            detail={
              w.discord_guild_name || "Install the bot and link your server"
            }
            ready={integrations.get("discord") === "connected"}
            href={`/dashboard/${w.public_id}/connections#discord`}
          />
          <Connection
            provider="roblox"
            name="Roblox group"
            detail={w.roblox_group_name || "Optional until OAuth is approved"}
            ready={Boolean(w.roblox_group_id)}
            href={`/dashboard/${w.public_id}/connections#roblox`}
          />
        </article>
      </section>

      <section className="workspace-tools-heading">
        <div>
          <p>Workspace tools</p>
          <h2>Keep your operation moving</h2>
        </div>
        <span>Everything stays scoped to {w.name}</span>
      </section>
      <section className="workspace-tool-grid">
        <Tool
          href={`/dashboard/${w.public_id}/ranking`}
          icon={Award}
          title="Ranking"
          text="Policies and rank requests"
        />
        <Tool
          href={`/dashboard/${w.public_id}/activity`}
          icon={Activity}
          title="Activity"
          text="Sessions and quotas"
        />
        <Tool
          href={`/dashboard/${w.public_id}/applications`}
          icon={FileCheck2}
          title="Applications"
          text="Forms and review queue"
        />
        <Tool
          href={`/dashboard/${w.public_id}/automations`}
          icon={Workflow}
          title="Automations"
          text="Rules and run history"
        />
      </section>
    </>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  note,
}: {
  icon: typeof Activity;
  label: string;
  value: number;
  note: string;
}) {
  return (
    <article className="workspace-overview-metric">
      <div>
        <span>
          <Icon />
        </span>
        <small>Live</small>
      </div>
      <strong>{value.toLocaleString()}</strong>
      <b>{label}</b>
      <p>{note}</p>
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
    <Link href={href} className={`workspace-connection-row ${provider}`}>
      <span>
        {provider === "discord" ? (
          <Image src="/discord.svg" alt="" width={23} height={23} />
        ) : (
          <Image src="/roblox.svg" alt="" width={22} height={22} />
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
  text,
}: {
  href: string;
  icon: typeof Award;
  title: string;
  text: string;
}) {
  return (
    <Link href={href} className="workspace-tool-card">
      <span>
        <Icon />
      </span>
      <div>
        <b>{title}</b>
        <small>{text}</small>
      </div>
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
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}
function formatDate(value: string) {
  return (
    new Date(value).toLocaleString("en-GB", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "UTC",
    }) + " UTC"
  );
}
