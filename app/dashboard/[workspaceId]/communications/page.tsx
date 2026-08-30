import {
  BellRing,
  Bold,
  Bot,
  MessagesSquare,
  Palette,
  Radio,
  Send,
  Sparkles,
} from "lucide-react";
import { PageHeading } from "@/components/workspace-shell";
import {
  Empty,
  DiscordChannelSelect,
  Input,
  Notice,
  Panel,
  Row,
  Select,
  Submit,
  Textarea,
} from "@/components/workspace-operations";
import { getWorkspaceControl } from "@/lib/workspace-control";
import { listDiscordWorkspaceResources } from "@/lib/discord-resources";
import {
  createAnnouncementTemplate,
  deleteRecord,
  saveCommunityMessaging,
  sendDiscordMessage,
} from "../actions";

export const dynamic = "force-dynamic";

export default async function Communications({
  params,
  searchParams,
}: {
  params: Promise<{ workspaceId: string }>;
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const [{ workspaceId }, q] = await Promise.all([params, searchParams]);
  const { supabase, state } = await getWorkspaceControl(workspaceId);
  const [{ data: templates }, { data: settings }, resources] = await Promise.all([
    supabase
      .from("announcement_templates")
      .select("*")
      .eq("workspace_id", state.workspace.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("workspace_settings")
      .select("*")
      .eq("workspace_id", state.workspace.id)
      .single(),
    listDiscordWorkspaceResources(state.workspace.discord_guild_id),
  ]);

  return (
    <>
      <PageHeading
        eyebrow="Communications"
        title="Command your community voice"
        description="Compose polished Discord messages, give the bot a recognizable server presence, and automate the moments your community remembers."
      />
      <Notice {...q} />

      <div className="mt-10">
        <Panel
          icon={Send}
          title="Discord message studio"
          description={
            state.workspace.discord_guild_id
              ? `Send through Nexora to a channel in ${state.workspace.discord_guild_name || "your connected Discord server"}.`
              : "Connect a Discord server before sending messages."
          }
        >
          <form action={sendDiscordMessage} className="grid gap-6">
            <input type="hidden" name="public_id" value={workspaceId} />
            <div className="grid gap-5 lg:grid-cols-[minmax(250px,.55fr)_1fr]">
              <DiscordChannelSelect
                label="Post in channel"
                name="channel_id"
                channels={resources.channels}
                required
              />
              <Textarea
                label="Message or embed description"
                name="message"
                maxLength={4000}
                placeholder="Write exactly what your community should see…"
                required
              />
            </div>

            <input
              id="use-embed"
              name="use_embed"
              type="checkbox"
              className="peer sr-only"
            />
            <label htmlFor="use-embed" className="message-mode-toggle">
              <span>
                <Sparkles />
                Embed
              </span>
              <span className="message-mode-switch" aria-hidden="true" />
            </label>

            <section className="hidden gap-6 border-t border-white/8 pt-6 peer-checked:grid">
              <div className="flex items-center gap-3">
                <span className="workspace-panel-icon">
                  <Palette />
                </span>
                <div>
                  <h3 className="text-lg font-extrabold">Embed design</h3>
                  <p className="mt-1 text-sm text-white/45">
                    Add hierarchy, color, and branded details without writing
                    Discord markdown.
                  </p>
                </div>
              </div>
              <div className="grid gap-5 lg:grid-cols-2">
                <Input
                  label="Large header"
                  name="embed_title"
                  maxLength={256}
                  placeholder="Community announcement"
                />
                <label className="block">
                  <span className="mb-2.5 block text-[15px] font-bold text-white/78">
                    Accent color
                  </span>
                  <span className="color-control">
                    <input
                      type="color"
                      name="embed_color"
                      defaultValue="#5865f2"
                    />
                    <b>Choose embed color</b>
                  </span>
                </label>
              </div>
              <label className="option-card">
                <input type="checkbox" name="bold_message" />
                <Bold />
                <span>
                  <b>Bold message body</b>
                  <small>
                    Emphasize the full description inside the embed.
                  </small>
                </span>
              </label>
              <div className="grid gap-5 lg:grid-cols-2">
                <Input
                  label="Author / brand name"
                  name="author_name"
                  maxLength={256}
                  placeholder="Nexora Operations"
                />
                <Input
                  label="Brand icon URL"
                  name="author_icon_url"
                  type="url"
                  placeholder="https://…/logo.png"
                />
                <Input
                  label="Thumbnail URL"
                  name="thumbnail_url"
                  type="url"
                  placeholder="https://…/image.png"
                />
                <Input
                  label="Footer text"
                  name="footer_text"
                  maxLength={2048}
                  placeholder="Nexora Rank · Community Operations"
                />
              </div>
            </section>

            <details className="branding-disclosure">
              <summary>
                <span>
                  <Bot />
                  Bot appearance for this server
                </span>
                <small>Optional</small>
              </summary>
              <div className="grid gap-5 border-t border-white/8 p-5 sm:p-6 lg:grid-cols-[1fr_auto] lg:items-end">
                <Input
                  label="Custom bot nickname"
                  name="bot_nickname"
                  maxLength={32}
                  placeholder="Nexora Announcements"
                />
                <label className="option-card min-h-14">
                  <input type="checkbox" name="update_bot_nickname" />
                  <Bot />
                  <span>
                    <b>Apply nickname</b>
                    <small>Requires Manage Nicknames.</small>
                  </span>
                </label>
              </div>
            </details>

            <div className="flex flex-col gap-4 border-t border-white/8 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <p className="max-w-2xl text-sm leading-6 text-white/42">
                The channel is verified against this workspace before sending.
                Mentions remain plain text to prevent accidental mass
                notifications.
              </p>
              <Submit>Send through Nexora</Submit>
            </div>
          </form>
        </Panel>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Panel
          icon={Radio}
          title="Announcement library"
          description="Prepare reusable training, shift, event, milestone, welcome, goodbye, and Roblox shout copy."
        >
          <form action={createAnnouncementTemplate} className="grid gap-5">
            <input type="hidden" name="public_id" value={workspaceId} />
            <Input label="Template name" name="name" required />
            <Select label="Type" name="announcement_type">
              <option value="training">Training</option>
              <option value="shift">Shift</option>
              <option value="event">Event</option>
              <option value="milestone">Milestone</option>
              <option value="welcome">Welcome</option>
              <option value="goodbye">Goodbye</option>
              <option value="shout">Roblox shout</option>
            </Select>
            <Input label="Title" name="title_template" required />
            <Textarea label="Message" name="body_template" required />
            <DiscordChannelSelect label="Default posting channel" name="discord_channel_id" channels={resources.channels} />
            <div>
              <Submit>Save template</Submit>
            </div>
          </form>
        </Panel>
        <Panel
          icon={MessagesSquare}
          title="Automated community messaging"
          description="Use {user}, {server}, and {memberCount} to personalize lifecycle messages."
        >
          <form action={saveCommunityMessaging} className="grid gap-5">
            <input type="hidden" name="public_id" value={workspaceId} />
            <Toggle
              name="welcome_enabled"
              label="Welcome messages"
              checked={settings?.welcome_enabled}
            />
            <DiscordChannelSelect
              label="Welcome channel"
              name="welcome_channel_id"
              channels={resources.channels}
              defaultValue={settings?.welcome_channel_id || ""}
            />
            <Textarea
              label="Welcome message"
              name="welcome_message"
              defaultValue={
                settings?.welcome_message ||
                "Welcome {user} to {server}! You are member #{memberCount}."
              }
            />
            <Toggle
              name="goodbye_enabled"
              label="Goodbye messages"
              checked={settings?.goodbye_enabled}
            />
            <DiscordChannelSelect
              label="Goodbye channel"
              name="goodbye_channel_id"
              channels={resources.channels}
              defaultValue={settings?.goodbye_channel_id || ""}
            />
            <Textarea
              label="Goodbye message"
              name="goodbye_message"
              defaultValue={
                settings?.goodbye_message ||
                "Goodbye {user}. Thanks for being part of {server}."
              }
            />
            <Toggle
              name="role_sync_enabled"
              label="Automatic Discord role sync"
              checked={settings?.role_sync_enabled}
            />
            <Toggle
              name="nickname_sync_enabled"
              label="Automatic nickname sync"
              checked={settings?.nickname_sync_enabled}
            />
            <Toggle
              name="verification_dm_enabled"
              label="Verification confirmation DM"
              checked={settings?.verification_dm_enabled}
            />
            <DiscordChannelSelect
              label="Live member-count channel"
              name="member_count_channel_id"
              channels={resources.allChannels}
              defaultValue={settings?.member_count_channel_id || ""}
            />
            <div>
              <Submit>Save messaging</Submit>
            </div>
          </form>
        </Panel>
      </div>

      <div className="mt-6">
        <Panel
          icon={BellRing}
          title="Saved templates"
          description="Reusable copy for Discord and cross-platform workflows."
        >
          {templates?.length ? (
            templates.map((template) => (
              <Row
                key={template.id}
                title={template.name}
                subtitle={template.body_template.slice(0, 150)}
                meta={template.announcement_type}
                action={
                  <form action={deleteRecord}>
                    <input type="hidden" name="public_id" value={workspaceId} />
                    <input type="hidden" name="path" value="communications" />
                    <input
                      type="hidden"
                      name="table"
                      value="announcement_templates"
                    />
                    <input type="hidden" name="id" value={template.id} />
                    <button className="text-sm text-red-200/70">Remove</button>
                  </form>
                }
              />
            ))
          ) : (
            <Empty>No announcement templates yet.</Empty>
          )}
        </Panel>
      </div>
    </>
  );
}

function Toggle({
  name,
  label,
  checked,
}: {
  name: string;
  label: string;
  checked?: boolean;
}) {
  return (
    <label className="option-card">
      <input type="checkbox" name={name} defaultChecked={checked} />
      <MessagesSquare />
      <span>
        <b>{label}</b>
        <small>Enable this behavior for the connected Discord server.</small>
      </span>
    </label>
  );
}
