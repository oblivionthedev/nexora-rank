"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, Bot, Check, Gamepad2, LoaderCircle, LockKeyhole } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { Button } from "@/components/ui/button";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { ThemeToggle } from "@/components/theme-toggle";

export default function LoginPage() {
  const [discordBusy, setDiscordBusy] = useState(false);
  const [authMessage, setAuthMessage] = useState<string | null>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    const robloxStatus = searchParams.get("roblox");
    const error = searchParams.get("error");

    if (robloxStatus === "authorization_declined") {
      setAuthMessage("Roblox sign-in was declined or cancelled.");
      return;
    }

    if (robloxStatus === "oauth_not_ready") {
      setAuthMessage("Roblox OAuth is not configured yet. Add the Roblox client ID and secret as server-only environment variables.");
      return;
    }

    if (error === "roblox_not_ready") {
      setAuthMessage("Roblox sign-in is not ready yet. Add the Roblox client ID and secret as server-only environment variables.");
    }
  }, [searchParams]);

  async function continueWithDiscord() {
    setAuthMessage(null);

    if (!isSupabaseConfigured()) {
      window.location.assign("/onboarding?provider=discord&mode=preview");
      return;
    }

    setDiscordBusy(true);
    const supabase = createClient();
    const redirectTo = `${window.location.origin}/auth/callback?${new URLSearchParams({ next: "/onboarding?provider=discord" }).toString()}`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "discord",
      options: { redirectTo },
    });

    if (error) {
      setDiscordBusy(false);
      window.location.assign("/onboarding?provider=discord&mode=preview");
    }
  }

  function continueWithRoblox() {
    window.location.assign(`/auth/roblox/start?${new URLSearchParams({ next: "/onboarding?provider=roblox" }).toString()}`);
  }

  return (
    <main className="auth-page">
      <div className="auth-aurora" />
      <ThemeToggle className="fixed right-5 top-5 z-20 sm:right-8 sm:top-8" />
      <Link href="/" className="absolute left-5 top-5 z-10 inline-flex items-center gap-2 text-sm text-white/45 transition hover:text-white sm:left-8 sm:top-8"><ArrowLeft className="size-4" /> Back to Nexora Rank</Link>
      <div className="auth-card">
        <div className="flex items-center justify-center gap-2.5"><BrandMark /><span className="text-base font-semibold text-white">Nexora Rank</span></div>
        <div className="mt-8 text-center"><div className="mx-auto flex size-12 items-center justify-center rounded-2xl border border-blue-400/15 bg-blue-400/10 text-blue-300"><LockKeyhole className="size-5" /></div><h1 className="mt-5 text-3xl font-semibold tracking-[-.045em] text-white">Connect your identity</h1><p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-white/40">Start with Discord or Roblox, then finish the other link, your profile, and workspace setup in one guided flow.</p></div>
        <div className="mt-8 space-y-3">
          <button className="oauth-button discord" onClick={continueWithDiscord} disabled={discordBusy}>
            <span className="oauth-icon"><Bot className="size-5" /></span>
            <span>{discordBusy ? "Opening Discord…" : "Continue with Discord"}</span>
            <span className="ml-auto rounded-full border border-emerald-400/10 bg-emerald-400/[.06] px-2 py-1 text-[9px] font-semibold uppercase tracking-wider text-emerald-300/70">
              {discordBusy ? <LoaderCircle className="size-3 animate-spin" /> : "OAuth"}
            </span>
          </button>
          <button className="oauth-button roblox" onClick={continueWithRoblox}>
            <span className="oauth-icon"><Gamepad2 className="size-5" /></span>
            <span>Continue with Roblox</span>
            <span className="ml-auto rounded-full border border-white/10 bg-white/[.04] px-2 py-1 text-[9px] font-semibold uppercase tracking-wider text-white/35">Setup</span>
          </button>
        </div>
        {authMessage && <div role="status" className="mt-3 rounded-xl border border-amber-300/10 bg-amber-300/[.045] p-3 text-xs leading-5 text-amber-100/60">{authMessage}</div>}
        <div className="my-7 flex items-center gap-3"><span className="h-px flex-1 bg-white/[.07]" /><span className="text-[10px] font-semibold uppercase tracking-[.15em] text-white/20">Preview access</span><span className="h-px flex-1 bg-white/[.07]" /></div>
        <Button asChild className="button-glow h-11 w-full rounded-xl"><Link href="/onboarding">Continue to onboarding <ArrowRight /></Link></Button>
        <div className="mt-8 grid grid-cols-3 gap-2">
          {["Official OAuth", "Scoped access", "No cookies"].map((item) => <div key={item} className="rounded-xl border border-white/[.06] bg-white/[.018] px-2 py-3 text-center"><Check className="mx-auto size-3.5 text-emerald-400" /><span className="mt-1.5 block text-[9px] text-white/32">{item}</span></div>)}
        </div>
        <p className="mt-7 text-center text-[10px] leading-5 text-white/22">Discord OAuth is wired to Nexora&apos;s dedicated Supabase backend. Provider credentials must be approved and enabled before public sign-in. Nexora will never ask for a Discord token or Roblox security cookie.</p>
        <p className="mt-4 text-center text-[10px] text-white/25">By continuing after launch, you agree to the <Link href="/legal/terms-of-service" className="underline hover:text-white/60">Terms</Link> and acknowledge the <Link href="/legal/privacy" className="underline hover:text-white/60">Privacy Policy</Link>.</p>
      </div>
    </main>
  );
}
