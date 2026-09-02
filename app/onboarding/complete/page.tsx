import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Check, Code2, Gamepad2, Rocket, ShieldCheck } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { CopyField } from "@/components/copy-field";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function OnboardingCompletePage() {
  const supabase = await createClient();
  const authResult = await supabase.auth.getUser().catch(() => null);
  const user = authResult?.data.user ?? null;
  if (!user) redirect("/login?next=/onboarding/complete");

  const { data: membership } = await supabase
    .from("workspace_members")
    .select("workspace_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();
  if (!membership) redirect("/onboarding");

  const [{ data: workspace }, { data: links }] = await Promise.all([
    supabase
      .from("workspaces")
      .select("name, slug, public_id")
      .eq("id", membership.workspace_id)
      .single(),
    supabase.from("account_links").select("provider").eq("user_id", user.id),
  ]);
  if (!workspace) redirect("/onboarding");

  const robloxConnected = (links ?? []).some(
    (link) => link.provider === "roblox",
  );

  return (
    <main className="setup-complete-page">
      <header className="setup-topbar">
        <Link href="/" className="setup-brand">
          <BrandMark />
          <span>Nexora Rank</span>
        </Link>
        <div className="setup-topbar-actions">
          <Link href="/status">System status</Link>
        </div>
      </header>
      <section className="setup-complete-card">
        <div className="setup-success-mark">
          <Check />
        </div>
        <span className="setup-kicker">Launch complete</span>
        <h1>Welcome to {workspace.name}.</h1>
        <p>
          Your workspace is ready and your owner access is active. Open the
          dashboard to invite your team, connect a Discord server, and shape
          the way your community operates.
        </p>
        <div className="setup-copy-stack">
          <CopyField label="Workspace ID" value={workspace.public_id} />
        </div>
        <div className="setup-launch-grid">
          <article>
            <Code2 />
            <div>
              <b>Server scripts only</b>
              <span>
                Keep API keys in ServerScriptService or a server secret. Never
                place them in LocalScripts.
              </span>
            </div>
          </article>
          <article>
            <ShieldCheck />
            <div>
              <b>Replaceable access</b>
              <span>
                The readable 25-character key is shown once. Regenerating it
                disables the old key immediately.
              </span>
            </div>
          </article>
          <article className={robloxConnected ? "ready" : ""}>
            <Gamepad2 />
            <div>
              <b>{robloxConnected ? "Roblox connected" : "Roblox connection required"}</b>
              <span>
                {robloxConnected
                  ? "Account is ready for group setup."
                  : "Return to onboarding and connect Roblox before using this workspace."}
              </span>
            </div>
          </article>
        </div>
        <div className="setup-complete-actions">
          <Button asChild className="setup-primary-button">
            <Link href="/dashboard">
              <Rocket /> Enter your workspace <ArrowRight />
            </Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
