import { Bot, ExternalLink, Gamepad2 } from "lucide-react";
import { PageHeading } from "@/components/workspace-shell";
import { DiscordLinkCode } from "@/components/discord-link-code";
import { getWorkspaceControl } from "@/lib/workspace-control";
import { listRobloxGroups } from "@/lib/roblox-membership";
import {
  addWorkspaceRobloxGroup,
  connectRobloxGroup,
  deleteRecord,
  disconnectIntegration,
} from "../actions";
export const dynamic = "force-dynamic";
const errors: Record<string, string> = {
  invalid_group: "Enter a valid Roblox group ID.",
  group_not_found: "That Roblox group could not be found.",
  group_owner_required: "Your connected Roblox account must own that group.",
  roblox_identity_required: "Connect Roblox before selecting a group.",
  roblox_reconnect_required:
    "Reconnect Roblox to approve secure group management permissions.",
  roblox_authorization_declined:
    "Roblox connection was cancelled. Your Nexora session remains active.",
  roblox_oauth_failed:
    "Roblox could not complete the secure connection. Please try again.",
  roblox_resource_access_failed:
    "Roblox did not return the approved group permissions.",
  roblox_permissions_required:
    "Approve all requested Roblox group permissions to manage ranks.",
  roblox_connection_save_failed:
    "Roblox connected, but Nexora could not save it securely.",
  manager_required: "Only owners and admins can change connections.",
  save_failed: "The connection could not be saved.",
};
const discordBotInvite =
  "https://discord.com/oauth2/authorize?client_id=1542533178554585099&permissions=581652858399894&integration_type=0&scope=bot%20applications.commands";
export default async function Connections({
  params,
  searchParams,
}: {
  params: Promise<{ workspaceId: string }>;
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const [{ workspaceId }, query] = await Promise.all([params, searchParams]);
  const { supabase, user, state } = await getWorkspaceControl(workspaceId);
  const w = state.workspace;
  const [{ data: roblox }, { data: extraGroups }] = await Promise.all([
    supabase
      .from("account_links")
      .select("provider_user_id, metadata")
      .eq("user_id", user.id)
      .eq("provider", "roblox")
      .maybeSingle(),
    supabase
      .from("workspace_roblox_groups")
      .select("*")
      .eq("workspace_id", state.workspace.id)
      .order("created_at"),
  ]);
  const groups = roblox
    ? await listRobloxGroups(roblox.provider_user_id)
    : null;
  const owned = groups?.ok
    ? groups.groups.filter((g) => g.roleRank === 255)
    : [];
  const connectedGroupIds = new Set([
    ...(w.roblox_group_id ? [w.roblox_group_id] : []),
    ...((extraGroups ?? []).map((group) => String(group.group_id))),
  ]);
  const availableAdditionalGroups = owned.filter(
    (group) => !connectedGroupIds.has(group.id),
  );
  const canManage = ["owner", "admin"].includes(w.role);
  const robloxEnabled =
    process.env.NEXT_PUBLIC_ROBLOX_OAUTH_ENABLED === "true";
  const robloxMetadata = roblox?.metadata as {
    open_cloud_ready?: boolean;
  } | null;
  const robloxReady = Boolean(roblox && robloxMetadata?.open_cloud_ready);
  return (
    <>
      <PageHeading
        eyebrow="Connections"
        title="Connect your community"
        description="Install the Discord bot, link it with a one-time code, and configure primary and division groups."
      />
      {query.error ? (
        <p className="mt-6 rounded-2xl border border-red-300/20 bg-red-300/8 p-4 text-sm text-red-100">
          {errors[query.error] || errors.save_failed}
        </p>
      ) : null}
      {query.saved ? (
        <p className="mt-6 rounded-2xl border border-emerald-300/20 bg-emerald-300/8 p-4 text-sm text-emerald-100">
          Connection updated.
        </p>
      ) : null}
      <div className="mt-8 grid gap-5 xl:grid-cols-2">
        <Connection icon={Bot} title="Discord server">
          <p className="text-sm leading-7 text-white/48">
            Add the bot, create a code here, type <code>/link</code> in your
            server, and paste the code into Discord&apos;s <b>code</b> field.
            Installation is separate from website sign-in.
          </p>
          <a
            href={discordBotInvite}
            target="_blank"
            rel="noreferrer"
            className="mt-5 flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#5865f2] px-5 text-sm font-bold"
          >
            Add Nexora to Discord <ExternalLink className="size-4" />
          </a>
          <Current
            label="Current server"
            name={w.discord_guild_name || "Not linked"}
            id={w.discord_guild_id}
          />
          {canManage && w.discord_guild_id ? (
            <Disconnect
              publicId={w.public_id}
              provider="discord"
              label="Disconnect Discord server"
            />
          ) : null}
          {canManage ? (
            <DiscordLinkCode
              publicId={w.public_id}
              disabled={w.operational_status !== "active"}
            />
          ) : null}
        </Connection>
        <Connection icon={Gamepad2} title="Primary Roblox group">
          <p className="text-sm leading-7 text-white/48">
            {robloxReady
              ? "Connected with secure group permissions. Only groups owned by this Roblox account are available."
              : robloxEnabled
                ? "Connect Roblox once to approve group access, ownership checks, and rank management."
                : "Roblox approval is pending. The connection button will activate as soon as the app is approved."}
          </p>
          {canManage && robloxEnabled && !robloxReady ? (
            <a
              href={`/auth/roblox/start?next=/dashboard/${w.public_id}/connections`}
              className="mt-5 flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-bold text-black"
            >
              {roblox ? "Reconnect Roblox permissions" : "Connect Roblox"}
              <ExternalLink className="size-4" />
            </a>
          ) : null}
          <form action={connectRobloxGroup} className="mt-5 space-y-3">
            <input type="hidden" name="public_id" value={w.public_id} />
            {robloxReady && owned.length ? (
              <select
                name="group_id"
                required
                defaultValue={w.roblox_group_id || ""}
                className="min-h-12 w-full rounded-xl border border-white/10 bg-[#0e0909] px-4"
              >
                <option value="" disabled>
                  Select a group you own
                </option>
                {owned.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name} · {g.id}
                  </option>
                ))}
              </select>
            ) : (
              <p className="rounded-xl border border-white/8 bg-black/20 px-4 py-3 text-sm text-white/50">
                {robloxReady
                  ? "This Roblox account does not own any groups."
                  : "Connect Roblox to load the groups you own."}
              </p>
            )}
            <button
              disabled={!canManage || !robloxReady || !owned.length}
              className="min-h-12 w-full rounded-xl bg-white px-5 text-sm font-bold text-black disabled:opacity-40"
            >
              Save primary group
            </button>
          </form>
          <Current
            label="Current group"
            name={w.roblox_group_name || "Not linked"}
            id={w.roblox_group_id}
          />
          {canManage && w.roblox_group_id ? (
            <Disconnect
              publicId={w.public_id}
              provider="roblox"
              label="Disconnect Roblox group"
            />
          ) : null}
        </Connection>
        <Connection icon={Gamepad2} title="Additional groups">
          <p className="text-sm leading-7 text-white/48">
            Choose another community owned by the connected Roblox account for
            a division, department, or training group.
          </p>
          {!robloxReady && canManage && robloxEnabled ? (
            <a
              href={`/auth/roblox/start?next=/dashboard/${w.public_id}/connections`}
              className="mt-5 flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-bold text-black"
            >
              {roblox ? "Reconnect Roblox permissions" : "Connect Roblox"}
              <ExternalLink className="size-4" />
            </a>
          ) : null}
          {robloxReady ? (
            <form action={addWorkspaceRobloxGroup} className="mt-5 grid gap-3">
              <input type="hidden" name="public_id" value={w.public_id} />
              {availableAdditionalGroups.length ? (
                <select
                  name="group_id"
                  required
                  defaultValue=""
                  className="min-h-12 rounded-xl border border-white/10 bg-[#0e0909] px-4"
                >
                  <option value="" disabled>
                    Select another group you own
                  </option>
                  {availableAdditionalGroups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name} · {group.id}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="rounded-xl border border-white/8 bg-black/20 px-4 py-3 text-sm text-white/50">
                  Every group owned by this account is already connected, or
                  this account does not own another group.
                </p>
              )}
              <select
                name="purpose"
                disabled={!availableAdditionalGroups.length}
                className="min-h-12 rounded-xl border border-white/10 bg-[#0e0909] px-4 disabled:opacity-40"
              >
                <option value="community">Community</option>
                <option value="department">Department</option>
                <option value="division">Division</option>
                <option value="training">Training</option>
              </select>
              <button
                disabled={!canManage || !availableAdditionalGroups.length}
                className="min-h-12 rounded-xl bg-white px-5 text-sm font-bold text-black disabled:opacity-40"
              >
                Add selected group
              </button>
            </form>
          ) : (
            <p className="mt-5 rounded-xl border border-white/8 bg-black/20 px-4 py-3 text-sm text-white/50">
              Connect Roblox first. Nexora will then load only the groups that
              account owns.
            </p>
          )}
          <div className="mt-5 space-y-3">
            {extraGroups?.map((group) => (
              <div
                key={group.id}
                className="rounded-2xl border border-white/8 bg-black/20 p-4"
              >
                <p className="font-bold">{group.group_name}</p>
                <p className="mt-1 text-xs text-white/40">
                  {group.group_id} · {group.purpose}
                </p>
                <form action={deleteRecord} className="mt-2">
                  <input type="hidden" name="public_id" value={w.public_id} />
                  <input type="hidden" name="path" value="connections" />
                  <input
                    type="hidden"
                    name="table"
                    value="workspace_roblox_groups"
                  />
                  <input type="hidden" name="id" value={group.id} />
                  <button className="text-sm text-red-200/70">Remove</button>
                </form>
              </div>
            ))}
          </div>
        </Connection>
      </div>
    </>
  );
}
function Connection({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Bot;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[28px] border border-white/10 bg-white/[.025] p-6 sm:p-8">
      <Icon className="workspace-accent size-6" />
      <h2 className="mt-6 text-2xl font-bold">{title}</h2>
      <div className="mt-2">{children}</div>
    </section>
  );
}
function Current({
  label,
  name,
  id,
}: {
  label: string;
  name: string;
  id: string | null;
}) {
  return (
    <div className="mt-4 rounded-2xl border border-white/8 bg-black/20 p-4">
      <p className="text-xs font-bold uppercase tracking-wider text-white/35">
        {label}
      </p>
      <p className="mt-2 font-bold">{name}</p>
      {id ? (
        <code className="mt-1 block text-xs text-white/35">{id}</code>
      ) : null}
    </div>
  );
}
function Disconnect({
  publicId,
  provider,
  label,
}: {
  publicId: string;
  provider: string;
  label: string;
}) {
  return (
    <form action={disconnectIntegration} className="mt-3">
      <input type="hidden" name="public_id" value={publicId} />
      <input type="hidden" name="provider" value={provider} />
      <button className="text-sm font-bold text-red-200/70">{label}</button>
    </form>
  );
}
