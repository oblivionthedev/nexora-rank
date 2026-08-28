import type { Metadata } from "next";
import Link from "next/link";
import { Activity, ArrowUpRight, Check, Clock3, RefreshCw, ShieldCheck, TriangleAlert, X } from "lucide-react";
import { SiteNav } from "@/components/site-nav";
import { getServiceHealth, type HealthState } from "@/lib/service-status";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "System Status",
  description: "Live operational status for Nexora Rank and its connected platforms.",
  alternates: { canonical: "/status" },
};

const stateCopy: Record<HealthState, string> = {
  operational: "Operational",
  degraded: "Degraded",
  outage: "Outage",
  unknown: "Checking",
};

export default async function StatusPage() {
  const { services, checkedAt } = await getServiceHealth();
  const hasOutage = services.some((service) => service.state === "outage");
  const hasDegradation = services.some((service) => service.state === "degraded" || service.state === "unknown");
  const overallState: HealthState = hasOutage ? "outage" : hasDegradation ? "degraded" : "operational";

  return (
    <main className="status-page site-shell island-clearance">
      <SiteNav active="/status" />
      <section className="status-frame below-island">
        <header className="status-hero">
          <div>
            <span className="section-kicker"><Activity aria-hidden="true" /> Live operations</span>
            <h1>Know what is working.<br /><span>Before you troubleshoot.</span></h1>
            <p>Live health for Nexora and the platforms that power sign-in, hosting, data, Discord, and Roblox.</p>
          </div>
          <div className={`status-overall ${overallState}`}>
            <StatusIcon state={overallState} />
            <div><span>Current status</span><strong>{overallState === "operational" ? "All systems operational" : overallState === "outage" ? "Service interruption" : "Some systems need attention"}</strong></div>
          </div>
        </header>

        <div className="status-toolbar">
          <p><Clock3 aria-hidden="true" /> Checked <time dateTime={checkedAt}>{new Date(checkedAt).toLocaleString("en-GB", { timeZone: "Europe/Belgrade", dateStyle: "medium", timeStyle: "short" })} CET</time></p>
          <form action="/status"><button type="submit"><RefreshCw aria-hidden="true" /> Refresh status</button></form>
        </div>

        <section className="status-grid" aria-label="Service health">
          {services.map((service, index) => (
            <article className={`status-card ${service.state}`} key={service.name}>
              <div className="status-card-index">{String(index + 1).padStart(2, "0")}</div>
              <div className="status-card-head"><StatusIcon state={service.state} /><span>{stateCopy[service.state]}</span></div>
              <h2>{service.name}</h2>
              <p>{service.description}</p>
              <div className="status-card-detail">{service.detail}</div>
              {service.href ? <Link href={service.href} target="_blank" rel="noreferrer">Provider status <ArrowUpRight aria-hidden="true" /></Link> : <span className="status-managed"><ShieldCheck aria-hidden="true" /> Managed by Nexora</span>}
            </article>
          ))}
        </section>

        <footer className="status-note">
          <div><ShieldCheck aria-hidden="true" /><div><b>Transparent by default</b><span>This page checks Nexora directly and reads official provider status feeds. It refreshes whenever you reload it.</span></div></div>
          <Link href="/security">How Nexora protects access <ArrowUpRight aria-hidden="true" /></Link>
        </footer>
      </section>
    </main>
  );
}

function StatusIcon({ state }: { state: HealthState }) {
  if (state === "operational") return <span className="status-icon"><Check aria-hidden="true" /></span>;
  if (state === "outage") return <span className="status-icon"><X aria-hidden="true" /></span>;
  return <span className="status-icon"><TriangleAlert aria-hidden="true" /></span>;
}
