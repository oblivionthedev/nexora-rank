"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Bot, Check, Gamepad2, LoaderCircle, LockKeyhole, ShieldCheck, Sparkles } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { ThemeToggle } from "@/components/theme-toggle";

export default function LoginPage() {
  const [discordBusy, setDiscordBusy] = useState(false);
  const [authMessage, setAuthMessage] = useState<string | null>(null);

  async function continueWithDiscord() {
    setAuthMessage(null);

    if (!isSupabaseConfigured()) {
      setAuthMessage("The secure auth backend is prepared, but the dedicated Nexora Supabase project still needs to be connected.");
      return;
    }

    setDiscordBusy(true);
    const supabase = createClient();
    const redirectTo = `${window.location.origin}/auth/callback?next=/dashboard`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "discord",
      options: { redirectTo },
    });

    if (error) {
      setDiscordBusy(false);
      setAuthMessage("Discord sign-in could not start. Check the provider and callback settings in Supabase.");
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-aurora" />
      <ThemeToggle className="fixed right-5 top-5 z-20 sm:right-8 sm:top-8" />
      <Link href="/" className="absolute left-5 top-5 z-10 inline-flex items-center gap-2 text-sm text-white/45 transition hover:text-white sm:left-8 sm:top-8"><ArrowLeft className="size-4" /> Back to Nexora Rank</Link>
      <div className="auth-card">
        <div className="flex items-center justify-center gap-2.5"><BrandMark /><span className="text-base font-semibold text-white">Nexora Rank</span></div>
        <div className="mt-8 text-center"><div className="mx-auto flex size-12 items-center justify-center rounded-2xl border border-violet-400/15 bg-violet-400/10 text-violet-300"><LockKeyhole className="size-5" /></div><h1 className="mt-5 text-3xl font-semibold tracking-[-.045em] text-white">Connect your identity</h1><p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-white/40">One secure sign-in will connect your Discord identity to the Roblox account you choose.</p></div>
        <div className="mt-8 space-y-3">
          <button className="oauth-button discord" onClick={continueWithDiscord} disabled={discordBusy}>
            <span className="oauth-icon"><Bot className="size-5" /></span>
            <span>{discordBusy ? "Opening Discord…" : "Continue with Discord"}</span>
            <span className="ml-auto rounded-full border border-emerald-400/10 bg-emerald-400/[.06] px-2 py-1 text-[9px] font-semibold uppercase tracking-wider text-emerald-300/70">
              {discordBusy ? <LoaderCircle className="size-3 animate-spin" /> : "OAuth"}
            </span>
          </button>
          <ComingSoonButton icon={Gamepad2} name="Continue with Roblox" tone="roblox" />
        </div>
        {authMessage && <div role="status" className="mt-3 rounded-xl border border-amber-300/10 bg-amber-300/[.045] p-3 text-xs leading-5 text-amber-100/60">{authMessage}</div>}
        <div className="my-7 flex items-center gap-3"><span className="h-px flex-1 bg-white/[.07]" /><span className="text-[10px] font-semibold uppercase tracking-[.15em] text-white/20">Preview access</span><span className="h-px flex-1 bg-white/[.07]" /></div>
        <Button asChild className="button-glow h-11 w-full rounded-xl"><Link href="/dashboard">Explore demo workspace <ArrowRight /></Link></Button>
        <div className="mt-8 grid grid-cols-3 gap-2">
          {["Official OAuth", "Scoped access", "No cookies"].map((item) => <div key={item} className="rounded-xl border border-white/[.06] bg-white/[.018] px-2 py-3 text-center"><Check className="mx-auto size-3.5 text-emerald-400" /><span className="mt-1.5 block text-[9px] text-white/32">{item}</span></div>)}
        </div>
        <p className="mt-7 text-center text-[10px] leading-5 text-white/22">Discord OAuth is wired to Nexora&apos;s dedicated Supabase backend. Provider credentials must be approved and enabled before public sign-in. Nexora will never ask for a Discord token or Roblox security cookie.</p>
        <p className="mt-4 text-center text-[10px] text-white/25">By continuing after launch, you agree to the <Link href="/legal/terms-of-service" className="underline hover:text-white/60">Terms</Link> and acknowledge the <Link href="/legal/privacy" className="underline hover:text-white/60">Privacy Policy</Link>.</p>
      </div>
    </main>
  );
}

function ComingSoonButton({ icon: Icon, name, tone }: { icon: typeof Bot; name: string; tone: string }) {
  return (
    <Dialog>
      <DialogTrigger asChild><button className={`oauth-button ${tone}`}><span className="oauth-icon"><Icon className="size-5" /></span><span>{name}</span><span className="ml-auto rounded-full border border-white/10 bg-white/[.04] px-2 py-1 text-[9px] font-semibold uppercase tracking-wider text-white/35">Soon</span></button></DialogTrigger>
      <DialogContent className="border-white/10 bg-[#111117] text-white sm:max-w-md"><DialogHeader><div className="mb-3 flex size-10 items-center justify-center rounded-xl bg-violet-400/10 text-violet-300"><Sparkles className="size-5" /></div><DialogTitle>{name} is coming soon</DialogTitle><DialogDescription className="leading-6 text-white/42">The interface is ready, but real authorization stays disabled until the secure OAuth backend and callback validation are connected.</DialogDescription></DialogHeader><div className="mt-2 flex items-center gap-2 rounded-xl border border-emerald-400/10 bg-emerald-400/[.05] p-3 text-xs text-emerald-200/70"><ShieldCheck className="size-4 shrink-0" /> We won&apos;t simulate a real login or collect credentials.</div></DialogContent>
    </Dialog>
  );
}
