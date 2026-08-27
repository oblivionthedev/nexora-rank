import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Cookie, FileCheck2, FileText, ReceiptText, ShieldCheck } from "lucide-react";
import { LegalHeader, LegalShell } from "@/components/legal-shell";
import { legalDocuments } from "@/lib/legal-documents";

export const metadata: Metadata = { title: "Legal Center", description: "Nexora Rank legal, privacy, safety, refund, and infrastructure policies." };

const icons = [FileCheck2, FileText, ShieldCheck, Cookie, ShieldCheck, ReceiptText, FileText];

export default function LegalCenter() {
  return <LegalShell><LegalHeader eyebrow="Trust & transparency" title="Legal center" summary="One place for the rules, privacy commitments, platform safeguards, and future billing terms behind Nexora Rank." /><div className="legal-grid">{legalDocuments.map((document, index) => { const Icon = icons[index]; return <Link href={`/legal/${document.slug}`} className="legal-card" key={document.slug}><span><Icon className="size-4" /></span><h2>{document.shortTitle}</h2><p>{document.summary}</p><div>Read policy <ArrowRight className="size-3.5" /></div></Link>; })}<Link href="/security" className="legal-card"><span><ShieldCheck className="size-4" /></span><h2>Security</h2><p>Product safeguards, permission design, responsible disclosure, and launch-readiness controls.</p><div>View security <ArrowRight className="size-3.5" /></div></Link></div><section className="legal-launch-check"><div><p>PUBLIC LAUNCH GATE</p><h2>Honest policies need a real operator.</h2><span>Before registrations or payments open, Nexora must publish its legal operator, support/privacy contact, governing terms, exact retention schedule, and final processor list.</span></div><Link href="/pricing">View beta pricing <ArrowRight className="size-4" /></Link></section></LegalShell>;
}
