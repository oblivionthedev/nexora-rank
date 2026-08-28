import type { Metadata } from "next";
import Link from "next/link";
import { Activity, ArrowUpRight, Clock3, RefreshCw, ShieldCheck } from "lucide-react";
import { SiteNav } from "@/components/site-nav";
import { getServiceHealth, getStatusHistory, type HealthState, type ServiceHealth, type StatusSnapshot } from "@/lib/service-status";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "System Status", description: "Live and historical operational status for Nexora Rank.", alternates: { canonical: "/status" } };
const stateCopy: Record<HealthState, string> = { operational: "Operational", degraded: "Degraded", outage: "Outage", unknown: "Checking" };

export default async function StatusPage() {
  const [{ services, checkedAt }, history] = await Promise.all([getServiceHealth(), getStatusHistory()]);
  const overall: HealthState = services.some((service) => service.state === "outage") ? "outage" : services.some((service) => service.state !== "operational") ? "degraded" : "operational";
  return <main className="status-page site-shell island-clearance"><SiteNav active="/status" /><section className="status-frame below-island">
    <header className="status-hero"><div><span className="section-kicker"><Activity /> Live operations</span><h1>System status,<br /><span>day by day.</span></h1><p>Current checks plus an honest 90-day history. Gray days mean no stored measurement—not fabricated uptime.</p></div><div className={`status-overall ${overall}`}><span className="status-live-dot" /><div><span>Current status</span><strong>{overall === "operational" ? "All systems operational" : overall === "outage" ? "Service interruption" : "Some systems need attention"}</strong></div></div></header>
    <div className="status-toolbar"><p><Clock3 /> Checked <time dateTime={checkedAt}>{new Date(checkedAt).toLocaleString("en-GB", { timeZone: "Europe/Belgrade", dateStyle: "medium", timeStyle: "short" })} CET</time></p><form action="/status"><button type="submit"><RefreshCw /> Refresh status</button></form></div>
    <section className="status-history" aria-label="90-day service history">{services.map((service) => <StatusRow key={service.key} service={service} history={history} checkedAt={checkedAt} />)}</section>
    <footer className="status-note"><div><ShieldCheck /><div><b>Transparent by default</b><span>Today is checked live. A daily verified snapshot builds the historical record without pretending unknown days were operational.</span></div></div><Link href="/security">Security center <ArrowUpRight /></Link></footer>
  </section></main>;
}

function StatusRow({ service, history, checkedAt }: { service: ServiceHealth; history: StatusSnapshot[]; checkedAt: string }) {
  const currentDate = checkedAt.slice(0, 10);
  const byDate = new Map(history.filter((item) => item.service_key === service.key).map((item) => [item.checked_on, item.state]));
  byDate.set(currentDate, service.state);
  const days = Array.from({ length: 90 }, (_, index) => { const date = new Date(`${currentDate}T00:00:00Z`); date.setUTCDate(date.getUTCDate() - (89 - index)); const key = date.toISOString().slice(0, 10); return { date: key, state: (byDate.get(key) ?? "unknown") as HealthState }; });
  const known = days.filter((day) => day.state !== "unknown");
  const uptime = known.length ? known.filter((day) => day.state === "operational").length / known.length * 100 : 0;
  return <article className="status-row"><div className="status-row-head"><div><h2>{service.name}</h2><p>{service.description}</p></div><span className={service.state}>{stateCopy[service.state]}</span></div><div className="uptime-bars" aria-label={`${service.name} 90-day history`}>{days.map((day) => <span key={day.date} className={day.state} title={`${day.date}: ${stateCopy[day.state]}`} />)}</div><div className="uptime-meta"><span>90 days ago</span><i /><b>{known.length ? `${uptime.toFixed(uptime === 100 ? 1 : 2)}% measured uptime` : "History starts today"}</b><i /><span>Today</span></div><div className="status-row-foot"><span>{service.detail}</span>{service.href ? <Link href={service.href} target="_blank" rel="noreferrer">Provider status <ArrowUpRight /></Link> : <span>Managed by Nexora</span>}</div></article>;
}
