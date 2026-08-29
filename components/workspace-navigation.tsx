"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Award, CalendarRange, ChevronRight, Files, Gauge, Library, Megaphone, PlugZap, ScrollText, SlidersHorizontal, Timer, Users, Workflow } from "lucide-react";

const groups = [
  { label: "Workspace", items: [{ label: "Overview", path: "", icon: Gauge }, { label: "Connections", path: "/connections", icon: PlugZap }] },
  { label: "Operate", items: [{ label: "Ranking", path: "/ranking", icon: Award }, { label: "Activity & quotas", path: "/activity", icon: Timer }, { label: "Applications", path: "/applications", icon: Files }, { label: "Automations", path: "/automations", icon: Workflow }, { label: "Operations", path: "/operations", icon: CalendarRange }, { label: "Communications", path: "/communications", icon: Megaphone }] },
  { label: "Manage", items: [{ label: "Knowledge", path: "/knowledge", icon: Library }, { label: "Members", path: "/members", icon: Users }, { label: "Logs", path: "/logs", icon: ScrollText }, { label: "Settings & API", path: "/settings", icon: SlidersHorizontal }] },
];

export function WorkspaceNavigation({ base }: { base: string }) {
  const pathname = usePathname();
  return <nav className="workspace-navigation" aria-label="Workspace navigation">{groups.map(group => <div className="workspace-nav-group" key={group.label}><p>{group.label}</p><div>{group.items.map(item => { const href = `${base}${item.path}`; const active = item.path ? pathname === href || pathname.startsWith(`${href}/`) : pathname === base; return <Link key={item.label} href={href} className={`workspace-nav-link ${active ? "active" : ""}`} aria-current={active ? "page" : undefined}><span className="workspace-nav-icon"><item.icon /></span><span>{item.label}</span><ChevronRight className="ml-auto hidden size-4 opacity-30 lg:block" /></Link>; })}</div></div>)}</nav>;
}
