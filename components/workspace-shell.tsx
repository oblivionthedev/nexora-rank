import type { CSSProperties } from "react";
import Link from "next/link";
import { Award, Ban, CalendarRange, ChevronRight, Files, Gauge, Library, LockKeyhole, LogOut, Megaphone, PlugZap, ScrollText, ShieldCheck, SlidersHorizontal, Timer, Users, Workflow } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { RestrictedRouteSync } from "@/components/restricted-route-sync";
import { signOut } from "@/app/dashboard/actions";

const items = [
  { label: "Overview", path: "", icon: Gauge },
  { label: "Connections", path: "/connections", icon: PlugZap },
  { label: "Ranking", path: "/ranking", icon: Award },
  { label: "Activity & quotas", path: "/activity", icon: Timer },
  { label: "Applications", path: "/applications", icon: Files },
  { label: "Automations", path: "/automations", icon: Workflow },
  { label: "Operations", path: "/operations", icon: CalendarRange },
  { label: "Communications", path: "/communications", icon: Megaphone },
  { label: "Knowledge", path: "/knowledge", icon: Library },
  { label: "Members", path: "/members", icon: Users },
  { label: "Logs", path: "/logs", icon: ScrollText },
  { label: "Settings & API", path: "/settings", icon: SlidersHorizontal },
];

type Workspace = {
  public_id: string; name: string; operational_status: string; role: string;
  moderation_status: string; moderation_reason: string | null; moderation_expires_at: string | null;
  appeal_allowed: boolean; appeal_note: string | null;
};
type ThemeSettings = { theme_mode?: "solid" | "gradient"; theme_color_start?: string; theme_color_end?: string };

export function WorkspaceShell({ workspace, settings, children }: { workspace: Workspace; settings: ThemeSettings; children: React.ReactNode }) {
  const start = validColor(settings.theme_color_start) ? settings.theme_color_start! : "#d79a9a";
  const end = validColor(settings.theme_color_end) ? settings.theme_color_end! : "#b76e79";
  const gradient = settings.theme_mode === "solid" ? start : `linear-gradient(120deg, ${start}, ${end})`;
  const themeStyle = { "--workspace-accent": start, "--workspace-accent-end": end, "--workspace-gradient": gradient } as CSSProperties;

  if (workspace.operational_status !== "active") return <>{workspace.moderation_status === "banned" ? <RestrictedRouteSync canonicalPath={`/dashboard/${workspace.public_id}/not-approved`} /> : null}<WorkspaceLocked workspace={workspace} style={themeStyle} /></>;

  const base = `/dashboard/${workspace.public_id}`;
  return <div style={themeStyle} className="workspace-theme min-h-screen bg-[#050303] text-white lg:grid lg:grid-cols-[294px_minmax(0,1fr)]">
    <aside className="workspace-sidebar border-b border-white/8 p-5 sm:p-6 lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:border-r">
      <Link href="/" className="flex items-center gap-3.5 text-lg font-extrabold tracking-[-.02em]"><BrandMark />Nexora Rank</Link>
      <div className="workspace-theme-bar mt-7 h-[2px]" />
      <div className="workspace-identity mt-5"><span className="workspace-identity-mark">{workspace.name.slice(0,2).toUpperCase()}</span><div className="min-w-0"><p className="text-[12px] font-bold uppercase tracking-[.14em] text-white/42">Current workspace</p><p className="mt-1.5 truncate text-[17px] font-extrabold">{workspace.name}</p><code className="workspace-accent mt-1.5 block text-xs">{workspace.public_id}</code></div></div>
      <nav className="mt-6 flex gap-2 overflow-x-auto pb-2 lg:block lg:space-y-1.5" aria-label="Workspace navigation">{items.map((item)=><Link key={item.label} href={`${base}${item.path}`} className="workspace-nav-link"><span className="workspace-nav-icon"><item.icon /></span><span>{item.label}</span><ChevronRight className="ml-auto hidden size-4 opacity-30 lg:block" /></Link>)}</nav>
      <div className="mt-7 hidden border-t border-white/8 pt-5 text-[13px] leading-6 text-white/48 lg:block"><ShieldCheck className="workspace-accent mb-3 size-5" />Signed in as <b className="text-white/75">{workspace.role}</b>.<br/>Sensitive actions are protected.</div>
    </aside>
    <div className="min-w-0"><header className="workspace-topbar flex min-h-[76px] items-center border-b border-white/8 px-5 sm:px-10"><div className="flex items-center gap-3 text-[14px]"><span className="workspace-online-dot" /><span className="text-white/50">Status</span><b>Workspace online</b></div><form action={signOut} className="ml-auto"><button type="submit" className="flex min-h-11 items-center gap-2 rounded-xl border border-white/10 bg-white/[.025] px-4 text-sm font-bold text-white/65 transition hover:bg-white/[.06] hover:text-white"><LogOut className="size-4" />Sign out</button></form></header><main className="mx-auto max-w-[1440px] px-5 py-10 sm:px-10 sm:py-14">{children}</main></div>
  </div>;
}

function WorkspaceLocked({ workspace, style }: { workspace: Workspace; style: CSSProperties }) {
  const banned = workspace.moderation_status === "banned";
  return <main style={style} className="workspace-theme fixed inset-0 z-[9999] flex min-h-svh overflow-y-auto bg-[#050303] px-5 py-10 text-white">
    <div className="m-auto w-full max-w-2xl">
      <div className="workspace-theme-bar h-1 rounded-t-[32px]" />
      <section className="rounded-b-[32px] border border-t-0 border-white/10 bg-[#0b0707] p-7 text-center shadow-2xl sm:p-12">
        <div className={`mx-auto flex size-16 items-center justify-center rounded-2xl border ${banned ? "border-red-300/25 bg-red-300/8 text-red-200" : "border-amber-300/25 bg-amber-300/8 text-amber-100"}`}>{banned ? <Ban className="size-7" /> : <LockKeyhole className="size-7" />}</div>
        <p className="workspace-accent mt-7 text-xs font-bold uppercase tracking-[.18em]">Nexora workspace restricted</p>
        <h1 className="mt-3 text-4xl font-extrabold tracking-[-.04em] sm:text-5xl">Workspace {banned ? "banned" : "suspended"}</h1>
        <p className="mx-auto mt-5 max-w-xl text-base leading-8 text-white/58">{workspace.moderation_reason || "This workspace has been restricted by Nexora."}</p>
        <div className="mt-7 grid gap-3 text-left sm:grid-cols-2">
          <LockDetail label="Workspace" value={`${workspace.name} · ${workspace.public_id}`} />
          <LockDetail label={banned ? "Duration" : "Scheduled end"} value={banned ? "Permanent" : workspace.moderation_expires_at ? formatDate(workspace.moderation_expires_at) : "No automatic end date"} />
        </div>
        <div className="mt-4 rounded-2xl border border-white/8 bg-black/25 p-5 text-left"><p className="text-xs font-bold uppercase tracking-wider text-white/35">Appeal</p><p className="mt-2 text-sm leading-7 text-white/58">{workspace.appeal_allowed ? workspace.appeal_note || "You may appeal this action through the Nexora Discord server." : "This action is not eligible for appeal."}</p></div>
        <p className="mt-6 text-sm leading-7 text-white/40">Dashboard controls, Discord bot actions, API keys, and in-game requests are disabled until this restriction is removed.</p>
        <form action={signOut} className="mt-7"><button type="submit" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-6 text-sm font-bold text-black"><LogOut className="size-4" />Sign out</button></form>
      </section>
    </div>
  </main>;
}

function LockDetail({ label, value }: { label: string; value: string }) { return <div className="rounded-2xl border border-white/8 bg-black/25 p-4"><p className="text-xs font-bold uppercase tracking-wider text-white/35">{label}</p><p className="mt-2 text-sm font-semibold leading-6 text-white/78">{value}</p></div>; }
function formatDate(value: string) { return new Date(value).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" }) + " UTC"; }
function validColor(value?: string) { return Boolean(value && /^#[0-9a-f]{6}$/i.test(value)); }

export function PageHeading({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: React.ReactNode }) { return <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between"><div><p className="workspace-accent text-[13px] font-extrabold uppercase tracking-[.16em]">{eyebrow}</p><h1 className="mt-4 max-w-4xl text-[clamp(2.8rem,5vw,4.8rem)] font-black leading-[.94] tracking-[-.055em]">{title}</h1><p className="mt-5 max-w-3xl text-[17px] leading-8 text-white/58">{description}</p></div>{action}</div>; }
