import type { LucideIcon } from "lucide-react";
import type {
  DiscordChannelOption,
  DiscordRoleOption,
} from "@/lib/discord-resources";

export function Panel({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="workspace-panel">
      <span className="workspace-panel-icon">
        <Icon />
      </span>
      <h2 className="mt-6 text-[1.75rem] font-extrabold tracking-[-.025em]">
        {title}
      </h2>
      <p className="mt-2 max-w-3xl text-[16px] leading-7 text-white/68">
        {description}
      </p>
      <div className="mt-7">{children}</div>
    </section>
  );
}
export function Input({
  label,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="block">
      <span className="mb-2.5 block text-[15px] font-bold text-white/78">
        {label}
      </span>
      <input
        {...props}
        className="workspace-field min-h-14 w-full px-4 text-base"
      />
    </label>
  );
}
export function Select({
  label,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & { label: string }) {
  return (
    <label className="block">
      <span className="mb-2.5 block text-[15px] font-bold text-white/78">
        {label}
      </span>
      <select
        {...props}
        className="workspace-field min-h-14 w-full bg-[#0b0808] px-4 text-base"
      >
        {children}
      </select>
    </label>
  );
}
export function DiscordChannelSelect({
  label,
  name,
  channels,
  defaultValue = "",
  required = false,
  allowEmpty = true,
}: {
  label: string;
  name: string;
  channels: DiscordChannelOption[];
  defaultValue?: string;
  required?: boolean;
  allowEmpty?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-2.5 block text-[15px] font-bold text-white/78">
        {label}
      </span>
      <select
        name={name}
        defaultValue={defaultValue}
        required={required}
        className="workspace-field min-h-14 w-full bg-[#0b0808] px-4 text-base"
      >
        <option value="">
          {channels.length
            ? allowEmpty
              ? "No channel selected"
              : "Choose a Discord channel"
            : "No available channels — connect Discord first"}
        </option>
        {channels.map((channel) => (
          <option key={channel.id} value={channel.id}>
            #{channel.name}
          </option>
        ))}
      </select>
      <small className="mt-2 block text-[13px] leading-5 text-white/48">
        Loaded securely from the Discord server linked to this workspace.
      </small>
    </label>
  );
}
export function DiscordRoleSelect({
  label,
  name,
  roles,
  defaultValue = "",
  required = false,
}: {
  label: string;
  name: string;
  roles: DiscordRoleOption[];
  defaultValue?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-2.5 block text-[15px] font-bold text-white/78">
        {label}
      </span>
      <select
        name={name}
        defaultValue={defaultValue}
        required={required}
        className="workspace-field min-h-14 w-full bg-[#0b0808] px-4 text-base"
      >
        <option value="">
          {roles.length
            ? "No Discord role selected"
            : "No available roles — connect Discord first"}
        </option>
        {roles.map((role) => (
          <option key={role.id} value={role.id}>
            @{role.name}
          </option>
        ))}
      </select>
      <small className="mt-2 block text-[13px] leading-5 text-white/48">
        Loaded from the connected server. Managed bot roles are hidden.
      </small>
    </label>
  );
}
export function Textarea({
  label,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }) {
  return (
    <label className="block">
      <span className="mb-2.5 block text-[15px] font-bold text-white/78">
        {label}
      </span>
      <textarea
        {...props}
        className="workspace-field min-h-36 w-full resize-y p-4 text-base leading-7"
      />
    </label>
  );
}
export function Submit({
  children,
  danger = false,
}: {
  children: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <button
      className={`inline-flex min-h-14 items-center justify-center rounded-xl px-6 text-[15px] font-extrabold transition active:scale-[.98] ${danger ? "border border-red-300/20 bg-red-300/10 text-red-100" : "workspace-theme-button text-[#050303]"}`}
    >
      {children}
    </button>
  );
}
const savedMessages: Record<string, string> = {
  discord_message: "Message sent to Discord successfully.",
  application_announced:
    "The Nexora bot announced this application successfully.",
};
const errorMessages: Record<string, string> = {
  discord_channel_invalid: "Enter a valid Discord channel ID.",
  discord_message_invalid: "Enter a message within Discord's length limit.",
  discord_embed_invalid:
    "Check the embed title, color, footer, and image URLs.",
  discord_branding_invalid: "The bot nickname must be 32 characters or fewer.",
  discord_send_forbidden:
    "Only workspace operators, admins, and owners can send Discord messages.",
  workspace_restricted:
    "Messaging is disabled while this workspace is restricted.",
  discord_not_connected: "Connect this workspace to a Discord server first.",
  bot_not_configured:
    "The Nexora bot is not configured for dashboard messaging.",
  discord_channel_not_found:
    "The bot cannot find that channel. Check the ID and its channel access.",
  discord_channel_wrong_server:
    "That channel does not belong to this workspace's connected Discord server.",
  discord_channel_unsupported:
    "Choose a Discord text, announcement, or thread channel.",
  discord_permission_missing:
    "The bot needs View Channel and Send Messages permission in that channel.",
  discord_branding_permission_missing:
    "Give the bot Manage Nicknames permission to apply a custom server nickname.",
  discord_unavailable: "Discord is temporarily unavailable. Please try again.",
  discord_send_failed:
    "Discord rejected the message. Check the channel and bot permissions.",
  application_invalid:
    "Complete the form, choose a real Discord role, and add at least one valid question.",
  application_manage_forbidden:
    "Only workspace owners and admins can manage application forms.",
  application_review_forbidden:
    "You do not have permission to review applications.",
  application_not_open: "Open the application before announcing it.",
  application_already_reviewed: "That submission has already been reviewed.",
};
export function Notice({ saved, error }: { saved?: string; error?: string }) {
  return (
    <>
      {saved ? (
        <p className="mt-6 rounded-2xl border border-emerald-300/20 bg-emerald-300/8 p-4 text-sm text-emerald-100">
          {savedMessages[saved] || "Changes saved successfully."}
        </p>
      ) : null}
      {error ? (
        <p className="mt-6 rounded-2xl border border-red-300/20 bg-red-300/8 p-4 text-sm text-red-100">
          {errorMessages[error] ||
            "That change could not be saved. Check the values and your permission."}
        </p>
      ) : null}
    </>
  );
}
export function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-white/14 bg-black/15 p-10 text-center text-[16px] leading-7 text-white/65">
      {children}
    </div>
  );
}
export function Row({
  title,
  subtitle,
  meta,
  action,
}: {
  title: string;
  subtitle?: string | null;
  meta?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 border-b border-white/7 py-6 last:border-0 sm:flex-row sm:items-center">
      <div className="min-w-0">
        <p className="text-[16px] font-bold">{title}</p>
        {subtitle ? (
          <p className="mt-1.5 text-[15px] leading-6 text-white/65">
            {subtitle}
          </p>
        ) : null}
      </div>
      {meta ? (
        <span className="rounded-full border border-white/10 bg-white/[.035] px-3 py-1.5 text-[13px] font-bold text-white/75 sm:ml-auto">
          {meta}
        </span>
      ) : null}
      {action}
    </div>
  );
}
