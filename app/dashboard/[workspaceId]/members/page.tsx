import Link from "next/link";
import { ArrowDown, ArrowUp, BadgeMinus, ShieldCheck, UserRound, UsersRound } from "lucide-react";
import { PageHeading } from "@/components/workspace-shell";
import { getWorkspaceControl } from "@/lib/workspace-control";
import { getRobloxGroupMembers, getRobloxGroupRoles, getRobloxHeadshots } from "@/lib/roblox-groups";
import { inviteMember, manageMember, requestGroupMemberAction } from "../actions";
import { Input, Select, Submit } from "@/components/workspace-operations";

export const dynamic = "force-dynamic";

const errors: Record<string, string> = {
  invalid_action: "Choose a valid direction and Roblox rank.",
  roblox_group_required: "Connect the workspace's Roblox group first.",
  roblox_reconnect_required: "The workspace owner must reconnect Roblox and approve group access.",
  roblox_permission_denied: "Roblox denied this change. Reconnect Roblox and confirm group:write access for this group.",
  roblox_execution_failed: "Roblox did not confirm the rank change. Nothing is marked complete; review the audit log and try again.",
  save_failed: "The member change could not be saved.",
};

export default async function MembersPage({ params, searchParams }: {
  params: Promise<{ workspaceId: string }>;
  searchParams: Promise<{ tab?: string; cursor?: string; saved?: string; error?: string }>;
}) {
  const [{ workspaceId }, query] = await Promise.all([params, searchParams]);
  const { supabase, state } = await getWorkspaceControl(workspaceId);
  const activeTab = query.tab === "group" ? "group" : "workspace";
  const canManageWorkspace = ["owner", "admin"].includes(state.workspace.role);
  const canOperateGroup = ["owner", "admin", "operator"].includes(state.workspace.role);
  const [{ data: members }, groupPage, robloxRoles] = await Promise.all([
    supabase.from("workspace_members").select("user_id, role, joined_at").eq("workspace_id", state.workspace.id).order("joined_at"),
    activeTab === "group" ? getRobloxGroupMembers(state.workspace.roblox_group_id, query.cursor) : Promise.resolve({ members: [], nextCursor: null, previousCursor: null }),
    activeTab === "group" ? getRobloxGroupRoles(state.workspace.roblox_group_id) : Promise.resolve([]),
  ]);
  const ids = (members ?? []).map((member) => member.user_id);
  const [{ data: profiles }, headshots] = await Promise.all([
    ids.length ? supabase.from("profiles").select("id, display_name, contact_email").in("id", ids) : Promise.resolve({ data: [] }),
    getRobloxHeadshots(groupPage.members.map((member) => member.userId)),
  ]);
  const profileMap = new Map((profiles ?? []).map((profile) => [profile.id, profile]));
  const assignableRoles = robloxRoles.filter((role) => role.rank > 0 && role.rank < 255);

  return <>
    <PageHeading eyebrow="Members" title="People and access" description="Manage Nexora workspace permissions and Roblox community ranks from one audited directory." />
    <nav className="mt-8 inline-flex rounded-2xl border border-white/10 bg-black/25 p-1" aria-label="Member directory">
      <Tab href={`/dashboard/${workspaceId}/members`} active={activeTab === "workspace"}>Workspace members</Tab>
      <Tab href={`/dashboard/${workspaceId}/members?tab=group`} active={activeTab === "group"}>Group members</Tab>
    </nav>
    {query.saved ? <p className="mt-5 rounded-2xl border border-emerald-300/20 bg-emerald-300/8 p-4 text-sm text-emerald-100">{query.saved === "roblox_action" ? "Roblox confirmed the rank change and Nexora recorded it in the audit log." : "Member access updated."}</p> : null}
    {query.error ? <p className="mt-5 rounded-2xl border border-red-300/20 bg-red-300/8 p-4 text-sm text-red-100">{errors[query.error] ?? errors.save_failed}</p> : null}
    {activeTab === "workspace" ? <WorkspaceMembers workspaceId={workspaceId} members={members ?? []} profiles={profileMap} canManage={canManageWorkspace} /> : <GroupMembers workspaceId={workspaceId} groupId={state.workspace.roblox_group_id} groupName={state.workspace.roblox_group_name} members={groupPage.members} roles={assignableRoles} headshots={headshots} canOperate={canOperateGroup} nextCursor={groupPage.nextCursor} previousCursor={groupPage.previousCursor} />}
  </>;
}

function Tab({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return <Link href={href} className={`rounded-xl px-5 py-3 text-sm font-bold transition ${active ? "workspace-accent-surface border border-current/15" : "text-white/45 hover:text-white"}`}>{children}</Link>;
}

function WorkspaceMembers({ workspaceId, members, profiles, canManage }: {
  workspaceId: string;
  members: Array<{ user_id: string; role: string; joined_at: string }>;
  profiles: Map<string, { id: string; display_name: string; contact_email: string }>;
  canManage: boolean;
}) {
  return <>
    {canManage ? <form action={inviteMember} className="mt-6 grid gap-4 rounded-[28px] border border-white/10 bg-white/[.025] p-6 sm:grid-cols-[1fr_180px_auto] sm:items-end">
      <input type="hidden" name="public_id" value={workspaceId} />
      <Input label="Member email" name="email" type="email" required />
      <Select label="Access level" name="role"><option value="viewer">Viewer</option><option value="reviewer">Reviewer</option><option value="operator">Operator</option><option value="admin">Admin</option></Select>
      <Submit>Invite member</Submit>
    </form> : null}
    <section className="mt-5 rounded-[28px] border border-white/10 bg-white/[.025] p-5 sm:p-7">
      <div className="flex items-center gap-3 border-b border-white/8 pb-5"><UsersRound className="workspace-accent size-5" /><div><h2 className="text-xl font-bold">{members.length} workspace members</h2><p className="mt-1 text-sm text-white/40">Dashboard access only—Roblox ranks are managed in the other tab.</p></div></div>
      <div className="divide-y divide-white/7">{members.map((member) => { const profile = profiles.get(member.user_id); return <div key={member.user_id} className="flex flex-wrap items-center gap-4 py-5">
        <span className="flex size-11 items-center justify-center rounded-full bg-white/6"><UserRound className="size-5 text-white/50" /></span>
        <div className="min-w-0 flex-1"><p className="truncate text-base font-bold">{profile?.display_name || "Nexora member"}</p><p className="mt-1 truncate text-sm text-white/38">{profile?.contact_email || "No contact email"}</p></div>
        {canManage && member.role !== "owner" ? <form action={manageMember} className="flex flex-wrap items-center gap-2"><input type="hidden" name="public_id" value={workspaceId} /><input type="hidden" name="user_id" value={member.user_id} /><select name="role" defaultValue={member.role} className="min-h-10 rounded-lg border border-white/10 bg-[#0b0808] px-3 text-sm"><option value="viewer">Viewer</option><option value="reviewer">Reviewer</option><option value="operator">Operator</option><option value="admin">Admin</option></select><button name="action" value="role" className="min-h-10 rounded-lg border border-white/10 px-3 text-sm font-bold">Save access</button><button name="action" value="remove" className="min-h-10 px-2 text-sm font-bold text-red-200/70">Remove</button></form> : <span className="workspace-accent-surface flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold capitalize"><ShieldCheck className="size-3.5" />{member.role}</span>}
      </div>; })}</div>
    </section>
  </>;
}

function GroupMembers({ workspaceId, groupId, groupName, members, roles, headshots, canOperate, nextCursor, previousCursor }: {
  workspaceId: string;
  groupId: string | null;
  groupName: string | null;
  members: Array<{ userId: string; username: string; displayName: string; roleId: string; roleName: string; roleRank: number }>;
  roles: Array<{ id: string; name: string; rank: number }>;
  headshots: Map<string, string>;
  canOperate: boolean;
  nextCursor: string | null;
  previousCursor: string | null;
}) {
  if (!groupId) return <section className="mt-6 rounded-[28px] border border-white/10 bg-white/[.025] p-8 text-center"><UsersRound className="workspace-accent mx-auto size-7" /><h2 className="mt-5 text-2xl font-bold">Connect a Roblox group first</h2><p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-white/45">Once the owner connects Roblox and selects a group, its members and ranks appear here.</p><Link href={`/dashboard/${workspaceId}/connections`} className="mt-6 inline-flex rounded-xl bg-white px-5 py-3 text-sm font-bold text-black">Open connections</Link></section>;
  return <section className="mt-6 rounded-[28px] border border-white/10 bg-white/[.025] p-5 sm:p-7">
    <header className="flex flex-wrap items-end justify-between gap-4 border-b border-white/8 pb-5"><div><p className="workspace-accent text-xs font-bold uppercase tracking-[.16em]">Roblox community</p><h2 className="mt-2 text-2xl font-bold">{groupName || `Group ${groupId}`}</h2><p className="mt-2 text-sm text-white/40">Every completed change is checked against Roblox and written to workspace logs.</p></div><span className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-white/45">{members.length} shown</span></header>
    <div className="divide-y divide-white/7">{members.map((member) => <article key={member.userId} className="py-5">
      <div className="flex flex-wrap items-center gap-4">{headshots.get(member.userId) ? <img src={headshots.get(member.userId)} alt="" className="size-12 rounded-2xl bg-white/5 object-cover" /> : <span className="flex size-12 items-center justify-center rounded-2xl bg-white/6"><UserRound className="size-5 text-white/45" /></span>}<div className="min-w-0 flex-1"><p className="truncate text-base font-bold">{member.displayName}</p><p className="mt-1 truncate text-sm text-white/38">@{member.username} · {member.roleName} · rank {member.roleRank}</p></div></div>
      {canOperate && member.roleRank < 255 ? <form action={requestGroupMemberAction} className="mt-4 grid gap-3 rounded-2xl border border-white/8 bg-black/20 p-4 lg:grid-cols-[150px_1fr_1fr_auto] lg:items-end">
        <input type="hidden" name="public_id" value={workspaceId} /><input type="hidden" name="roblox_user_id" value={member.userId} /><input type="hidden" name="roblox_username" value={member.username} /><input type="hidden" name="current_role_id" value={member.roleId} /><input type="hidden" name="current_role_rank" value={member.roleRank} />
        <label className="grid gap-2 text-sm font-bold">Action<select name="group_action" className="min-h-11 rounded-xl border border-white/10 bg-[#0b0808] px-3"><option value="promote">Promote</option><option value="demote">Demote</option><option value="terminate">Terminate to lowest rank</option></select></label>
        <label className="grid gap-2 text-sm font-bold">New rank<select name="requested_role_id" required className="min-h-11 rounded-xl border border-white/10 bg-[#0b0808] px-3"><option value="">Choose a Roblox rank</option>{roles.map((role) => <option key={role.id} value={role.id}>{role.name} · rank {role.rank}</option>)}</select></label>
        <label className="grid gap-2 text-sm font-bold">Reason<input name="reason" required minLength={2} maxLength={500} placeholder="Why is this rank changing?" className="min-h-11 rounded-xl border border-white/10 bg-black/20 px-3" /></label>
        <button className="workspace-accent-surface flex min-h-11 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-bold"><ArrowUp className="size-4" /><ArrowDown className="-ml-3 size-4" />Confirm</button>
      </form> : member.roleRank >= 255 ? <p className="mt-3 flex items-center gap-2 text-xs text-white/35"><BadgeMinus className="size-4" />The group owner cannot be changed through Nexora.</p> : null}
    </article>)}{!members.length ? <p className="py-12 text-center text-sm text-white/40">No group members were returned by Roblox.</p> : null}</div>
    <footer className="flex justify-between gap-3 border-t border-white/8 pt-5">{previousCursor ? <CursorLink workspaceId={workspaceId} cursor={previousCursor}>Previous</CursorLink> : <span />}{nextCursor ? <CursorLink workspaceId={workspaceId} cursor={nextCursor}>Next 100</CursorLink> : null}</footer>
  </section>;
}

function CursorLink({ workspaceId, cursor, children }: { workspaceId: string; cursor: string; children: React.ReactNode }) {
  return <Link href={`/dashboard/${workspaceId}/members?tab=group&cursor=${encodeURIComponent(cursor)}`} className="rounded-xl border border-white/10 px-4 py-2 text-sm font-bold text-white/65 hover:text-white">{children}</Link>;
}
