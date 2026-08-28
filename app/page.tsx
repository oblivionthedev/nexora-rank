import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, ArrowUpRight, Bot, LayoutDashboard, ShieldCheck, Sparkles } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";

type HomeProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function Home({ searchParams }: HomeProps) {
  const params = await searchParams;
  const oauthCode = Array.isArray(params.code) ? params.code[0] : params.code;

  // Supabase falls back to the configured Site URL when an exact redirect URL
  // is missing from its allow list. Preserve that successful OAuth response by
  // forwarding it to the normal server-side exchange route.
  if (oauthCode) {
    const callbackParams = new URLSearchParams({
      code: oauthCode,
      next: "/dashboard",
    });
    redirect(`/auth/callback?${callbackParams.toString()}`);
  }

  return (
    <main className="opening-page">
      <div className="opening-glow" aria-hidden="true" />
      <div className="opening-grid" aria-hidden="true" />

      <header className="opening-header">
        <Link href="/" className="opening-brand" aria-label="Nexora Rank home">
          <BrandMark />
          <span>Nexora Rank</span>
        </Link>
        <div className="opening-state">
          <span aria-hidden="true" />
          Now live
        </div>
      </header>

      <section className="opening-content" aria-labelledby="opening-title">
        <div className="opening-orbit" aria-hidden="true">
          <div className="opening-orbit-ring" />
          <div className="opening-orbit-ring opening-orbit-ring-inner" />
          <div className="opening-orbit-core"><BrandMark /></div>
        </div>

        <div className="opening-kicker">
          <Sparkles className="size-3.5" />
          Roblox community operations, in one workspace
        </div>
        <h1 id="opening-title">
          Run your community<br />
          <span>with confidence.</span>
        </h1>
        <p className="opening-copy">
          Manage ranking, staff activity, applications, automations, sessions,
          and Discord operations with clear permissions and complete audit history.
        </p>

        <div className="opening-details" aria-label="Nexora capabilities">
          <div>
            <LayoutDashboard className="size-4" />
            <span><b>One control center</b>Workspaces, staff, activity and forms</span>
          </div>
          <div>
            <ShieldCheck className="size-4" />
            <span><b>Permission protected</b>Every sensitive action is recorded</span>
          </div>
        </div>

        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <Link className="opening-support" href="/login?next=/dashboard">
            Open Nexora <ArrowRight className="size-4" />
          </Link>
          <Link className="opening-support" href="/bot">
            Meet the Discord bot <Bot className="size-4" />
          </Link>
          <a className="opening-support" href="https://ko-fi.com/obliviondev" target="_blank" rel="noreferrer">
            Support Nexora <ArrowUpRight className="size-4" />
          </a>
        </div>
      </section>

      <footer className="opening-footer">
        <span>© 2026 Nexora</span>
        <nav aria-label="Legal">
          <Link href="/login?next=/dashboard">Sign in</Link>
          <Link href="/security">Security</Link>
          <Link href="/legal/terms-of-service">Terms</Link>
          <Link href="/legal/privacy">Privacy</Link>
          <Link href="/legal">Legal</Link>
        </nav>
      </footer>
    </main>
  );
}
