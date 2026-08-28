import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  Bot,
  Check,
  CircleAlert,
  Clock3,
  Gamepad2,
  Link2,
  LockKeyhole,
  ShieldCheck,
  Unplug,
} from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { Button } from "@/components/ui/button";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { disconnectConnection, saveConnection } from "./actions";

export const dynamic = "force-dynamic";

const errors: Record<string, string> = {
  invalid_id: "Enter a valid numeric Discord server ID or Roblox group ID.",
  identity_required: "Connect that identity to your Nexora account before linking its community.",
  already_claimed: "That server or group is already connected to another Nexora workspace.",
  manager_required: "Only workspace owners and admins can change integrations.",
  save_failed: "The connection could not be saved. Please try again.",
};

export default async function ConnectionsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string; removed?: string }>;
}) {
  if (!isSupabaseConfigured()) redirect("/login?error=oauth_not_ready");
  const supabase = await createClient();
  const [{ data: { user } }, params] = await Promise.all([
    supabase.auth.getUser(),
    searchParams,
  ]);
  if (!user) redirect("/login?next=/dashboard/connections");

  const { data: membership } = await supabase
    .from("workspace_members")
    .select("workspace_id, role")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();
  if (!membership) redirect("/onboarding");

  const [{ data: workspace }, { data: integrations }, { data: identities }] = await Promise.all([
    supabase
      .from("workspaces")
      .select("name, public_id, discord_guild_id, roblox_group_id")
      .eq("id", membership.workspace_id)
      .single(),
    supabase
      .from("integrations")
      .select("provider, external_id, status, updated_at")
      .eq("workspace_id", membership.workspace_id),
    supabase.from("account_links").select("provider, username, display_name").eq("user_id", user.id),
  ]);
  if (!workspace) redirect("/dashboard");

  const integrationMap = new Map((integrations ?? []).map((item) => [item.provider, item]));
  const identityMap = new Map((identities ?? []).map((item) => [item.provider, item]));
  const canManage = ["owner", "admin"].includes(membership.role);

  return (
    <main className="min-h-screen bg-[#0a0908] px-4 pb-20 text-white sm:px-7">
      <header className="mx-auto flex h-20 max-w-6xl items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 text-sm font-bold">
          <BrandMark compact />
          <span>Nexora Rank</span>
        </Link>
        <Link href="/dashboard" className="pill pill-ghost">
          <ArrowLeft className="size-3.5" /> Dashboard
        </Link>
      </header>

      <div className="mx-auto max-w-6xl">
        <section className="stage">
          <div className="stage-field" aria-hidden="true" />
          <div className="stage-inner glass-strong p-6 sm:p-9">
            <span className="chip" data-tone="live"><Link2 className="size-3" /> Workspace connections</span>
            <h1 className="mt-5 max-w-3xl font-display text-4xl font-extrabold tracking-[-.045em] sm:text-6xl">
              Connect the community behind {workspace.name}.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-white/50">
              Add the Discord server and Roblox group that belong to this workspace. Nexora records
              the IDs now and keeps ranking locked until bot and Open Cloud access are verified.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <span className="glass-faint px-3 py-2 font-mono text-[11px] text-[#e8c489]">{workspace.public_id}</span>
              <span className="glass-faint px-3 py-2 text-[11px] text-white/45 capitalize">{membership.role} access</span>
            </div>
          </div>
        </section>

        {params.error ? (
          <div className="mt-4 flex items-start gap-3 rounded-xl border border-red-400/15 bg-red-400/[.05] p-4 text-sm text-red-200/75">
            <CircleAlert className="mt-0.5 size-4 shrink-0" />
            {errors[params.error] ?? errors.save_failed}
          </div>
        ) : null}
        {params.saved ? (
          <div className="mt-4 flex items-center gap-3 rounded-xl border border-emerald-400/15 bg-emerald-400/[.05] p-4 text-sm text-emerald-200/75">
            <Check className="size-4" />
            {params.saved === "roblox" ? "Roblox group" : "Discord server"} saved and queued for verification.
          </div>
        ) : null}

        <section className="mt-4 grid gap-4 lg:grid-cols-2">
          <ConnectionCard
            provider="discord"
            icon={Bot}
            title="Discord server"
            description="Used for bot commands, staff permissions, role mappings, applications, and notifications."
            identity={identityMap.get("discord")?.display_name ?? identityMap.get("discord")?.username}
            externalId={workspace.discord_guild_id}
            status={integrationMap.get("discord")?.status}
            canManage={canManage}
          />
          <ConnectionCard
            provider="roblox"
            icon={Gamepad2}
            title="Roblox group"
            description="Used for role discovery, ranking requests, activity records, and secure in-game API access."
            identity={identityMap.get("roblox")?.display_name ?? identityMap.get("roblox")?.username}
            externalId={workspace.roblox_group_id}
            status={integrationMap.get("roblox")?.status}
            canManage={canManage}
          />
        </section>

        <section className="glass mt-4 grid gap-5 p-6 sm:grid-cols-3 sm:p-7">
          <TrustItem icon={LockKeyhole} title="No Roblox cookies" text="Only official OAuth and scoped Open Cloud authorization are supported." />
          <TrustItem icon={ShieldCheck} title="Manager protected" text="Only owners and admins can change workspace integrations." />
          <TrustItem icon={Clock3} title="Verification state" text="Connections remain pending until Nexora confirms external access." />
        </section>
      </div>
    </main>
  );
}

function ConnectionCard({
  provider,
  icon: Icon,
  title,
  description,
  identity,
  externalId,
  status,
  canManage,
}: {
  provider: "discord" | "roblox";
  icon: typeof Bot;
  title: string;
  description: string;
  identity?: string | null;
  externalId?: string | null;
  status?: string | null;
  canManage: boolean;
}) {
  const connected = status === "connected";
  return (
    <article className="glass p-6 sm:p-7">
      <div className="flex items-start gap-4">
        <span className="stat-icon !size-11"><Icon className="size-5" /></span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-display text-lg font-extrabold">{title}</h2>
            <span className="chip" data-tone={connected ? "live" : undefined}>
              {connected ? "Connected" : externalId ? "Pending" : "Not linked"}
            </span>
          </div>
          <p className="mt-2 text-xs leading-6 text-white/43">{description}</p>
        </div>
      </div>

      <div className="glass-faint mt-5 p-4">
        <p className="microlabel">Account identity</p>
        <p className="mt-2 text-sm font-semibold text-white/80">{identity ?? "Not connected"}</p>
        {!identity ? <Link href="/onboarding?manage=identities" className="mt-2 inline-block text-xs text-[#dda451]">Connect identity first →</Link> : null}
      </div>

      <form action={saveConnection} className="mt-4 space-y-3">
        <input type="hidden" name="provider" value={provider} />
        <label className="block">
          <span className="microlabel">{provider === "discord" ? "Server ID" : "Group ID"}</span>
          <input
            name="external_id"
            inputMode="numeric"
            pattern="[0-9]{5,22}"
            required
            defaultValue={externalId ?? ""}
            disabled={!canManage || !identity}
            placeholder={provider === "discord" ? "123456789012345678" : "12345678"}
            className="mt-2 h-12 w-full rounded-xl border border-white/10 bg-black/20 px-4 font-mono text-sm text-white outline-none transition focus:border-[#c98b2e]/50"
          />
        </label>
        <Button type="submit" disabled={!canManage || !identity} className="button-glow h-11 w-full rounded-xl">
          {externalId ? "Update connection" : "Save connection"}
        </Button>
      </form>

      {externalId && canManage ? (
        <form action={disconnectConnection} className="mt-2">
          <input type="hidden" name="provider" value={provider} />
          <button type="submit" className="flex w-full items-center justify-center gap-2 py-2 text-xs text-white/35 transition hover:text-red-300">
            <Unplug className="size-3.5" /> Remove connection
          </button>
        </form>
      ) : null}
    </article>
  );
}

function TrustItem({ icon: Icon, title, text }: { icon: typeof ShieldCheck; title: string; text: string }) {
  return <div className="flex gap-3"><span className="stat-icon"><Icon className="size-4" /></span><div><b className="text-sm">{title}</b><p className="mt-1 text-xs leading-5 text-white/38">{text}</p></div></div>;
}
