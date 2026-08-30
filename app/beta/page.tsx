import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Fingerprint,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
  UsersRound,
} from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { BetaApplicationForm } from "@/components/beta-application-form";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Nexora Beta",
  description:
    "Apply for early access to Nexora Rank and privately check your application status.",
};
export const dynamic = "force-dynamic";

export default async function BetaPage({
  searchParams,
}: {
  searchParams: Promise<{ access?: string }>;
}) {
  const query = await searchParams;
  const supabase = await createClient();
  const [{ data }, { data: auth }] = await Promise.all([
    supabase.rpc("get_public_platform_settings"),
    supabase.auth.getUser(),
  ]);
  const { data: discordLink } = auth.user
    ? await supabase
        .from("account_links")
        .select("display_name,username")
        .eq("user_id", auth.user.id)
        .eq("provider", "discord")
        .maybeSingle()
    : { data: null };
  const betaEnabled = Boolean(
    data &&
    typeof data === "object" &&
    !Array.isArray(data) &&
    data.beta_enabled,
  );
  return (
    <main className="beta-page">
      <nav className="beta-nav">
        <Link href="/" className="home-brand">
          <BrandMark />
          <span>Nexora Rank</span>
        </Link>
        <div>
          <Link href="/">
            <ArrowLeft />
            Home
          </Link>
          <Link href="/investors">Investors</Link>
          <Link href="/login?next=/dashboard" className="beta-nav-cta">
            Sign in <ArrowRight />
          </Link>
        </div>
      </nav>
      {query.access === "selection_required" ? (
        <div className="beta-access-notice" role="status">
          <LockKeyhole />
          <div>
            <strong>Dashboard access is currently invitation-only.</strong>
            <span>Apply below or check your Beta status. Selected applicants can sign in as soon as access is approved.</span>
          </div>
        </div>
      ) : null}
      <header className="beta-hero">
        <div className="beta-grid" aria-hidden="true" />
        <div className="home-section-label">
          <Sparkles /> Limited public beta
        </div>
        <h1>
          Help shape the way
          <br />
          <em>communities operate.</em>
        </h1>
        <p>
          Nexora Beta is for Roblox community owners and staff who want a
          clearer way to manage Discord operations, ranking, activity,
          applications, and team accountability.
        </p>
        <div className="beta-hero-facts">
          <span>
            <UsersRound />
            <b>Small groups</b>
            <small>Applications are reviewed personally</small>
          </span>
          <span>
            <Fingerprint />
            <b>Private status</b>
            <small>Check selection with your own code</small>
          </span>
          <span>
            <LockKeyhole />
            <b>Your details</b>
            <small>Used only for Beta review and contact</small>
          </span>
        </div>
      </header>
      <section className="beta-content">
        <div className="beta-explainer">
          <div className="home-section-label">
            <ShieldCheck /> What to expect
          </div>
          <h2>Early access with a direct line to the product.</h2>
          <p>
            Selected testers receive access as capacity opens. We are looking
            for thoughtful operators who will use Nexora with a real team,
            report what feels unclear, and help us make everyday community work
            better.
          </p>
          <ul>
            <li>
              <Check />
              <span>
                <b>Try production-ready workspace tools</b>Use the live
                dashboard, Discord connection, communications, applications,
                activity, and operations.
              </span>
            </li>
            <li>
              <Check />
              <span>
                <b>Give useful feedback</b>Tell us where workflows feel slow,
                confusing, or incomplete.
              </span>
            </li>
            <li>
              <Check />
              <span>
                <b>No Roblox OAuth requirement</b>Roblox authentication stays
                optional while provider approval is pending.
              </span>
            </li>
            <li>
              <Check />
              <span>
                <b>No payment required</b>The current Beta does not have active
                billing or checkout.
              </span>
            </li>
          </ul>
        </div>
        <BetaApplicationForm
          betaEnabled={betaEnabled}
          discordIdentity={
            discordLink?.display_name || discordLink?.username || null
          }
        />
      </section>
      <footer className="beta-footer">
        <Link href="/" className="home-brand">
          <BrandMark compact />
          <span>Nexora Rank</span>
        </Link>
        <p>
          Applications are reviewed by the Nexora team. Discord and Roblox are
          independent platforms.
        </p>
        <div>
          <Link href="/legal/privacy">Privacy</Link>
          <Link href="/legal/terms-of-service">Terms</Link>
          <Link href="/security">Security</Link>
        </div>
      </footer>
    </main>
  );
}
