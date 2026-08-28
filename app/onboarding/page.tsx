import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  Bot,
  Check,
  CircleDollarSign,
  Gamepad2,
  KeyRound,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
  UserRound,
  UsersRound,
  Webhook,
} from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { OnboardingIdentityAction } from "@/components/onboarding-identity-actions";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { saveOwnerProfile, selectFreePlan, createOnboardingWorkspace } from "./actions";
import { signOut } from "@/app/dashboard/actions";

export const dynamic = "force-dynamic";

const messages: Record<string, string> = {
  identity_update_failed: "We could not save that identity choice. Please try again.",
  invalid_profile: "Enter a valid first name, surname, and contact email.",
  weak_password: "Use at least 10 characters with uppercase, lowercase, and a number.",
  password_update_failed: "The backup password could not be enabled. You can leave it blank and continue with OAuth.",
  profile_update_failed: "Your profile could not be saved.",
  plan_update_failed: "The free plan could not be selected.",
  invalid_workspace: "Use a 2–64 character name and a lowercase URL such as my-community.",
  slug_taken: "That workspace URL is already taken.",
  workspace_failed: "The workspace could not be created.",
  onboarding_incomplete: "Complete the earlier setup steps before creating a workspace.",
  roblox_not_ready: "Roblox OAuth is waiting for app approval and provider configuration.",
};

export default async function OnboardingPage({ searchParams }: { searchParams: Promise<{ error?: string; manage?: string }> }) {
  const supabase = await createClient();
  const [{ data: { user } }, params] = await Promise.all([
    supabase.auth.getUser(),
    searchParams,
  ]);
  if (!user) redirect("/login?next=/onboarding");

  await supabase.rpc("sync_auth_identities");

  const [{ data: profile }, { data: links }, { data: membership }] = await Promise.all([
    supabase
      .from("profiles")
      .select("first_name, last_name, contact_email, plan_key, plan_selected_at, password_set_at, roblox_link_deferred_at")
      .eq("id", user.id)
      .single(),
    supabase.from("account_links").select("provider, username, display_name").eq("user_id", user.id),
    supabase.from("workspace_members").select("workspace_id").eq("user_id", user.id).limit(1).maybeSingle(),
  ]);

  const providerMap = new Map((links ?? []).map((link) => [link.provider, link]));
  const discordConnected = providerMap.has("discord");
  const robloxConnected = providerMap.has("roblox");
  // Roblox OAuth is awaiting provider approval. Discord is the only identity
  // required during private-beta testing; Roblox can be connected later.
  const identityReady = discordConnected;
  if (membership && params.manage !== "identities") redirect(identityReady ? "/dashboard" : "/onboarding?manage=identities");
  const profileReady = Boolean(profile?.first_name && profile?.last_name && profile?.contact_email);
  const planReady = profile?.plan_key === "free" && Boolean(profile.plan_selected_at);
  const activeStep = params.manage === "identities" ? 1 : !identityReady ? 1 : !profileReady ? 2 : !planReady ? 3 : 4;
  const authEmail = user.email ?? "";
  const defaultFirstName = profile?.first_name ?? "";
  const defaultLastName = profile?.last_name ?? "";
  const errorMessage = params.error ? messages[params.error] : undefined;

  return (
    <main className="setup-page">
      <header className="setup-topbar">
        <Link href="/" className="setup-brand"><BrandMark /><span>Nexora Rank</span></Link>
        <div className="setup-topbar-actions">
          <span className="setup-beta">Private beta</span>
          <Link href="/status">System status</Link>
          <form action={signOut}><button type="submit">Sign out</button></form>
        </div>
      </header>

      <div className="setup-shell">
        <aside className="setup-rail">
          <div><span className="setup-eyebrow">Nexora onboarding</span><h1>Build your community control room.</h1><p>A focused setup for identity, ownership, plan limits, and the workspace your team will run from.</p></div>
          <ol className="setup-steps">
            <SetupRailStep number={1} label="Identity" active={activeStep === 1} done={activeStep > 1} />
            <SetupRailStep number={2} label="Owner profile" active={activeStep === 2} done={activeStep > 2} />
            <SetupRailStep number={3} label="Free plan" active={activeStep === 3} done={activeStep > 3} />
            <SetupRailStep number={4} label="Workspace" active={activeStep === 4} done={false} />
            <SetupRailStep number={5} label="Launch" active={false} done={false} />
          </ol>
          <div className="setup-rail-note"><ShieldCheck /><div><b>Protected by design</b><span>OAuth credentials stay with their providers. Nexora stores only the identity needed to operate your workspace.</span></div></div>
        </aside>

        <section className="setup-stage">
          <div className="setup-progress"><span style={{ width: `${activeStep * 20}%` }} /></div>
          <div className="setup-stage-head"><span>Step {activeStep} of 5</span><b>{activeStep * 20}% complete</b></div>
          {errorMessage ? <div className="onboarding-error" role="alert">{errorMessage}</div> : null}

          {activeStep === 1 ? (
            <section className="setup-card">
              <div className="setup-icon"><LockKeyhole /></div>
              <span className="setup-kicker">Identity foundation</span>
              <h2>Start with Discord. Add Roblox when it is ready.</h2>
              <p>Discord is all you need to test Nexora and launch a workspace today. Roblox OAuth is awaiting approval and will not block setup.</p>
              <div className="provider-stack">
                <ProviderStatus icon={Bot} name="Discord" description="Required for sign-in, server access, membership and role sync" state={discordConnected ? "connected" : "required"} username={providerMap.get("discord")?.display_name ?? providerMap.get("discord")?.username}>
                  {!discordConnected ? <OnboardingIdentityAction provider="discord" /> : null}
                </ProviderStatus>
                <ProviderStatus icon={Gamepad2} name="Roblox" description="Optional during testing · OAuth approval in progress" state={robloxConnected ? "connected" : "pending"} username={providerMap.get("roblox")?.display_name ?? providerMap.get("roblox")?.username}>
                  {!robloxConnected ? <span className="provider-availability">Available after approval</span> : null}
                </ProviderStatus>
              </div>
              {identityReady && membership ? <Button asChild className="button-glow h-12 rounded-xl"><Link href="/dashboard">Return to dashboard <ArrowRight /></Link></Button> : null}
            </section>
          ) : null}

          {activeStep === 2 ? (
            <section className="setup-card">
              <div className="setup-icon"><UserRound /></div>
              <span className="setup-kicker">Owner profile & security</span>
              <h2>Tell the workspace who owns it.</h2>
              <p>This information is used for account notices, audit attribution, and billing contacts when paid plans arrive.</p>
              <form action={saveOwnerProfile} className="setup-form">
                <div className="setup-form-grid">
                  <label><span>First name</span><input name="first_name" required maxLength={60} defaultValue={defaultFirstName} autoComplete="given-name" placeholder="Alex" /></label>
                  <label><span>Surname</span><input name="last_name" required maxLength={60} defaultValue={defaultLastName} autoComplete="family-name" placeholder="Morgan" /></label>
                </div>
                <label><span>Contact email</span><input name="contact_email" required type="email" maxLength={254} defaultValue={profile?.contact_email ?? authEmail} autoComplete="email" /><small>Your OAuth login email stays managed by its provider.</small></label>
                <label><span>Backup password <em>Optional</em></span><input name="password" type="password" minLength={10} maxLength={72} autoComplete="new-password" placeholder={profile?.password_set_at ? "Backup password already enabled" : "10+ characters"} /><small>Optional email-login recovery. Stored only by Supabase Auth, never by Nexora.</small></label>
                <Button type="submit" className="button-glow h-12 rounded-xl">Save and continue <ArrowRight /></Button>
              </form>
            </section>
          ) : null}

          {activeStep === 3 ? (
            <section className="setup-card">
              <div className="setup-icon"><CircleDollarSign /></div>
              <span className="setup-kicker">Plan & billing</span>
              <h2>A useful free plan—not tiny, not excessive.</h2>
              <p>No payment method is needed. Paid checkout will only appear after billing, cancellation, and refund flows are ready.</p>
              <article className="setup-plan">
                <div className="setup-plan-top"><div><span>Beta Free</span><h3>Community</h3></div><strong>€0<small>/month</small></strong></div>
                <div className="setup-plan-grid">
                  {[
                    "1 workspace",
                    "1 Discord server",
                    "1 Roblox group",
                    "Up to 500 linked members",
                    "10 staff seats",
                    "5,000 monthly API operations",
                    "30-day audit history",
                    "Ranking, activity and applications",
                  ].map((feature) => <span key={feature}><Check />{feature}</span>)}
                </div>
                <div className="setup-plan-note"><Sparkles /><span>All core tools are included during beta. Limits can be adjusted before paid plans launch.</span></div>
              </article>
              <form action={selectFreePlan}><Button type="submit" className="button-glow h-12 w-full rounded-xl">Choose Beta Free <ArrowRight /></Button></form>
            </section>
          ) : null}

          {activeStep === 4 ? (
            <section className="setup-card">
              <div className="setup-icon"><UsersRound /></div>
              <span className="setup-kicker">Create workspace</span>
              <h2>Name the control center for your community.</h2>
              <p>Your workspace receives a permanent public ID used by server-side Roblox scripts, the API, webhooks, and the Discord bot.</p>
              <form action={createOnboardingWorkspace} className="setup-form">
                <label><span>Workspace name</span><input name="name" required minLength={2} maxLength={64} placeholder="Nexora Community" /></label>
                <label><span>Workspace URL</span><div className="setup-slug"><small>nexorarank.tech/w/</small><input name="slug" required pattern="[a-z0-9][a-z0-9-]{1,46}[a-z0-9]" placeholder="nexora-community" /></div><small>Lowercase letters, numbers and hyphens only.</small></label>
                <Button type="submit" className="button-glow h-12 rounded-xl">Create workspace <ArrowRight /></Button>
              </form>
              <div className="setup-capabilities">
                <span><Webhook /> Signed API requests</span>
                <span><KeyRound /> Server-only keys</span>
                <span><ShieldCheck /> Full audit trail</span>
              </div>
            </section>
          ) : null}
        </section>
      </div>
    </main>
  );
}

function SetupRailStep({ number, label, active, done }: { number: number; label: string; active: boolean; done: boolean }) {
  return <li className={active ? "active" : done ? "done" : ""}><span>{done ? <Check /> : number}</span><b>{label}</b></li>;
}

function ProviderStatus({ icon: Icon, name, description, state, username, children }: { icon: typeof Bot; name: string; description: string; state: "connected" | "required" | "pending"; username?: string | null; children?: React.ReactNode }) {
  const connected = state === "connected";
  const statusLabel = connected ? "Connected" : state === "required" ? "Required" : "Coming soon";
  return <article className={state}><span className="provider-icon"><Icon /></span><div><div className="flex items-center gap-2"><b>{name}</b><span className={`provider-pill ${state}`}>{statusLabel}</span></div><p>{connected && username ? username : description}</p></div><div className="provider-action">{children ?? (connected ? <Check /> : null)}</div></article>;
}
