import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  Ban,
  CheckCircle2,
  Clock3,
  LockKeyhole,
  LogOut,
  Search,
  ShieldCheck,
  Trash2,
  UsersRound,
} from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import {
  addNexoraGroup,
  addPartner,
  manageBetaApplication,
  removeNexoraGroup,
  removePartner,
  resolveSecurityIncident,
  staffSignOut,
  unblockSecurityAccount,
  updateBetaApplication,
} from "@/app/staff/actions";

export const dynamic = "force-dynamic";

type Access = {
  authorized: boolean;
  role: "owner" | "admin" | "moderator" | "support";
  can_moderate: boolean;
  can_ban: boolean;
  can_manage_staff: boolean;
  display_name?: string;
  avatar_url?: string | null;
  session_expires_at?: string | null;
};
type WorkspaceRow = {
  id: string;
  public_id: string;
  name: string;
  plan: string;
  subscription_status: string;
  operational_status: string;
  moderation_status: "clear" | "suspended" | "banned";
  moderation_reason: string | null;
  moderated_at: string | null;
  owner_name: string;
  owner_email: string | null;
  created_at: string;
};
type StaffRow = {
  user_id: string;
  role: Access["role"];
  active: boolean;
  display_name: string;
  email: string | null;
  created_at: string;
};
type ActionRow = {
  id: number;
  action_type: string;
  reason: string;
  workspace_name: string | null;
  actor_name: string;
  created_at: string;
};
type GroupResult = {
  id: string;
  public_id: string;
  name: string;
  roblox_group_id: string | null;
  roblox_group_name: string | null;
  roblox_group_icon_url: string | null;
  moderation_status: string;
  operational_status: string;
};
type ConsoleState = {
  access: Access;
  counts: { total: number; active: number; suspended: number; banned: number };
  workspaces: WorkspaceRow[];
  staff: StaffRow[];
  recent_actions: ActionRow[];
};
type BetaRow = {
  id: string;
  full_name: string;
  email: string;
  age: number;
  status: string;
  discord_notified: boolean;
  discord_user_id: string | null;
  discord_name: string | null;
  created_at: string;
  updated_at: string;
};
type PartnerRow = {
  id: string;
  roblox_group_id: string;
  roblox_group_name: string;
  roblox_group_logo_url: string | null;
  roblox_member_count: number;
  roblox_owner_display_name: string | null;
  roblox_owner_username: string | null;
  discord_invite_url: string;
  published: boolean;
  created_at: string;
};
type NexoraGroupRow = Omit<PartnerRow, "id" | "discord_invite_url"> & {
  id: number;
  discord_invite_url: string | null;
};
type SecurityIncidentRow = {
  id: number; scope: string; target_ref: string | null; actor_email: string | null;
  occurrence_count: number; first_seen_at: string; last_seen_at: string;
  resolved_at: string | null; details: Record<string, unknown>;
  block_id: number | null; blocked_until: string | null; block_active: boolean;
  unblocked_at: string | null;
};

const notices: Record<string, string> = {
  workspace_suspend: "Workspace suspended.",
  workspace_restore: "Workspace moderation cleared.",
  workspace_ban: "Workspace banned.",
  staff_updated: "Staff access updated.",
  staff_revoked: "Staff access revoked.",
  beta_updated: "Beta application status updated.",
  partner_added: "Partner published to the directory.",
  partner_removed: "Partner removed from the directory.",
  group_added: "Group published to Groups using Nexora.",
  group_removed: "Group removed from the Nexora directory.",
  beta_archived: "Beta application archived.",
  beta_deleted: "Beta application permanently deleted.",
  security_resolved: "Security incident resolved. Repeated alerts have stopped.",
  security_unblocked: "The 24-hour email block was removed.",
};
const errors: Record<string, string> = {
  beta_role_sync_failed:
    "The status changed, but Discord could not update the Beta role. Confirm the member is in the Nexora server and the bot role is above the Beta role.",
  invalid_moderation_request:
    "Choose a valid action and enter a reason of at least 4 characters.",
  staff_access_denied: "This account is not staff.",
  staff_moderation_denied: "Your role cannot moderate workspaces.",
  staff_ban_denied: "Only owners and admins can ban workspaces.",
  moderation_reason_required:
    "A reason between 4 and 500 characters is required.",
  workspace_not_found: "That workspace no longer exists.",
  staff_management_denied: "Your role cannot manage staff.",
  invalid_staff_role: "That staff role is invalid.",
  nexora_account_not_found:
    "No Nexora account uses that email yet. Ask them to sign in first.",
  owner_role_required: "Only the platform owner can change that role.",
  owner_role_cannot_be_changed:
    "The platform owner role cannot be changed here.",
  staff_member_not_found: "That staff member was not found.",
  invalid_beta_request: "Choose a valid Beta application status.",
  invalid_beta_status: "Choose a valid Beta application status.",
  invalid_staff_request: "Enter a valid account email and role.",
  invalid_partner:
    "Enter a Roblox group or community link and a valid Discord invite.",
  invalid_group_listing: "Enter a valid Roblox group and optional Discord invite.",
  invalid_security_incident: "That security incident could not be found.",
  invalid_security_block: "That security block could not be found.",
  security_block_not_found: "That block already expired or was removed.",
  roblox_group_not_found: "Roblox could not find that group.",
  action_failed: "The action could not be completed.",
};

export default async function StaffPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    group?: string;
    status?: string;
    notice?: string;
    error?: string;
  }>;
}) {
  if (!isSupabaseConfigured()) redirect("/login?error=oauth_not_ready");
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/staff");
  const { data: blockState } = await supabase.rpc("account_block_state");
  if ((blockState as { blocked?: boolean } | null)?.blocked) {
    await supabase.auth.signOut();
    redirect("/login?error=security_blocked");
  }
  const status = ["active", "suspended", "banned"].includes(params.status ?? "")
    ? params.status!
    : "all";
  const [
    { data, error },
    { data: groupData },
    { data: betaData },
    { data: partnerData },
    { data: nexoraGroupData },
    { data: securityData },
  ] = await Promise.all([
    supabase.rpc("staff_console_state", {
      search_query: params.q?.slice(0, 120) || undefined,
      status_filter: status,
    }),
    params.group
      ? supabase.rpc("staff_find_workspaces", {
          group_query: params.group.slice(0, 120),
        })
      : Promise.resolve({ data: [] }),
    supabase.rpc("staff_beta_applications"),
    supabase.rpc("staff_partners"),
    supabase.rpc("staff_nexora_groups"),
    supabase.rpc("staff_security_incidents"),
  ]);
  if (error || !data) {
    await supabase.rpc("report_security_incident", {
      requested_scope: "staff_access",
      requested_target: "/staff",
      requested_details: { reason: error?.message || "staff_access_denied" },
    });
    await supabase.auth.signOut();
    redirect("/login?error=security_blocked");
  }
  const state = data as unknown as ConsoleState;
  const groupResults = (groupData ?? []) as unknown as GroupResult[];
  const betaApplications = (betaData ?? []) as unknown as BetaRow[];
  const partners = (partnerData ?? []) as unknown as PartnerRow[];
  const nexoraGroups = (nexoraGroupData ?? []) as unknown as NexoraGroupRow[];
  const securityIncidents = (securityData ?? []) as unknown as SecurityIncidentRow[];

  return (
    <div className="min-h-screen bg-[#050303] text-white">
      <header className="staff-console-header sticky top-0 z-30 border-b border-white/8 bg-[#050303]/88 px-5 py-3 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1480px] items-center gap-3">
          <Link href="/" className="flex items-center gap-2">
            <BrandMark compact />
            <span className="hidden text-sm font-semibold sm:inline">
              Nexora Staff
            </span>
          </Link>
          <nav className="staff-console-nav">
            <a href="#overview">Overview</a>
            <a href="#beta-applications">Beta</a>
            <a href="#partners">Partners</a>
            <a href="#nexora-groups">Groups</a>
            <a href="#security-incidents">Security</a>
            <a href="#workspaces">Workspaces</a>
            <a href="#audit">Audit</a>
          </nav>
          <div className="staff-profile-chip">
            {state.access.avatar_url ? (
              <img src={state.access.avatar_url} alt="" />
            ) : (
              <span>
                {(state.access.display_name || "NS").slice(0, 2).toUpperCase()}
              </span>
            )}
            <div>
              <b>{state.access.display_name || "Nexora Staff"}</b>
              <small>{state.access.role}</small>
            </div>
          </div>
          <div className="flex gap-2">
            <Link href="/dashboard" className="pill pill-ghost">
              <ArrowLeft className="size-3.5" />
              Dashboard
            </Link>
            <form action={staffSignOut}>
              <button className="pill pill-ghost" type="submit">
                <LogOut className="size-3.5" />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            </form>
          </div>
        </div>
      </header>

      <main
        id="overview"
        className="staff-console-main mx-auto max-w-[1480px] px-5 py-10 sm:py-14"
      >
        <section className="staff-console-hero flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="microlabel">Platform operations</p>
            <h1 className="mt-3 font-display text-4xl font-extrabold tracking-[-.035em] sm:text-6xl">
              Workspace control.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-white/55">
              Review every workspace, enforce platform rules, and keep a
              permanent record of staff actions.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-[#d79a9a]/20 bg-[#d79a9a]/8 px-4 py-2 text-xs text-[#e5b4b4]">
            <ShieldCheck className="size-4" />
            Database authorization active
          </div>
        </section>

        {params.notice && notices[params.notice] ? (
          <div className="mt-7 flex gap-3 rounded-2xl border border-[#d79a9a]/20 bg-[#d79a9a]/8 p-4 text-sm text-[#f0caca]">
            <CheckCircle2 className="size-5" />
            {notices[params.notice]}
          </div>
        ) : null}
        {params.error && errors[params.error] ? (
          <div className="mt-7 flex gap-3 rounded-2xl border border-red-300/20 bg-red-300/8 p-4 text-sm text-red-100">
            <AlertTriangle className="size-5" />
            {errors[params.error]}
          </div>
        ) : null}

        <section className="mt-8 rounded-[28px] border border-[#d79a9a]/18 bg-[#d79a9a]/[.045] p-5 sm:p-7">
          <p className="text-xs font-bold uppercase tracking-[.16em] text-[#d79a9a]">
            Find a Roblox group
          </p>
          <h2 className="mt-3 text-2xl font-bold">
            Search before taking action
          </h2>
          <p className="mt-2 text-sm leading-7 text-white/48">
            Enter the Roblox group ID, group name, or Nexora workspace ID. Open
            the matching group to review it before suspending or banning.
          </p>
          <form
            action="/staff"
            className="mt-5 flex flex-col gap-2 sm:flex-row"
          >
            <input
              name="group"
              required
              defaultValue={params.group}
              placeholder="Roblox group ID or name"
              className="min-h-12 flex-1 rounded-xl border border-white/10 bg-black/30 px-4 text-base outline-none focus:border-[#d79a9a]/50"
            />
            <button className="min-h-12 rounded-xl bg-[#ffffff] px-6 text-sm font-bold text-black">
              Search groups
            </button>
          </form>
          {params.group ? (
            <div className="mt-5 space-y-2">
              {groupResults.length ? (
                groupResults.map((result) => (
                  <Link
                    key={result.id}
                    href={`/staff/workspaces/${result.public_id}`}
                    className="flex items-center gap-4 rounded-2xl border border-white/9 bg-black/25 p-4 transition hover:border-[#d79a9a]/35"
                  >
                    <span className="flex size-12 items-center justify-center rounded-xl bg-white/6 text-sm font-bold">
                      {result.roblox_group_name?.slice(0, 2).toUpperCase() ||
                        "RB"}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-base font-bold">
                        {result.roblox_group_name || result.name}
                      </p>
                      <p className="mt-1 text-sm text-white/40">
                        Group {result.roblox_group_id || "not linked"} ·{" "}
                        {result.name} · {result.public_id}
                      </p>
                    </div>
                    <span className="ml-auto text-sm font-bold capitalize text-[#d79a9a]">
                      Open →
                    </span>
                  </Link>
                ))
              ) : (
                <p className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-sm text-white/40">
                  No Nexora workspace uses that group.
                </p>
              )}
            </div>
          ) : null}
        </section>

        <section className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Metric
            label="All workspaces"
            value={state.counts.total}
            icon={UsersRound}
          />
          <Metric
            label="Active"
            value={state.counts.active}
            icon={Activity}
            tone="green"
          />
          <Metric
            label="Suspended"
            value={state.counts.suspended}
            icon={LockKeyhole}
            tone="amber"
          />
          <Metric
            label="Banned"
            value={state.counts.banned}
            icon={Ban}
            tone="red"
          />
        </section>

        <section
          id="beta-applications"
          className="mt-8 rounded-[28px] border border-white/9 bg-white/[.025] p-4 sm:p-6"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="microlabel">Beta program</p>
              <h2 className="mt-3 text-2xl font-extrabold">Applications</h2>
              <p className="mt-2 text-sm text-white/45">
                Review applicants, confirm the Discord notification, and publish
                the status they can check privately.
              </p>
            </div>
            <span className="rounded-full border border-white/10 px-3 py-1.5 text-xs font-bold text-white/45">
              {betaApplications.length} total
            </span>
          </div>
          <div className="mt-6 grid gap-3">
            {betaApplications.length ? (
              betaApplications.map((application) => (
                <article
                  key={application.id}
                  className="grid gap-4 rounded-2xl border border-white/8 bg-black/20 p-4 lg:grid-cols-[1fr_auto] lg:items-center"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <b className="text-base">{application.full_name}</b>
                      <span className="rounded-full bg-white/6 px-2 py-1 text-[10px] font-extrabold uppercase tracking-wider text-white/50">
                        {application.status}
                      </span>
                      <span
                        className={`rounded-full px-2 py-1 text-[10px] font-extrabold uppercase tracking-wider ${application.discord_notified ? "bg-emerald-300/8 text-emerald-200" : "bg-amber-300/8 text-amber-100"}`}
                      >
                        {application.discord_notified
                          ? "Discord sent"
                          : "Discord pending"}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-white/52">
                      {application.email} · age {application.age}
                    </p>
                    <p className="mt-1 text-xs text-white/38">
                      Discord: {application.discord_name || "Not linked"}
                      {application.discord_user_id
                        ? ` · ${application.discord_user_id}`
                        : ""}
                    </p>
                    <time className="mt-1 block text-xs text-white/28">
                      Applied {formatDate(application.created_at)}
                    </time>
                  </div>
                  <div className="flex flex-wrap gap-2">
                  <form action={updateBetaApplication} className="flex gap-2">
                    <input
                      type="hidden"
                      name="application_id"
                      value={application.id}
                    />
                    <select
                      name="status"
                      defaultValue={application.status}
                      className="min-h-11 rounded-xl border border-white/10 bg-[#0e0909] px-3 text-sm"
                    >
                      <option value="submitted">Submitted</option>
                      <option value="reviewing">Reviewing</option>
                      <option value="selected">Selected</option>
                      <option value="waitlisted">Waitlisted</option>
                      <option value="declined">Declined</option>
                    </select>
                    <button className="min-h-11 rounded-xl bg-white px-4 text-sm font-extrabold text-black">
                      Save
                    </button>
                  </form>
                  <form action={manageBetaApplication} className="flex gap-2">
                    <input type="hidden" name="application_id" value={application.id} />
                    <button name="manage_action" value="archive" className="min-h-11 rounded-xl border border-white/10 px-3 text-xs font-bold text-white/60">Archive</button>
                    {(state.access.role === "owner" || state.access.role === "admin") ? <button name="manage_action" value="delete" className="min-h-11 rounded-xl border border-red-300/15 px-3 text-xs font-bold text-red-100/70">Delete</button> : null}
                  </form>
                  </div>
                </article>
              ))
            ) : (
              <p className="rounded-2xl border border-dashed border-white/10 p-10 text-center text-sm text-white/40">
                No Beta applications yet.
              </p>
            )}
          </div>
        </section>

        <section id="nexora-groups" className="mt-8 rounded-[28px] border border-white/9 bg-white/[.025] p-4 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div><p className="microlabel">Public customer directory</p><h2 className="mt-3 text-2xl font-extrabold">Groups using Nexora</h2><p className="mt-2 max-w-2xl text-sm leading-7 text-white/50">Publish verified Roblox groups that actively use Nexora. This is separate from partnerships.</p></div>
            <span className="rounded-full border border-white/10 px-3 py-1.5 text-xs font-bold text-white/45">{nexoraGroups.length} published</span>
          </div>
          {(state.access.role === "owner" || state.access.role === "admin") ? <form action={addNexoraGroup} className="mt-6 grid gap-3 rounded-2xl border border-[#d79a9a]/18 bg-[#d79a9a]/[.045] p-4 lg:grid-cols-[1fr_1fr_auto] lg:items-end">
            <label><span className="mb-2 block text-xs font-extrabold uppercase tracking-wider text-white/55">Roblox group</span><input name="roblox_group" required placeholder="Group ID or community link" className="min-h-12 w-full rounded-xl border border-white/10 bg-black/30 px-4" /></label>
            <label><span className="mb-2 block text-xs font-extrabold uppercase tracking-wider text-white/55">Discord invite · optional</span><input name="discord_invite" type="url" placeholder="https://discord.gg/your-server" className="min-h-12 w-full rounded-xl border border-white/10 bg-black/30 px-4" /></label>
            <button className="min-h-12 rounded-xl bg-white px-6 text-sm font-extrabold text-black">Add group</button>
          </form> : null}
          <div className="mt-5 grid gap-3 md:grid-cols-2">{nexoraGroups.length ? nexoraGroups.map((group) => <article key={group.id} className="flex items-center gap-4 rounded-2xl border border-white/8 bg-black/20 p-4">
            {group.roblox_group_logo_url ? <img src={group.roblox_group_logo_url} alt="" className="size-14 rounded-2xl bg-white object-cover" /> : <span className="flex size-14 items-center justify-center rounded-2xl bg-white/7 text-sm font-black">RB</span>}
            <div className="min-w-0 flex-1"><b className="block truncate">{group.roblox_group_name}</b><p className="mt-1 text-xs text-white/45">Owned by {group.roblox_owner_display_name || group.roblox_owner_username || "Roblox member"}</p><p className="mt-1 text-xs text-white/30">{group.roblox_member_count.toLocaleString()} members</p></div>
            {(state.access.role === "owner" || state.access.role === "admin") ? <form action={removeNexoraGroup}><input type="hidden" name="group_record_id" value={group.id} /><button aria-label={`Remove ${group.roblox_group_name}`} className="flex size-10 items-center justify-center rounded-xl border border-red-300/15 text-red-100/70"><Trash2 className="size-4" /></button></form> : null}
          </article>) : <p className="col-span-full rounded-2xl border border-dashed border-white/10 p-10 text-center text-sm text-white/40">No groups are published yet.</p>}</div>
        </section>

        <section id="security-incidents" className="mt-8 rounded-[28px] border border-red-300/12 bg-red-300/[.025] p-4 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-red-200/70">Access protection</p><h2 className="mt-3 text-2xl font-extrabold">Unauthorized access incidents</h2><p className="mt-2 text-sm text-white/45">Every confirmed attempt blocks that account email for 24 hours. Alerts continue every 60 seconds until Staff resolves the incident; owners and admins can remove a block if it was a mistake.</p></div><span className="rounded-full border border-red-300/15 px-3 py-1.5 text-xs font-bold text-red-100/60">{securityIncidents.filter((item) => !item.resolved_at).length} unresolved</span></div>
          <div className="mt-6 grid gap-3">{securityIncidents.length ? securityIncidents.map((incident) => <article key={incident.id} className="grid gap-4 rounded-2xl border border-white/8 bg-black/25 p-4 lg:grid-cols-[1fr_auto] lg:items-center">
            <div><div className="flex flex-wrap gap-2"><b className="capitalize">{incident.scope.replaceAll("_", " ")}</b><span className={incident.resolved_at ? "text-xs text-emerald-200/60" : "text-xs text-red-200"}>{incident.resolved_at ? "Resolved" : "Alerting"}</span>{incident.block_active ? <span className="rounded-full border border-red-300/20 bg-red-300/8 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-red-100">Email blocked</span> : null}</div><p className="mt-2 text-sm text-white/50">{incident.actor_email || "Unknown signed-in account"}{incident.target_ref ? ` · ${incident.target_ref}` : ""}</p><p className="mt-1 text-xs text-white/30">{incident.occurrence_count} attempt(s) · last seen {formatDate(incident.last_seen_at)}{incident.block_active && incident.blocked_until ? ` · blocked until ${formatDate(incident.blocked_until)}` : ""}</p></div>
            <div className="flex flex-col gap-2 sm:flex-row">{incident.block_active && incident.block_id && (state.access.role === "owner" || state.access.role === "admin") ? <form action={unblockSecurityAccount}><input type="hidden" name="block_id" value={incident.block_id} /><button className="min-h-11 rounded-xl border border-red-300/20 px-4 text-sm font-extrabold text-red-100">Unblock email</button></form> : null}{!incident.resolved_at ? <form action={resolveSecurityIncident}><input type="hidden" name="incident_id" value={incident.id} /><button className="min-h-11 rounded-xl bg-white px-4 text-sm font-extrabold text-black">Resolve &amp; stop alerts</button></form> : null}</div>
          </article>) : <p className="rounded-2xl border border-dashed border-white/10 p-10 text-center text-sm text-white/40">No unauthorized access incidents.</p>}</div>
        </section>

        <section
          id="partners"
          className="mt-8 rounded-[28px] border border-white/9 bg-white/[.025] p-4 sm:p-6"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="microlabel">Public directory</p>
              <h2 className="mt-3 text-2xl font-extrabold">Partners</h2>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-white/50">
                Add a Roblox community and its Discord invite. Nexora verifies
                the group and publishes its live name, logo, member count, and
                owner.
              </p>
            </div>
            <span className="rounded-full border border-white/10 px-3 py-1.5 text-xs font-bold text-white/45">
              {partners.length} published
            </span>
          </div>

          {state.access.role === "owner" || state.access.role === "admin" ? (
            <form
              action={addPartner}
              className="mt-6 grid gap-3 rounded-2xl border border-[#d79a9a]/18 bg-[#d79a9a]/[.045] p-4 lg:grid-cols-[1fr_1fr_auto] lg:items-end"
            >
              <label className="block">
                <span className="mb-2 block text-xs font-extrabold uppercase tracking-wider text-white/55">
                  Roblox group
                </span>
                <input
                  name="roblox_group"
                  required
                  placeholder="Group ID or Roblox community link"
                  className="min-h-12 w-full rounded-xl border border-white/10 bg-black/30 px-4 text-base outline-none focus:border-[#d79a9a]/50"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-xs font-extrabold uppercase tracking-wider text-white/55">
                  Discord invite
                </span>
                <input
                  name="discord_invite"
                  type="url"
                  required
                  placeholder="https://discord.gg/your-server"
                  className="min-h-12 w-full rounded-xl border border-white/10 bg-black/30 px-4 text-base outline-none focus:border-[#d79a9a]/50"
                />
              </label>
              <button className="min-h-12 rounded-xl bg-white px-6 text-sm font-extrabold text-black">
                Add partner
              </button>
            </form>
          ) : null}

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {partners.length ? (
              partners.map((partner) => (
                <article
                  key={partner.id}
                  className="flex items-center gap-4 rounded-2xl border border-white/8 bg-black/20 p-4"
                >
                  {partner.roblox_group_logo_url ? (
                    <img
                      src={partner.roblox_group_logo_url}
                      alt=""
                      className="size-14 rounded-2xl bg-white object-cover"
                    />
                  ) : (
                    <span className="flex size-14 items-center justify-center rounded-2xl bg-white/7 text-sm font-black">
                      RB
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <b className="block truncate text-base">
                      {partner.roblox_group_name}
                    </b>
                    <p className="mt-1 truncate text-xs text-white/45">
                      Owned by{" "}
                      {partner.roblox_owner_display_name ||
                        partner.roblox_owner_username ||
                        "Roblox member"}
                    </p>
                    <p className="mt-1 text-xs text-white/30">
                      {partner.roblox_member_count.toLocaleString()} members ·
                      Group {partner.roblox_group_id}
                    </p>
                  </div>
                  {state.access.role === "owner" ||
                  state.access.role === "admin" ? (
                    <form action={removePartner}>
                      <input
                        type="hidden"
                        name="partner_id"
                        value={partner.id}
                      />
                      <button
                        aria-label={`Remove ${partner.roblox_group_name}`}
                        className="flex size-10 items-center justify-center rounded-xl border border-red-300/15 text-red-100/70 transition hover:bg-red-300/10"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </form>
                  ) : null}
                </article>
              ))
            ) : (
              <p className="col-span-full rounded-2xl border border-dashed border-white/10 p-10 text-center text-sm text-white/40">
                No partners have been published yet.
              </p>
            )}
          </div>
        </section>

        <section
          id="workspaces"
          className="mt-8 rounded-[28px] border border-white/9 bg-white/[.025] p-4 sm:p-6"
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-bold">Workspaces</h2>
              <p className="mt-1 text-xs text-white/42">
                Search by workspace, permanent ID, owner, or email.
              </p>
            </div>
            <form className="flex flex-col gap-2 sm:flex-row" action="/staff">
              <label className="relative">
                <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-white/35" />
                <input
                  name="q"
                  defaultValue={params.q}
                  placeholder="Search workspaces"
                  className="min-h-11 w-full rounded-full border border-white/10 bg-black/30 pl-11 pr-4 text-sm outline-none focus:border-[#d79a9a]/50 sm:w-72"
                />
              </label>
              <select
                name="status"
                defaultValue={status}
                className="min-h-11 rounded-full border border-white/10 bg-[#0e0909] px-4 text-sm"
              >
                <option value="all">All statuses</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
                <option value="banned">Banned</option>
              </select>
              <button className="min-h-11 rounded-full bg-white px-5 text-sm font-bold text-black">
                Filter
              </button>
            </form>
          </div>
          <div className="mt-6 space-y-3">
            {state.workspaces.length ? (
              state.workspaces.map((workspace) => (
                <WorkspaceCard
                  key={workspace.id}
                  workspace={workspace}
                  access={state.access}
                />
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-white/10 py-14 text-center text-sm text-white/40">
                No matching workspaces.
              </div>
            )}
          </div>
        </section>

        <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_.82fr]">
          <section
            id="audit"
            className="rounded-[28px] border border-white/9 bg-white/[.025] p-5 sm:p-7"
          >
            <div className="flex items-center gap-3">
              <Clock3 className="size-5 text-[#d79a9a]" />
              <div>
                <h2 className="font-bold">Recent staff actions</h2>
                <p className="text-xs text-white/40">
                  Newest first · audit records cannot be edited from the website
                </p>
              </div>
            </div>
            <div className="mt-5 divide-y divide-white/7">
              {state.recent_actions.length ? (
                state.recent_actions.map((action) => (
                  <div
                    key={action.id}
                    className="grid gap-1 py-4 sm:grid-cols-[1fr_auto]"
                  >
                    <div>
                      <p className="text-sm font-semibold">
                        {humanAction(action.action_type)}
                        {action.workspace_name
                          ? ` · ${action.workspace_name}`
                          : ""}
                      </p>
                      <p className="mt-1 text-xs text-white/45">
                        {action.reason} · by {action.actor_name}
                      </p>
                    </div>
                    <time className="text-[11px] text-white/32">
                      {formatDate(action.created_at)}
                    </time>
                  </div>
                ))
              ) : (
                <p className="py-8 text-sm text-white/40">
                  No staff actions yet.
                </p>
              )}
            </div>
          </section>
          <section className="rounded-[28px] border border-white/9 bg-white/[.025] p-5 sm:p-7">
            <div className="flex items-center gap-3">
              <UsersRound className="size-5 text-[#d79a9a]" />
              <div>
                <h2 className="font-bold">Current Staff session</h2>
                <p className="text-xs text-white/40">
                  Discord-verified operator profile
                </p>
              </div>
            </div>
            <div className="mt-5 flex items-center gap-3 rounded-2xl border border-[#d79a9a]/18 bg-[#d79a9a]/[.05] p-4">
              {state.access.avatar_url ? (
                <img
                  src={state.access.avatar_url}
                  alt=""
                  className="size-10 rounded-full object-cover"
                />
              ) : (
                <span className="flex size-10 items-center justify-center rounded-full bg-[#d79a9a]/12 text-sm font-bold text-[#d79a9a]">
                  {(state.access.display_name || "NS")
                    .slice(0, 2)
                    .toUpperCase()}
                </span>
              )}
              <div>
                <p className="text-sm font-semibold">
                  {state.access.display_name || "Nexora Staff"}
                </p>
                <p className="mt-1 text-xs capitalize text-white/40">
                  {state.access.role} access
                  {state.access.session_expires_at
                    ? ` · expires ${formatDate(state.access.session_expires_at)}`
                    : " · permanent"}
                </p>
              </div>
              <ShieldCheck className="ml-auto size-5 text-[#d79a9a]" />
            </div>
            <p className="mt-4 text-xs leading-6 text-white/38">
              A Staff URL alone grants nothing. Database authorization checks
              the active session on every protected request.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}

function Metric({
  label,
  value,
  icon: Icon,
  tone = "neutral",
}: {
  label: string;
  value: number;
  icon: typeof Activity;
  tone?: "neutral" | "green" | "amber" | "red";
}) {
  const tones = {
    neutral: "text-white/55 bg-white/6",
    green: "text-[#e5b4b4] bg-[#d79a9a]/8",
    amber: "text-amber-200 bg-amber-300/8",
    red: "text-red-200 bg-red-300/8",
  };
  return (
    <article className="rounded-3xl border border-white/9 bg-white/[.025] p-5">
      <div
        className={`flex size-10 items-center justify-center rounded-2xl ${tones[tone]}`}
      >
        <Icon className="size-4" />
      </div>
      <p className="mt-5 text-3xl font-extrabold">{value}</p>
      <p className="mt-1 text-xs text-white/40">{label}</p>
    </article>
  );
}

function WorkspaceCard({
  workspace,
  access,
}: {
  workspace: WorkspaceRow;
  access: Access;
}) {
  return (
    <article className="rounded-3xl border border-white/8 bg-black/20 p-4 sm:p-5">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-bold">{workspace.name}</h3>
            <StatusBadge workspace={workspace} />
            <span className="rounded-full bg-white/5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white/45">
              {workspace.plan}
            </span>
          </div>
          <div className="mt-3 grid gap-1 text-xs text-white/43 sm:grid-cols-2 xl:grid-cols-4">
            <span>
              ID <code className="text-[#d79a9a]">{workspace.public_id}</code>
            </span>
            <span className="truncate">Owner {workspace.owner_name}</span>
            <span className="truncate">
              {workspace.owner_email || "No email"}
            </span>
            <span>Created {formatDate(workspace.created_at)}</span>
          </div>
          {workspace.moderation_reason ? (
            <p className="mt-3 rounded-xl border border-white/7 bg-white/3 px-3 py-2 text-xs text-white/55">
              Reason: {workspace.moderation_reason}
            </p>
          ) : null}
        </div>
        <Link
          href={`/staff/workspaces/${workspace.public_id}`}
          className="rounded-xl border border-[#d79a9a]/25 bg-[#d79a9a]/8 px-5 py-3 text-center text-sm font-bold text-[#d79a9a]"
        >
          {access.can_moderate ? "Review & moderate" : "View workspace"}
        </Link>
      </div>
    </article>
  );
}
function StatusBadge({ workspace }: { workspace: WorkspaceRow }) {
  const status =
    workspace.moderation_status === "banned"
      ? "Banned"
      : workspace.operational_status === "suspended"
        ? "Suspended"
        : "Active";
  const tone =
    status === "Active"
      ? "border-[#d79a9a]/20 bg-[#d79a9a]/8 text-[#e5b4b4]"
      : status === "Banned"
        ? "border-red-300/20 bg-red-300/8 text-red-200"
        : "border-amber-300/20 bg-amber-300/8 text-amber-200";
  return (
    <span
      className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${tone}`}
    >
      {status}
    </span>
  );
}
function humanAction(value: string) {
  return value
    .split("_")
    .map((word) => word[0]?.toUpperCase() + word.slice(1))
    .join(" ");
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
