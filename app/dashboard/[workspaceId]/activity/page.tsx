import { Activity, Clock3, Gauge } from "lucide-react";
import { PageHeading } from "@/components/workspace-shell";
import {
  Empty,
  Input,
  Notice,
  Panel,
  Row,
  RobloxRoleSelect,
  Select,
  Submit,
} from "@/components/workspace-operations";
import { getWorkspaceControl } from "@/lib/workspace-control";
import { getRobloxGroupRoles } from "@/lib/roblox-groups";
import { addManualActivity, deleteRecord, saveQuota } from "../actions";
export const dynamic = "force-dynamic";
export default async function ActivityPage({
  params,
  searchParams,
}: {
  params: Promise<{ workspaceId: string }>;
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const [{ workspaceId }, q] = await Promise.all([params, searchParams]);
  const { supabase, state } = await getWorkspaceControl(workspaceId);
  const [{ data: quotas }, { data: sessions }, robloxRoles] = await Promise.all(
    [
      supabase
        .from("activity_quotas")
        .select("*")
        .eq("workspace_id", state.workspace.id),
      supabase
        .from("activity_sessions")
        .select("*")
        .eq("workspace_id", state.workspace.id)
        .order("started_at", { ascending: false })
        .limit(50),
      getRobloxGroupRoles(state.workspace.roblox_group_id),
    ],
  );
  return (
    <>
      <PageHeading
        eyebrow="Activity"
        title="Sessions and quotas"
        description="Track time from your game, add audited corrections, and define fair requirements for each rank."
      />
      <Notice {...q} />
      <div className="mt-8 grid gap-5 xl:grid-cols-2">
        <Panel
          icon={Gauge}
          title="Add quota"
          description="Choose a role from the connected Roblox group and set how often progress resets."
        >
          <form action={saveQuota} className="grid gap-4">
            <input type="hidden" name="public_id" value={workspaceId} />
            <RobloxRoleSelect
              label="Roblox group role"
              name="roblox_role_id"
              roles={robloxRoles}
              required
            />
            <Select label="Period" name="period">
              <option value="weekly">Weekly</option>
              <option value="daily">Daily</option>
              <option value="monthly">Monthly</option>
            </Select>
            <Input
              label="Required minutes"
              name="minutes_required"
              type="number"
              min="0"
              required
            />
            <Input
              label="Grace minutes"
              name="grace_minutes"
              type="number"
              min="0"
              defaultValue="0"
            />
            <div>
              <Submit>Save quota</Submit>
            </div>
          </form>
        </Panel>
        <Panel
          icon={Clock3}
          title="Manual activity correction"
          description="Corrections are labelled manual and remain visible in logs."
        >
          <form action={addManualActivity} className="grid gap-4">
            <input type="hidden" name="public_id" value={workspaceId} />
            <Input label="Roblox user ID" name="roblox_user_id" required />
            <Input label="Roblox username" name="roblox_username" required />
            <Input
              label="Minutes"
              name="minutes"
              type="number"
              min="1"
              max="10080"
              required
            />
            <div>
              <Submit>Add activity</Submit>
            </div>
          </form>
        </Panel>
      </div>
      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <Panel
          icon={Gauge}
          title="Quota rules"
          description="Current requirements by Roblox role."
        >
          {quotas?.length ? (
            quotas.map((x) => (
              <Row
                key={x.id}
                title={`Role ${x.roblox_role_id}`}
                subtitle={`${x.minutes_required} required minutes · ${x.grace_minutes} grace`}
                meta={x.period}
                action={
                  <form action={deleteRecord}>
                    <input type="hidden" name="public_id" value={workspaceId} />
                    <input type="hidden" name="path" value="activity" />
                    <input type="hidden" name="table" value="activity_quotas" />
                    <input type="hidden" name="id" value={x.id} />
                    <button className="text-sm text-red-200/70">Remove</button>
                  </form>
                }
              />
            ))
          ) : (
            <Empty>No quotas configured.</Empty>
          )}
        </Panel>
        <Panel
          icon={Activity}
          title="Recent sessions"
          description="Game and manual activity, newest first."
        >
          {sessions?.length ? (
            sessions.map((s) => (
              <Row
                key={s.id}
                title={s.roblox_username}
                subtitle={`${Math.round((s.duration_seconds || 0) / 60)} minutes`}
                meta={s.source}
              />
            ))
          ) : (
            <Empty>No activity has been recorded yet.</Empty>
          )}
        </Panel>
      </div>
    </>
  );
}
