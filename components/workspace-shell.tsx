import Link from "next/link";
import { Bot, ChevronRight, FileClock, Gauge, LogOut, Settings, ShieldCheck, UsersRound } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { signOut } from "@/app/dashboard/actions";

const items = [
  { label: "Overview", path: "", icon: Gauge },
  { label: "Connections", path: "/connections", icon: Bot },
  { label: "Members", path: "/members", icon: UsersRound },
  { label: "Logs", path: "/logs", icon: FileClock },
  { label: "Settings & API", path: "/settings", icon: Settings },
];

export function WorkspaceShell({ workspace, children }: { workspace: { public_id: string; name: string; operational_status: string; role: string }; children: React.ReactNode }) {
  const base = `/dashboard/${workspace.public_id}`;
  return <div className="min-h-screen bg-[#080806] text-white lg:grid lg:grid-cols-[270px_minmax(0,1fr)]">
    <aside className="border-b border-white/8 bg-[#0b0a08] p-5 lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:border-r">
      <Link href="/" className="flex items-center gap-3 text-base font-bold"><BrandMark compact />Nexora Rank</Link>
      <div className="mt-7 rounded-[22px] border border-white/10 bg-white/[.035] p-4"><p className="text-[11px] font-bold uppercase tracking-[.15em] text-white/38">Workspace</p><p className="mt-2 truncate text-base font-bold">{workspace.name}</p><code className="mt-2 block text-xs text-[#e8c489]">{workspace.public_id}</code></div>
      <nav className="mt-5 flex gap-2 overflow-x-auto pb-1 lg:block lg:space-y-1" aria-label="Workspace navigation">{items.map((item)=><Link key={item.label} href={`${base}${item.path}`} className="flex min-h-12 flex-none items-center gap-3 rounded-xl px-4 text-sm font-semibold text-white/58 transition hover:bg-white/6 hover:text-white lg:w-full"><item.icon className="size-4" />{item.label}<ChevronRight className="ml-auto hidden size-3.5 lg:block" /></Link>)}</nav>
      <div className="mt-6 hidden rounded-2xl border border-white/7 bg-black/20 p-4 text-xs leading-6 text-white/42 lg:block"><ShieldCheck className="mb-3 size-5 text-[#e8c489]" />Signed in as <b className="text-white/70">{workspace.role}</b>. Workspace changes are recorded.</div>
    </aside>
    <div className="min-w-0"><header className="flex min-h-16 items-center border-b border-white/8 px-5 sm:px-8"><div className="flex items-center gap-2 text-sm"><span className={`size-2 rounded-full ${workspace.operational_status === "active" ? "bg-emerald-400" : "bg-red-400"}`} /><b>{workspace.operational_status === "active" ? "Workspace online" : "Workspace restricted"}</b></div><form action={signOut} className="ml-auto"><button type="submit" className="flex items-center gap-2 rounded-full border border-white/9 px-4 py-2 text-sm text-white/60 hover:text-white"><LogOut className="size-4" />Sign out</button></form></header><main className="mx-auto max-w-[1380px] px-5 py-8 sm:px-8 sm:py-12">{children}</main></div>
  </div>;
}

export function PageHeading({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: React.ReactNode }) { return <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-[.17em] text-[#d7aa67]">{eyebrow}</p><h1 className="mt-3 text-4xl font-extrabold tracking-[-.04em] sm:text-5xl">{title}</h1><p className="mt-3 max-w-2xl text-base leading-7 text-white/52">{description}</p></div>{action}</div>; }
