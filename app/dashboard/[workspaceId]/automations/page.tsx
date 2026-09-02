import { ArrowRightLeft, History, Sparkles, Zap } from "lucide-react";
import { PageHeading } from "@/components/workspace-shell";
import { DiscordChannelSelect, Empty, Input, Notice, Panel, Row, Select, Submit } from "@/components/workspace-operations";
import { listDiscordWorkspaceResources } from "@/lib/discord-resources";
import { getWorkspaceControl } from "@/lib/workspace-control";
import { getRobloxGroupRoles, getRobloxHeadshots } from "@/lib/roblox-groups";
import { createAutomation, deleteRecord, requestWorkspaceRankChange } from "../actions";

export const dynamic = "force-dynamic";

export default async function Automations({ params, searchParams }: { params: Promise<{ workspaceId: string }>; searchParams: Promise<{ saved?: string; error?: string }> }) {
  const [{ workspaceId }, query] = await Promise.all([params, searchParams]);
  const { supabase, state } = await getWorkspaceControl(workspaceId);
  const [{ data: rules }, { data: runs }, resources, { data: candidateData }, roles] = await Promise.all([
    supabase.from("automations").select("*").eq("workspace_id", state.workspace.id).order("created_at", { ascending: false }),
    supabase.from("automation_runs").select("*").eq("workspace_id", state.workspace.id).order("created_at", { ascending: false }).limit(50),
    listDiscordWorkspaceResources(state.workspace.discord_guild_id),
    supabase.rpc("workspace_rank_candidates", { target_workspace_id: state.workspace.id }),
    getRobloxGroupRoles(state.workspace.roblox_group_id),
  ]);
  const candidates = (candidateData ?? []) as unknown as Array<{ user_id: string; workspace_role: string; roblox_user_id: string; roblox_username: string | null; roblox_display_name: string | null }>;
  const headshots = await getRobloxHeadshots(candidates.map((candidate) => candidate.roblox_user_id));

  return <>
    <PageHeading eyebrow="Automations" title="Reliable workspace workflows" description="Choose a trigger, an action, and a real channel from your connected Discord server. Every run stays visible." />
    <Notice {...query} />
    <div className="mt-8">
      <Panel icon={ArrowRightLeft} title="Promote or demote a linked member" description="Choose a verified workspace member and a live role from your Roblox group. Nexora records the request and audit log immediately; Roblox execution waits for the approved provider connection.">
        {candidates.length > 0 && roles.length > 0 ? <form action={requestWorkspaceRankChange} className="grid gap-4">
          <input type="hidden" name="public_id" value={workspaceId} />
          <div className="grid gap-3 lg:grid-cols-[1fr_1fr]">
            <label className="grid gap-2 text-sm font-bold text-white/65"><span>Group member</span><select name="roblox_user_id" required className="min-h-14 rounded-xl border border-white/10 bg-[#0e0909] px-4 text-base">
              <option value="">Select a linked member</option>
              {candidates.map((candidate) => <option key={candidate.roblox_user_id} value={candidate.roblox_user_id}>{candidate.roblox_display_name || candidate.roblox_username || candidate.roblox_user_id} · {candidate.workspace_role}</option>)}
            </select></label>
            <label className="grid gap-2 text-sm font-bold text-white/65"><span>Rank to promote or demote to</span><select name="target_role_id" required className="min-h-14 rounded-xl border border-white/10 bg-[#0e0909] px-4 text-base"><option value="">Select target rank</option>{roles.map((role) => <option key={role.id} value={role.id}>{role.name} · rank {role.rank}</option>)}</select></label>
          </div>
          <div className="grid gap-3 rounded-2xl border border-white/8 bg-black/20 p-4 sm:grid-cols-[auto_1fr] sm:items-center">
            <div className="flex -space-x-2">{candidates.slice(0, 5).map((candidate) => {
              const headshot = headshots.get(candidate.roblox_user_id);
              return headshot ? <img key={candidate.roblox_user_id} src={headshot} width={40} height={40} alt="" className="size-10 rounded-full border-2 border-[#100b0b] bg-white/8 object-cover" /> : <span key={candidate.roblox_user_id} className="flex size-10 items-center justify-center rounded-full border-2 border-[#100b0b] bg-white/8 text-xs font-black">{(candidate.roblox_display_name || candidate.roblox_username || "RB").slice(0, 2).toUpperCase()}</span>;
            })}</div>
            <p className="text-sm leading-6 text-white/45">{candidates.length} linked group {candidates.length === 1 ? "member is" : "members are"} available. Profile images come directly from Roblox.</p>
          </div>
          <Input label="Reason" name="reason" required placeholder="Why is this rank change needed?" />
          <div><Submit>Confirm rank request</Submit></div>
        </form> : <Empty>Connect a Roblox group and add Roblox-linked workspace members before creating rank requests.</Empty>}
      </Panel>
    </div>
    <div className="mt-8 grid gap-5 xl:grid-cols-[.9fr_1.1fr]">
      <Panel icon={Zap} title="Create workflow" description="Discord destinations load automatically after the bot is linked. Roblox actions use the required owner-authorized group connection.">
        <form action={createAutomation} className="grid gap-4">
          <input type="hidden" name="public_id" value={workspaceId} />
          <Input label="Workflow name" name="name" required />
          <Select label="Trigger" name="trigger_type"><option value="member_joined">Member joined</option><option value="rank_changed">Rank changed</option><option value="quota_missed">Quota missed</option><option value="application_decided">Application decided</option><option value="schedule">Schedule</option><option value="webhook">Webhook</option></Select>
          <Select label="Action" name="action"><option value="discord_notify">Send Discord notification</option><option value="create_log">Create workspace log</option><option value="request_rank">Request rank change</option></Select>
          <DiscordChannelSelect label="Notification channel" name="channel_id" channels={resources.channels} />
          <label className="flex items-center gap-3 text-sm text-white/65"><input type="checkbox" name="enabled" />Enable immediately</label>
          <div><Submit>Create workflow</Submit></div>
        </form>
      </Panel>
      <Panel icon={Sparkles} title="Workflows" description="Rules are isolated to this workspace and every run receives a result.">
        {rules?.length ? rules.map((rule) => <Row key={rule.id} title={rule.name} subtitle={`${rule.trigger_type.replaceAll("_", " ")} → ${String(rule.definition?.action || "action").replaceAll("_", " ")}`} meta={rule.enabled ? "enabled" : "disabled"} action={<form action={deleteRecord}><input type="hidden" name="public_id" value={workspaceId}/><input type="hidden" name="path" value="automations"/><input type="hidden" name="table" value="automations"/><input type="hidden" name="id" value={rule.id}/><button className="text-sm text-red-200/70">Remove</button></form>} />) : <Empty>No workflows configured.</Empty>}
      </Panel>
    </div>
    <div className="mt-5"><Panel icon={History} title="Run history" description="Successes and failures stay visible for troubleshooting.">{runs?.length ? runs.map((run) => <Row key={run.id} title={`Run ${run.id.slice(0, 8)}`} subtitle={run.error_message || "No error reported"} meta={run.status}/>) : <Empty>No automation runs yet.</Empty>}</Panel></div>
  </>;
}
