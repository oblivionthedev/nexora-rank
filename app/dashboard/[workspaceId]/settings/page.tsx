import {
  AlertTriangle,
  Copy,
  Gamepad2,
  KeyRound,
  Palette,
  Settings,
  UsersRound,
} from "lucide-react";
import { PageHeading } from "@/components/workspace-shell";
import { ApiKeyControl } from "@/components/api-key-control";
import { getWorkspaceControl } from "@/lib/workspace-control";
import {
  saveWorkspaceAccess,
  setWorkspaceLifecycle,
  transferOwnership,
  updateWorkspaceProfile,
} from "../actions";
import { WorkspaceThemeEditor } from "@/components/workspace-theme-editor";

export const dynamic = "force-dynamic";
export default async function SettingsPage({
  params,
  searchParams,
}: {
  params: Promise<{ workspaceId: string }>;
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const [{ workspaceId }, query] = await Promise.all([params, searchParams]);
  const { supabase, state } = await getWorkspaceControl(workspaceId);
  const w = state.workspace;
  const [{ data: key }, { data: members }] = await Promise.all([
    supabase
      .from("api_keys")
      .select("key_prefix,last_used_at,created_at")
      .eq("workspace_id", w.id)
      .is("revoked_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("workspace_members")
      .select("user_id,role")
      .eq("workspace_id", w.id),
  ]);
  const canManage = ["owner", "admin"].includes(w.role);
  const owner = w.role === "owner";
  return (
    <>
      <PageHeading
        eyebrow="Settings & API"
        title="Workspace configuration"
        description="Workspace details, private game access, team rules, appearance, ownership, and permanent deletion."
      />
      {query.saved ? (
        <p className="mt-6 rounded-2xl border border-emerald-300/20 bg-emerald-300/8 p-4 text-sm text-emerald-100">
          Settings saved.
        </p>
      ) : null}
      {query.error ? (
        <p className="mt-6 rounded-2xl border border-red-300/20 bg-red-300/8 p-4 text-sm text-red-100">
          The settings could not be saved. Check the confirmation and your
          permission.
        </p>
      ) : null}
      <div className="mt-8 grid gap-5 xl:grid-cols-2">
        <Section
          icon={Settings}
          title="Workspace details"
          description="The workspace ID is permanent and belongs in your game configuration."
        >
          <form action={updateWorkspaceProfile} className="space-y-3">
            <input type="hidden" name="public_id" value={w.public_id} />
            <label className="block">
              <span className="text-sm font-bold">Workspace name</span>
              <input
                name="name"
                defaultValue={w.name}
                disabled={!owner}
                className="mt-2 min-h-12 w-full rounded-xl border border-white/10 bg-black/20 px-4 text-base"
              />
            </label>
            {owner ? (
              <button className="min-h-11 rounded-xl bg-white px-5 text-sm font-bold text-black">
                Save name
              </button>
            ) : null}
          </form>
          <Field label="Permanent workspace ID" value={w.public_id} mono />
          <Field
            label="Dashboard URL"
            value={`nexorarank.tech/dashboard/${w.public_id}`}
            mono
          />
        </Section>
        <Section
          icon={Palette}
          title="Appearance"
          description="Choose one accent color or build a custom gradient. Your choice is saved only for this workspace."
        >
          <WorkspaceThemeEditor
            publicId={w.public_id}
            mode={state.settings.theme_mode}
            start={state.settings.theme_color_start}
            end={state.settings.theme_color_end}
            disabled={!canManage}
          />
        </Section>
        <Section
          icon={KeyRound}
          title="Private API key"
          description="Exactly 25 characters. The full key is shown only when created or replaced."
        >
          <div className="rounded-2xl border border-white/8 bg-black/20 p-5">
            <ApiKeyControl
              workspaceId={w.id}
              currentPrefix={key?.key_prefix}
              disabled={!canManage || w.operational_status !== "active"}
            />
            {key?.last_used_at ? (
              <p className="mt-3 text-xs text-white/35">
                Last used {new Date(key.last_used_at).toLocaleString("en-GB")}.
              </p>
            ) : null}
          </div>
        </Section>
        <Section
          icon={UsersRound}
          title="Who can join your workspace"
          description="Set a minimum Roblox group rank and optionally list exact Roblox role IDs allowed to work here."
        >
          <form action={saveWorkspaceAccess} className="space-y-4">
            <input type="hidden" name="public_id" value={w.public_id} />
            <label className="block">
              <span className="text-sm font-bold">Minimum group rank</span>
              <input
                name="rank_min"
                type="number"
                min="0"
                max="255"
                defaultValue={state.settings.allowed_roblox_rank_min || 0}
                disabled={!canManage}
                className="mt-2 min-h-12 w-full rounded-xl border border-white/10 bg-black/20 px-4 text-base"
              />
            </label>
            <label className="block">
              <span className="text-sm font-bold">Allowed role IDs</span>
              <input
                name="role_ids"
                defaultValue={(
                  state.settings.allowed_roblox_role_ids || []
                ).join(", ")}
                disabled={!canManage}
                placeholder="12345, 67890"
                className="mt-2 min-h-12 w-full rounded-xl border border-white/10 bg-black/20 px-4 text-base"
              />
            </label>
            <button
              disabled={!canManage}
              className="min-h-12 rounded-xl bg-white px-6 text-sm font-bold text-black disabled:opacity-40"
            >
              Save member rules
            </button>
          </form>
        </Section>
        <Section
          icon={Gamepad2}
          title="Use inside Roblox"
          description="Send both values from your server-side script. Never place the private key in a LocalScript."
        >
          <pre className="overflow-x-auto rounded-2xl border border-white/8 bg-black/30 p-5 text-sm leading-7 text-white/65">
            <code>{`Workspace-ID: ${w.public_id}\nAuthorization: Bearer YOUR_25_CHARACTER_KEY\nGET https://www.nexorarank.tech/api/game/workspace`}</code>
          </pre>
        </Section>
        {owner ? (
          <Section
            icon={AlertTriangle}
            title="Ownership and danger zone"
            description="Ownership changes immediately. Deleting a workspace permanently removes it and every connected record without a recovery period."
          >
            <form action={transferOwnership} className="space-y-3">
              <input type="hidden" name="public_id" value={w.public_id} />
              <select
                name="user_id"
                required
                className="min-h-12 w-full rounded-xl border border-white/10 bg-[#0b0808] px-4"
              >
                <option value="">Choose the new owner</option>
                {members
                  ?.filter((m) => m.role !== "owner")
                  .map((m) => (
                    <option key={m.user_id} value={m.user_id}>
                      {m.user_id} · {m.role}
                    </option>
                  ))}
              </select>
              <button className="min-h-11 rounded-xl border border-amber-200/20 px-5 text-sm font-bold text-amber-100">
                Transfer ownership
              </button>
            </form>
            <form
              action={setWorkspaceLifecycle}
              className="mt-6 space-y-3 border-t border-white/8 pt-6"
            >
              <input type="hidden" name="public_id" value={w.public_id} />
              <input
                name="confirmation_name"
                placeholder={`Type ${w.name} to confirm deletion`}
                className="min-h-12 w-full rounded-xl border border-red-200/15 bg-black/25 px-4"
              />
              <div className="flex flex-wrap gap-3">
                <button
                  name="action"
                  value="archive"
                  className="min-h-11 rounded-xl border border-white/12 px-5 text-sm font-bold"
                >
                  Archive workspace
                </button>
                <button
                  name="action"
                  value="delete"
                  className="min-h-11 rounded-xl border border-red-300/20 bg-red-300/10 px-5 text-sm font-bold text-red-100"
                >
                  Delete permanently
                </button>
              </div>
            </form>
          </Section>
        ) : null}
      </div>
    </>
  );
}
function Section({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: typeof Settings;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[28px] border border-white/10 bg-white/[.025] p-6 sm:p-8">
      <Icon className="workspace-accent size-6" />
      <h2 className="mt-6 text-2xl font-bold">{title}</h2>
      <p className="mt-2 text-sm leading-7 text-white/45">{description}</p>
      <div className="mt-6 space-y-3">{children}</div>
    </section>
  );
}
function Field({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-white/8 bg-black/20 p-4">
      <p className="text-xs font-bold uppercase tracking-wider text-white/32">
        {label}
      </p>
      <div className="mt-2 flex items-center gap-2">
        <span
          className={`truncate text-base text-white/78 ${mono ? "font-mono" : "font-semibold"}`}
        >
          {value}
        </span>
        {mono ? <Copy className="ml-auto size-4 text-white/30" /> : null}
      </div>
    </div>
  );
}
