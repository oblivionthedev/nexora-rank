import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Check, Code2, Gamepad2, ShieldCheck, Sparkles } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { CopyField } from "@/components/copy-field";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function OnboardingCompletePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/onboarding/complete");

  const { data: membership } = await supabase
    .from("workspace_members")
    .select("workspace_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();
  if (!membership) redirect("/onboarding");

  const [{ data: workspace }, { data: links }] = await Promise.all([
    supabase.from("workspaces").select("name, slug, public_id").eq("id", membership.workspace_id).single(),
    supabase.from("account_links").select("provider").eq("user_id", user.id),
  ]);
  if (!workspace) redirect("/onboarding");

  const robloxConnected = (links ?? []).some((link) => link.provider === "roblox");

  return (
    <main className="setup-complete-page">
      <header className="setup-topbar"><Link href="/" className="flex items-center gap-2.5"><BrandMark /><span>Nexora Rank</span></Link><ThemeToggle /></header>
      <section className="setup-complete-card">
        <div className="setup-success-mark"><Check /></div>
        <span className="setup-kicker">Workspace ready</span>
        <h1>{workspace.name} is live.</h1>
        <p>Your account, free plan, and workspace are now connected. Save the workspace ID—it identifies your community across Nexora’s bot, API, and server-side Roblox tools.</p>
        <div className="setup-copy-stack">
          <CopyField label="Workspace ID" value={workspace.public_id} />
          <CopyField label="API base" value="https://api.nexorarank.tech/v1" />
        </div>
        <div className="setup-launch-grid">
          <article><Code2 /><div><b>Server scripts only</b><span>Keep API keys in ServerScriptService or a server secret. Never place them in LocalScripts.</span></div></article>
          <article><ShieldCheck /><div><b>Scoped access</b><span>Keys will be limited to exact actions such as activity:write or ranks:write.</span></div></article>
          <article className={robloxConnected ? "ready" : ""}><Gamepad2 /><div><b>{robloxConnected ? "Roblox connected" : "Roblox connection required"}</b><span>{robloxConnected ? "Identity is ready for group setup." : "Ranking remains locked until Roblox OAuth is connected."}</span></div></article>
        </div>
        <div className="setup-complete-actions">
          <Link href="/dashboard"><Button className="button-glow h-12 rounded-xl">Open dashboard <ArrowRight /></Button></Link>
          {!robloxConnected ? <Link href="/onboarding?manage=identities" className="setup-secondary-link"><Sparkles /> Finish Roblox connection</Link> : null}
        </div>
      </section>
    </main>
  );
}
