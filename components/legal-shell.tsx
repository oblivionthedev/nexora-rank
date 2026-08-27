import Link from "next/link";
import { ArrowLeft, ArrowRight, FileText, ShieldCheck } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { legalDocuments } from "@/lib/legal-documents";

export function LegalShell({ children, active }: { children: React.ReactNode; active?: string }) {
  return (
    <main className="site-shell legal-shell">
      <nav className="legal-nav">
        <Link href="/" className="flex items-center gap-2.5"><BrandMark /><span>Nexora Rank</span></Link>
        <div className="flex items-center gap-2"><Link href="/pricing" className="legal-nav-link">Pricing</Link><Link href="/dashboard" className="legal-nav-cta">Open app <ArrowRight className="size-3.5" /></Link></div>
      </nav>
      <div className="legal-banner"><ShieldCheck className="size-4" /><span><b>Pre-launch legal draft.</b> Operator identity, contact details, jurisdiction, and paid-service terms must be finalized before public registration or billing.</span></div>
      <div className="legal-frame">
        <aside className="legal-sidebar">
          <Link href="/legal" className={!active ? "active" : ""}><FileText className="size-3.5" /> Legal center</Link>
          {legalDocuments.map((document) => <Link key={document.slug} href={`/legal/${document.slug}`} className={active === document.slug ? "active" : ""}>{document.shortTitle}</Link>)}
          <Link href="/security" className={active === "security" ? "active" : ""}>Security</Link>
        </aside>
        <div className="legal-content">{children}</div>
      </div>
      <footer className="legal-footer"><div><BrandMark compact /><span>© 2026 Nexora Rank · Private beta</span></div><div><Link href="/">Home</Link><Link href="/bot">Discord bot</Link><Link href="/pricing">Pricing</Link></div></footer>
    </main>
  );
}

export function LegalHeader({ eyebrow, title, summary }: { eyebrow: string; title: string; summary: string }) {
  return <header className="legal-header"><Link href="/legal"><ArrowLeft className="size-3.5" /> Legal center</Link><p>{eyebrow}</p><h1>{title}</h1><div className="legal-meta"><span>Version 0.1</span><span>Last updated August 27, 2026</span><span>Pre-launch draft</span></div><p className="legal-summary">{summary}</p></header>;
}
