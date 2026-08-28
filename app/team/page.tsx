import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ShieldCheck, UsersRound } from "lucide-react";
import { SiteNav } from "@/components/site-nav";

export const metadata: Metadata = {
  title: "Team",
  description: "The people building and operating Nexora Rank.",
  alternates: { canonical: "/team" },
};

export default function TeamPage() {
  return (
    <main className="site-shell island-clearance">
      <SiteNav active="/team" />
      <section className="below-island px-5 pb-28 pt-12 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <span className="section-kicker"><UsersRound /> Nexora team</span>
          <h1 className="mt-6 max-w-4xl font-display text-[clamp(3.4rem,8vw,7rem)] font-extrabold leading-[.88] tracking-[-.07em] text-white">Built by people who run communities.</h1>
          <p className="mt-7 max-w-2xl text-sm leading-7 text-white/56">Verified team profiles will list each person’s Nexora role and linked Roblox username here. No private identifiers, provider configuration, or internal access details are published.</p>
          <section className="glass mt-12 grid gap-7 p-7 sm:p-10 md:grid-cols-[auto_1fr_auto] md:items-center">
            <span className="flex size-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[.035] text-[#d79a9a]"><ShieldCheck /></span>
            <div><p className="microlabel">Team directory</p><h2 className="mt-2 font-display text-2xl font-extrabold text-white">Profiles are being verified.</h2><p className="mt-2 text-sm leading-6 text-white/48">Names and Roblox links will appear only after the owner adds and confirms them.</p></div>
            <Link href="/" className="pill pill-ghost">Back home <ArrowRight /></Link>
          </section>
        </div>
      </section>
    </main>
  );
}
