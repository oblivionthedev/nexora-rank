import { History, Sparkles, Zap } from "lucide-react";
import { PageHeading } from "@/components/workspace-shell";
import { DiscordChannelSelect, Empty, Input, Notice, Panel, Row, Select, Submit } from "@/components/workspace-operations";
import { listDiscordWorkspaceResources } from "@/lib/discord-resources";
import { getWorkspaceControl } from "@/lib/workspace-control";
import { createAutomation, deleteRecord } from "../actions";

export const dynamic = "force-dynamic";

export default async function Automations({ params, searchParams }: { params: Promise<{ workspaceId: string }>; searchParams: Promise<{ saved?: string; error?: string }> }) {
  const [{ workspaceId }, query] = await Promise.all([params, searchParams]);
  const { supabase, state } = await getWorkspaceControl(workspaceId);
  const [{ data: rules }, { data: runs }, resources] = await Promise.all([
    supabase.from("automations").select("*").eq("workspace_id", state.workspace.id).order("created_at", { ascending: false }),
    supabase.from("automation_runs").select("*").eq("workspace_id", state.workspace.id).order("created_at", { ascending: false }).limit(50),
    listDiscordWorkspaceResources(state.workspace.discord_guild_id),
  ]);

  return <>
    <PageHeading eyebrow="Automations" title="Reliable workspace workflows" description="Choose a trigger, an action, and a real channel from your connected Discord server. Every run stays visible." />
    <Notice {...query} />
    <div className="mt-8 grid gap-5 xl:grid-cols-[.9fr_1.1fr]">
      <Panel icon={Zap} title="Create workflow" description="Discord destinations load automatically after the bot is linked. Roblox execution remains deferred until its approved connection is available.">
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
