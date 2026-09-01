"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  LoaderCircle,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

/**
 * Human-readable copy for every failure reason /auth/callback can redirect
 * with. Without this the callback's error redirects were silent: the member
 * landed back on a pristine login page with no idea what went wrong.
 */
const authErrors: Record<string, string> = {
  authorization_declined:
    "Discord sign-in was cancelled. You can try again whenever you're ready.",
  oauth_not_ready:
    "Discord sign-in is not available right now. Please try again in a moment.",
  oauth_failed: "We could not complete the Discord sign-in. Please try again.",
  identity_link_failed:
    "You signed in, but we could not save your Discord account connection. Please try again.",
  discord_already_linked:
    "This Discord account is already linked to another Nexora Rank user.",
  roblox_not_ready:
    "Roblox sign-in is not configured yet. Please try again shortly.",
  roblox_already_linked:
    "This Roblox account is already linked to another Nexora Rank user.",
  beta_selection_required:
    "Dashboard access is temporarily limited to selected Beta applicants and Nexora Staff.",
  security_blocked:
    "This email is blocked from protected Nexora areas for 24 hours after an unauthorized access attempt. Contact Nexora Staff if this was a mistake.",
};

const setupSteps = [
  {
    step: "01",
    title: "Connect your accounts",
    explanation:
      "Start with Discord or Roblox, then securely connect the other account.",
  },
  {
    step: "02",
    title: "Set up your owner profile",
    explanation:
      "Add your account details and activate the complete Beta Free plan.",
  },
  {
    step: "03",
    title: "Launch your workspace",
    explanation:
      "Choose its name and receive your permanent Workspace ID and API base.",
  },
];

function safeNextPath(raw: string | null): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//"))
    return "/onboarding";
  return raw;
}

function DiscordMark() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z" />
    </svg>
  );
}

export default function LoginPage() {
  const [busyProvider, setBusyProvider] = useState<"discord" | null>(null);
  const [authMessage, setAuthMessage] = useState<string | null>(null);

  // Read straight from location rather than useSearchParams so this page never
  // needs a Suspense boundary during static rendering.
  useEffect(() => {
    const reason = new URLSearchParams(window.location.search).get("error");
    if (reason) {
      const message =
        authErrors[reason] ??
        "Sign-in could not be completed. Please try again.";
      window.setTimeout(() => setAuthMessage(message), 0);
    }
  }, []);

  async function continueWith(provider: "discord") {
    setAuthMessage(null);

    if (!isSupabaseConfigured()) {
      setAuthMessage(
        "Sign-in is not configured yet. Please try again shortly.",
      );
      return;
    }

    setBusyProvider(provider);
    const supabase = createClient();
    const next = safeNextPath(
      new URLSearchParams(window.location.search).get("next"),
    );
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo,
        scopes: "identify email guilds guilds.members.read",
      },
    });

    if (error) {
      setBusyProvider(null);
      setAuthMessage(
        "Discord sign-in could not start. Please try again in a moment.",
      );
    }
  }

  return (
    <main className="signin-page">
      <section className="signin-editorial">
        <Link href="/" className="signin-brand" aria-label="Nexora Rank home">
          <BrandMark compact /> Nexora Rank
        </Link>

        <h1>
          Sign in with the account
          <em>your community already knows.</em>
        </h1>
        <p className="signin-lede">
          Nexora Rank uses official Discord and Roblox OAuth. Your password
          never reaches us, and we will never ask for a Roblox security cookie.
        </p>

        <div className="signin-scopes">
          <h2>After sign in · about 2 minutes</h2>
          <ul>
            {setupSteps.map(({ step, title, explanation }) => (
              <li key={step}>
                <code>{step}</code>
                <p>
                  <strong>{title}</strong>
                  <br />
                  {explanation}
                </p>
              </li>
            ))}
          </ul>
          <p className="signin-footnote">
            <ShieldCheck aria-hidden="true" />
            No payment method required. API keys stay server-side.
          </p>
        </div>
      </section>

      <section className="signin-action">
        {/* Ambient field, bounded to this column, with the action card floating
            on top of it as real glass — it samples the field behind it. */}
        <div className="signin-field" aria-hidden="true" />
        <div className="signin-action-inner glass-strong">
          <div className="signin-action-top">
            {/* The brand shows here on phones, where the editorial column is
                reordered below the action; on desktop the editorial one is used. */}
            <Link
              href="/"
              className="signin-brand signin-brand-mobile"
              aria-label="Nexora Rank home"
            >
              <BrandMark compact /> Nexora Rank
            </Link>
            <Link href="/" className="signin-back">
              <ArrowLeft className="size-4" aria-hidden="true" /> Back
            </Link>
          </div>

          <span className="signin-eyebrow">Selected Beta access</span>
          <h2>Sign in to your invitation</h2>
          <p className="signin-action-lede">
            Sign in with Discord first. You will connect Roblox securely inside
            Nexora, where it cannot replace or interrupt your login session.
          </p>

          <button
            className="discord-button pill"
            onClick={() => continueWith("discord")}
            disabled={busyProvider !== null}
          >
            {busyProvider === "discord" ? (
              <LoaderCircle className="animate-spin" aria-hidden="true" />
            ) : (
              <DiscordMark />
            )}
            {busyProvider === "discord"
              ? "Opening Discord…"
              : "Continue with Discord"}
          </button>

          <div className="roblox-pending pill" aria-label="Roblox connects after Discord sign-in">
            <RobloxMark />
            <b>Connect Roblox after sign-in</b>
          </div>

          {authMessage && (
            <div role="alert" className="signin-alert">
              <TriangleAlert aria-hidden="true" />
              <span>{authMessage}</span>
            </div>
          )}

          <p className="signin-legal">
            By continuing you agree to the{" "}
            <Link href="/legal/terms-of-service">Terms of Service</Link> and
            acknowledge the <Link href="/legal/privacy">Privacy Policy</Link>.
          </p>
        </div>
      </section>
    </main>
  );
}

function RobloxMark() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      style={{ width: 18, height: 18, flex: "0 0 18px" }}
    >
      <path d="M5.164 2 2 18.836 18.836 22 22 5.164 5.164 2Zm8.09 12.67-3.924-.738.738-3.924 3.924.738-.738 3.924Z" />
    </svg>
  );
}
