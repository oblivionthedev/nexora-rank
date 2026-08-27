"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Bot, Check, Gamepad2, KeyRound, LoaderCircle, LockKeyhole, UserRound, UsersRound } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { createClient } from "@/lib/supabase/client";
import { ThemeToggle } from "@/components/theme-toggle";

type LoginProvider = "discord" | "custom:roblox";

export default function LoginPage() {
  const [busyProvider, setBusyProvider] = useState<LoginProvider | null>(null);
  const [authMessage, setAuthMessage] = useState<string | null>(null);

  async function continueWithProvider(provider: LoginProvider) {
    setAuthMessage(null);
    setBusyProvider(provider);
    const supabase = createClient();
    const redirectTo = `${window.location.origin}/auth/callback?next=/onboarding`;
    const isRoblox = provider === "custom:roblox";
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo,
        scopes: isRoblox ? "openid profile email" : "identify email guilds guilds.members.read",
      },
    });

    if (error) {
      setBusyProvider(null);
      setAuthMessage(
        isRoblox
          ? "Roblox sign-in is waiting for the approved OAuth app to be enabled in Supabase."
          : "Discord sign-in could not start. The Discord provider must be enabled in Supabase.",
      );
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-aurora" />
      <ThemeToggle className="fixed right-5 top-5 z-20 sm:right-8 sm:top-8" />
      <Link href="/" className="absolute left-5 top-5 z-10 inline-flex items-center gap-2 text-sm text-white/45 transition hover:text-white sm:left-8 sm:top-8"><ArrowLeft className="size-4" /> Back to Nexora Rank</Link>
      <div className="auth-card">
        <div className="flex items-center justify-center gap-2.5"><BrandMark /><span className="text-base font-semibold text-white">Nexora Rank</span></div>
        <div className="mt-8 text-center"><div className="mx-auto flex size-12 items-center justify-center rounded-2xl border border-blue-400/15 bg-blue-400/10 text-blue-300"><LockKeyhole className="size-5" /></div><h1 className="mt-5 text-3xl font-semibold tracking-[-.045em] text-white">Connect your identity</h1><p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-white/40">One secure sign-in will connect your Discord identity to the Roblox account you choose.</p></div>
        <div className="mt-8 space-y-3">
          <button className="oauth-button discord" onClick={() => continueWithProvider("discord")} disabled={busyProvider !== null}>
            <span className="oauth-icon"><Bot className="size-5" /></span>
            <span>{busyProvider === "discord" ? "Opening Discord…" : "Continue with Discord"}</span>
            <span className="ml-auto rounded-full border border-emerald-400/10 bg-emerald-400/[.06] px-2 py-1 text-[9px] font-semibold uppercase tracking-wider text-emerald-300/70">
              {busyProvider === "discord" ? <LoaderCircle className="size-3 animate-spin" /> : "OAuth"}
            </span>
          </button>
          <button className="oauth-button roblox" onClick={() => continueWithProvider("custom:roblox")} disabled={busyProvider !== null}>
            <span className="oauth-icon"><Gamepad2 className="size-5" /></span>
            <span>{busyProvider === "custom:roblox" ? "Opening Roblox…" : "Continue with Roblox"}</span>
            <span className="ml-auto rounded-full border border-white/10 bg-white/[.04] px-2 py-1 text-[9px] font-semibold uppercase tracking-wider text-white/35">
              {busyProvider === "custom:roblox" ? <LoaderCircle className="size-3 animate-spin" /> : "OAuth"}
            </span>
          </button>
        </div>
        {authMessage && <div role="status" className="mt-3 rounded-xl border border-amber-300/10 bg-amber-300/[.045] p-3 text-xs leading-5 text-amber-100/60">{authMessage}</div>}
        <div className="auth-next">
          <div className="auth-next-heading"><span>After sign in</span><b>About 2 minutes</b></div>
          <AuthNextStep icon={UserRound} number="01" title="Connect both identities" detail="Start with either provider, then securely connect the other." />
          <AuthNextStep icon={Check} number="02" title="Set up your owner profile" detail="Add account details and activate the complete Beta Free plan." />
          <AuthNextStep icon={UsersRound} number="03" title="Launch your workspace" detail="Choose its name and receive your Workspace ID and API base." />
          <div className="auth-next-result"><KeyRound className="size-3.5" /><span>No payment method required. API keys stay server-side.</span></div>
        </div>
        <p className="mt-6 text-center text-[10px] leading-5 text-white/22">Nexora uses official OAuth and never asks for a Discord token or Roblox security cookie.</p>
        <p className="mt-4 text-center text-[10px] text-white/25">By continuing, you agree to the <Link href="/legal/terms-of-service" className="underline hover:text-white/60">Terms</Link> and acknowledge the <Link href="/legal/privacy" className="underline hover:text-white/60">Privacy Policy</Link>.</p>
      </div>
    </main>
  );
}

function AuthNextStep({ icon: Icon, number, title, detail }: { icon: typeof UserRound; number: string; title: string; detail: string }) {
  return <div className="auth-next-step"><span className="auth-next-icon"><Icon /></span><div><span>{number}</span><b>{title}</b><p>{detail}</p></div></div>;
}
