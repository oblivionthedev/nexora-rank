import type { Metadata } from "next";
import { Check, KeyRound, LockKeyhole, ScanSearch, ShieldCheck } from "lucide-react";
import { LegalHeader, LegalShell } from "@/components/legal-shell";

export const metadata: Metadata = { title: "Security", description: "Nexora Rank security architecture, permission model, and disclosure guidance." };

export default function SecurityPage() {
  const controls = [
    [KeyRound, "Official authorization", "Discord uses official scoped OAuth. Roblox will use official OAuth and Open Cloud; Nexora never requests user tokens or Roblox security cookies."],
    [LockKeyhole, "Least privilege", "Workspace roles, bot permissions, and database row policies restrict access to the smallest useful scope."],
    [ScanSearch, "Auditable operations", "Privileged rank, role, application, and automation actions are designed to leave readable evidence."],
    [ShieldCheck, "Safe-by-default beta", "Each live connection stays disabled until provider configuration and end-to-end tests pass."],
  ] as const;
  return <LegalShell active="security"><LegalHeader eyebrow="Trust center" title="Security at Nexora Rank" summary="A practical security model for connecting Discord identity, Roblox community data, and sensitive staff operations." /><div className="security-control-grid">{controls.map(([Icon, title, text]) => <article key={title}><span><Icon className="size-5" /></span><h2>{title}</h2><p>{text}</p></article>)}</div><article className="legal-document"><section><h2>Data and secrets</h2><ul>{["Service credentials stay on the server and out of client bundles.", "Sensitive values are redacted from interface output and operational logs.", "Production tables use row-level security and workspace-scoped access rules.", "Transport encryption is required for browser, API, and provider traffic.", "Backups, retention, and incident procedures must be finalized before wider release."].map((item) => <li key={item}>{item}</li>)}</ul></section><section><h2>Responsible disclosure</h2><p>Do not test against other users or workspaces, use social engineering, disrupt the service, or access more data than needed to demonstrate an issue. A dedicated security contact and safe-harbor policy will be published before wider access. Never submit passwords, tokens, or other secrets in a report.</p></section><section><h2>Current readiness</h2><p className="inline-flex items-center gap-2"><Check className="size-4 text-emerald-300" />Supabase, row-level access, and Discord OAuth application flow are connected.</p><p>Discord provider credentials, production-domain callback testing, Roblox OAuth, monitoring, recovery testing, and independent legal/security review remain release gates.</p></section></article></LegalShell>;
}
