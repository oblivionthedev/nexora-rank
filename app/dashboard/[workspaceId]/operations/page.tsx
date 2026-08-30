import { Building2, CalendarClock, ClipboardCheck, Palmtree } from "lucide-react";
import { PageHeading } from "@/components/workspace-shell";
import { DiscordChannelSelect, DiscordRoleSelect, Empty, Input, Notice, Panel, Row, Select, Submit, Textarea } from "@/components/workspace-operations";
import { listDiscordWorkspaceResources } from "@/lib/discord-resources";
import { getWorkspaceControl } from "@/lib/workspace-control";
import { createCommunitySession, createDepartment, createLeaveRequest, createWorkspaceTask, deleteRecord } from "../actions";

export const dynamic = "force-dynamic";

export default async function Operations({ params, searchParams }: { params: Promise<{ workspaceId: string }>; searchParams: Promise<{ saved?: string; error?: string }> }) {
  const [{ workspaceId }, query] = await Promise.all([params, searchParams]);
  const { supabase, state } = await getWorkspaceControl(workspaceId);
  const [{ data: departments }, { data: sessions }, { data: leaves }, { data: tasks }, resources] = await Promise.all([
    supabase.from("departments").select("*").eq("workspace_id", state.workspace.id).order("name"),
    supabase.from("community_sessions").select("*").eq("workspace_id", state.workspace.id).order("starts_at", { ascending: false }).limit(25),
    supabase.from("leave_requests").select("*").eq("workspace_id", state.workspace.id).order("created_at", { ascending: false }).limit(25),
    supabase.from("workspace_tasks").select("*").eq("workspace_id", state.workspace.id).order("created_at", { ascending: false }).limit(25),
    listDiscordWorkspaceResources(state.workspace.discord_guild_id),
  ]);

  return <>
    <PageHeading eyebrow="Operations" title="Run your staff community" description="Organize departments, training and shift sessions, leave requests, and staff tasks in one audited workspace." />
    <Notice {...query} />
    <div className="mt-8 grid gap-5 xl:grid-cols-2">
      <Panel icon={Building2} title="Departments and divisions" description="Connect an internal team to a role loaded directly from your Discord server.">
        <form action={createDepartment} className="grid gap-4"><input type="hidden" name="public_id" value={workspaceId}/><Input label="Department name" name="name" required/><Textarea label="Description" name="description"/><div className="grid gap-4 sm:grid-cols-2"><DiscordRoleSelect label="Discord role" name="discord_role_id" roles={resources.roles}/><Input label="Roblox group ID" name="roblox_group_id"/></div><div><Submit>Add department</Submit></div></form>
        <div className="mt-6">{departments?.length ? departments.map((item) => <Record key={item.id} id={item.id} workspaceId={workspaceId} table="departments" title={item.name} subtitle={item.description} meta={item.active ? "active" : "inactive"}/>) : <Empty>No departments yet.</Empty>}</div>
      </Panel>
      <Panel icon={CalendarClock} title="Sessions and events" description="Schedule trainings, patrols, shifts, or community events and choose the announcement channel by name.">
        <form action={createCommunitySession} className="grid gap-4"><input type="hidden" name="public_id" value={workspaceId}/><Input label="Title" name="title" required/><div className="grid gap-4 sm:grid-cols-2"><Select label="Type" name="session_type"><option value="training">Training</option><option value="patrol">Patrol</option><option value="shift">Shift</option><option value="event">Event</option></Select><Input label="Starts at" name="starts_at" type="datetime-local" required/></div><DiscordChannelSelect label="Discord announcement channel" name="discord_channel_id" channels={resources.channels}/><Textarea label="Host notes" name="notes"/><div><Submit>Schedule session</Submit></div></form>
        <div className="mt-6">{sessions?.length ? sessions.map((item) => <Record key={item.id} id={item.id} workspaceId={workspaceId} table="community_sessions" title={item.title} subtitle={new Date(item.starts_at).toLocaleString()} meta={item.session_type}/>) : <Empty>No sessions scheduled.</Empty>}</div>
      </Panel>
      <Panel icon={Palmtree} title="Leave of absence" description="Record and review time away without losing staff context.">
        <form action={createLeaveRequest} className="grid gap-4"><input type="hidden" name="public_id" value={workspaceId}/><Input label="Staff member" name="member_name" required/><div className="grid gap-4 sm:grid-cols-2"><Input label="First day" name="starts_on" type="date" required/><Input label="Last day" name="ends_on" type="date" required/></div><Textarea label="Reason" name="reason" required/><div><Submit>Submit leave request</Submit></div></form>
        <div className="mt-6">{leaves?.length ? leaves.map((item) => <Record key={item.id} id={item.id} workspaceId={workspaceId} table="leave_requests" title={item.member_name} subtitle={`${item.starts_on} — ${item.ends_on}`} meta={item.status}/>) : <Empty>No leave requests.</Empty>}</div>
      </Panel>
      <Panel icon={ClipboardCheck} title="Staff tasks" description="Track assignments with priority, status, and due dates.">
        <form action={createWorkspaceTask} className="grid gap-4"><input type="hidden" name="public_id" value={workspaceId}/><Input label="Task title" name="title" required/><Textarea label="Details" name="description"/><div className="grid gap-4 sm:grid-cols-2"><Select label="Priority" name="priority"><option value="normal">Normal</option><option value="low">Low</option><option value="high">High</option><option value="urgent">Urgent</option></Select><Input label="Due at" name="due_at" type="datetime-local"/></div><div><Submit>Create task</Submit></div></form>
        <div className="mt-6">{tasks?.length ? tasks.map((item) => <Record key={item.id} id={item.id} workspaceId={workspaceId} table="workspace_tasks" title={item.title} subtitle={item.description} meta={`${item.priority} · ${item.status}`}/>) : <Empty>No staff tasks.</Empty>}</div>
      </Panel>
    </div>
  </>;
}

function Record({ id, workspaceId, table, title, subtitle, meta }: { id: string; workspaceId: string; table: string; title: string; subtitle?: string | null; meta: string }) {
  return <Row title={title} subtitle={subtitle} meta={meta} action={<form action={deleteRecord}><input type="hidden" name="public_id" value={workspaceId}/><input type="hidden" name="path" value="operations"/><input type="hidden" name="table" value={table}/><input type="hidden" name="id" value={id}/><button className="text-sm text-red-200/70">Remove</button></form>} />;
}
