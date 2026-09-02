import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Cookie,
  FileCheck2,
  FileText,
  ReceiptText,
  ShieldCheck,
} from "lucide-react";
import { LegalHeader, LegalShell } from "@/components/legal-shell";
import { legalDocuments } from "@/lib/legal-documents";

export const metadata: Metadata = {
  title: "Legal Center",
  description:
    "Nexora Rank legal, privacy, safety, refund, and infrastructure policies.",
};

const icons = [
  FileCheck2,
  FileText,
  ShieldCheck,
  Cookie,
  ShieldCheck,
  ReceiptText,
  FileText,
  ShieldCheck,
  FileCheck2,
];

export default function LegalCenter() {
  return (
    <LegalShell>
      <LegalHeader
        eyebrow="Trust & transparency"
        title="Legal center"
        summary="Live Beta rules for accounts, privacy, Staff access, support conversations, integrations, platform safety, and future billing."
      />
      <div className="legal-grid">
        {legalDocuments.map((document, index) => {
          const Icon = icons[index];
          return (
            <Link
              href={`/legal/${document.slug}`}
              className="legal-card"
              key={document.slug}
            >
              <span>
                <Icon className="size-4" />
              </span>
              <h2>{document.shortTitle}</h2>
              <p>{document.summary}</p>
              <div>
                Read policy <ArrowRight className="size-3.5" />
              </div>
            </Link>
          );
        })}
        <Link href="/security" className="legal-card">
          <span>
            <ShieldCheck className="size-4" />
          </span>
          <h2>Security</h2>
          <p>
            Product safeguards, permission design, responsible disclosure, and
            launch-readiness controls.
          </p>
          <div>
            View security <ArrowRight className="size-3.5" />
          </div>
        </Link>
      </div>
      <section className="legal-launch-check">
        <div>
          <p>FREE PLAN ELIGIBILITY</p>
          <h2>Free workspace owners stay connected to Nexora.</h2>
          <span>
            Free workspace owners using Roblox OAuth must remain in
            Roblox community 596263047. A confirmed departure provides 48 hours
            to rejoin before suspension on the next successful verification.
            Paid plans are exempt.
          </span>
        </div>
        <Link href="/legal/terms-of-service">
          Read the full rule <ArrowRight className="size-4" />
        </Link>
      </section>
    </LegalShell>
  );
}
