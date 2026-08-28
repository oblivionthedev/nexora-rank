"use client";

import { useState } from "react";
import type { ComponentType } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Bot, Check, LoaderCircle, LockKeyhole } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { nexoraOAuthProviders, startOAuthSignIn, type NexoraOAuthProvider } from "@/lib/supabase/oauth";
import { ThemeToggle } from "@/components/theme-toggle";

export default function LoginPage() {
  const [busyProvider, setBusyProvider] = useState<NexoraOAuthProvider | null>(null);
  const [authMessage, setAuthMessage] = useState<string | null>(null);

  async function continueWithProvider(provider: NexoraOAuthProvider) {
    setAuthMessage(null);
    setBusyProvider(provider);
    const currentUrl = new URL(window.location.href);
    const requestedNext = currentUrl.searchParams.get("next") ?? "/dashboard";
    const { error } = await startOAuthSignIn(provider, requestedNext);

    if (error) {
      setBusyProvider(null);
      const providerName = provider === nexoraOAuthProviders.discord ? "Discord" : "Roblox";
      setAuthMessage(`${providerName} sign-in could not start. Check the provider and callback settings in Supabase.`);
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-aurora" />
      <ThemeToggle className="fixed right-5 top-5 z-20 sm:right-8 sm:top-8" />
      <Link href="/" className="absolute left-5 top-5 z-10 inline-flex items-center gap-2 text-sm text-white/45 transition hover:text-white sm:left-8 sm:top-8"><ArrowLeft className="size-4" /> Back to Nexora Rank</Link>
      <div className="auth-card">
        <div className="flex items-center justify-center gap-2.5"><BrandMark /><span className="text-base font-semibold text-white">Nexora Rank</span></div>
        <div className="mt-8 text-center"><div className="mx-auto flex size-12 items-center justify-center rounded-2xl border border-blue-400/15 bg-blue-400/10 text-blue-300"><LockKeyhole className="size-5" /></div><h1 className="mt-5 text-3xl font-semibold tracking-[-.045em] text-white">Connect your identity</h1><p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-white/40">Sign in securely with Discord or Roblox, then link your second identity from the integrations workspace.</p></div>
        <div className="mt-8 space-y-3">
          <OAuthButton icon={Bot} name="Discord" tone="discord" busy={busyProvider === nexoraOAuthProviders.discord} disabled={busyProvider !== null} onClick={() => continueWithProvider(nexoraOAuthProviders.discord)} />
          <OAuthButton icon={RobloxIcon} name="Roblox" tone="roblox" busy={busyProvider === nexoraOAuthProviders.roblox} disabled={busyProvider !== null} onClick={() => continueWithProvider(nexoraOAuthProviders.roblox)} />
        </div>
        {authMessage && <div role="status" className="mt-3 rounded-xl border border-amber-300/10 bg-amber-300/[.045] p-3 text-xs leading-5 text-amber-100/60">{authMessage}</div>}
        <div className="my-7 flex items-center gap-3"><span className="h-px flex-1 bg-white/[.07]" /><span className="text-[10px] font-semibold uppercase tracking-[.15em] text-white/20">Private launch access</span><span className="h-px flex-1 bg-white/[.07]" /></div>
        <p className="rounded-xl border border-white/[.06] bg-white/[.018] px-4 py-3 text-center text-[10px] leading-5 text-white/30">The dashboard is currently available only to Nexora&apos;s owner. Other accounts return to the opening-soon page.</p>
        <div className="mt-8 grid grid-cols-3 gap-2">
          {["Official OAuth", "Scoped access", "No cookies"].map((item) => <div key={item} className="rounded-xl border border-white/[.06] bg-white/[.018] px-2 py-3 text-center"><Check className="mx-auto size-3.5 text-emerald-400" /><span className="mt-1.5 block text-[9px] text-white/32">{item}</span></div>)}
        </div>
        <p className="mt-7 text-center text-[10px] leading-5 text-white/22">OAuth is handled by Nexora&apos;s dedicated Supabase backend using provider-approved authorization. Nexora will never ask for a Discord token or Roblox security cookie.</p>
        <p className="mt-4 text-center text-[10px] text-white/25">By continuing after launch, you agree to the <Link href="/legal/terms-of-service" className="underline hover:text-white/60">Terms</Link> and acknowledge the <Link href="/legal/privacy" className="underline hover:text-white/60">Privacy Policy</Link>.</p>
      </div>
    </main>
  );
}

function RobloxIcon({ className }: { className?: string }) {
  return <Image src="/roblox.svg" alt="" aria-hidden="true" width={20} height={20} className={className} />;
}

function OAuthButton({ icon: Icon, name, tone, busy, disabled, onClick }: { icon: ComponentType<{ className?: string }>; name: string; tone: string; busy: boolean; disabled: boolean; onClick: () => void }) {
  return (
    <button className={`oauth-button ${tone}`} onClick={onClick} disabled={disabled}>
      <span className="oauth-icon"><Icon className="size-5" /></span>
      <span>{busy ? `Opening ${name}…` : `Continue with ${name}`}</span>
      <span className="ml-auto rounded-full border border-emerald-400/10 bg-emerald-400/[.06] px-2 py-1 text-[9px] font-semibold uppercase tracking-wider text-emerald-300/70">
        {busy ? <LoaderCircle className="size-3 animate-spin" /> : "OAuth"}
      </span>
    </button>
  );
}
