import Link from "next/link";
import { ArrowUpRight, Clock3, ShieldCheck, Sparkles } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";

export default function Home() {
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
          In development
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
          Something powerful is taking shape
        </div>
        <h1 id="opening-title">
          Nexora is<br />
          <span>opening soon.</span>
        </h1>
        <p className="opening-copy">
          We&apos;re putting the final details into a calmer, safer way to run
          your Roblox community—from Discord to every rank operation.
        </p>

        <div className="opening-details" aria-label="Launch information">
          <div>
            <Clock3 className="size-4" />
            <span><b>Currently building</b>Final testing and polish</span>
          </div>
          <div>
            <ShieldCheck className="size-4" />
            <span><b>Built with care</b>Security comes first</span>
          </div>
        </div>

        <a
          className="opening-support"
          href="https://ko-fi.com/obliviondev"
          target="_blank"
          rel="noreferrer"
        >
          Support the development <ArrowUpRight className="size-4" />
        </a>
      </section>

      <footer className="opening-footer">
        <span>© 2026 Nexora</span>
        <nav aria-label="Legal">
          <Link href="/login?next=/dashboard">Owner access</Link>
          <Link href="/legal/terms-of-service">Terms</Link>
          <Link href="/legal/privacy">Privacy</Link>
          <Link href="/legal">Legal</Link>
        </nav>
      </footer>
    </main>
  );
}

