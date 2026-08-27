"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Gamepad2, LoaderCircle, ShieldCheck, TriangleAlert } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { ThemeToggle } from "@/components/theme-toggle";

/**
 * Human-readable copy for every failure reason /auth/callback can redirect
 * with. Without this the callback's error redirects were silent: the member
 * landed back on a pristine login page with no idea what went wrong.
 */
const authErrors: Record<string, string> = {
  authorization_declined: "Discord sign-in was cancelled. You can try again whenever you're ready.",
  oauth_not_ready: "Discord sign-in is not available right now. Please try again in a moment.",
  oauth_failed: "We could not complete the Discord sign-in. Please try again.",
  identity_link_failed: "You signed in, but we could not save your Discord identity. Please try again.",
  discord_already_linked: "This Discord account is already linked to another Nexora Rank user.",
};

/**
 * The four scopes requested in signInWithOAuth below, spelled out. Keep this
 * list and the `scopes` string in sync — it is the page's actual disclosure.
 */
const scopes = [
  { scope: "identify", explanation: "Your Discord user ID, username, and avatar." },
  { scope: "email", explanation: "So we can reach you about your own workspace. Nothing else." },
  { scope: "guilds", explanation: "The list of servers you are in, so you can choose which one to connect." },
  { scope: "guilds.members.read", explanation: "Your roles in the server you select, to work out who may approve a rank change." },
];

function safeNextPath(raw: string | null): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return "/dashboard";
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
  const [discordBusy, setDiscordBusy] = useState(false);
  const [authMessage, setAuthMessage] = useState<string | null>(null);

  // Read straight from location rather than useSearchParams so this page never
  // needs a Suspense boundary during static rendering.
  useEffect(() => {
    const reason = new URLSearchParams(window.location.search).get("error");
    if (reason) {
      setAuthMessage(authErrors[reason] ?? "Sign-in could not be completed. Please try again.");
    }
  }, []);

  async function continueWithDiscord() {
    setAuthMessage(null);

    if (!isSupabaseConfigured()) {
      setAuthMessage("Discord sign-in is not configured yet. Please try again shortly.");
      return;
    }

    setDiscordBusy(true);
    const supabase = createClient();
    const next = safeNextPath(new URLSearchParams(window.location.search).get("next"));
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "discord",
      options: { redirectTo, scopes: "identify email guilds guilds.members.read" },
    });

    if (error) {
      setDiscordBusy(false);
      setAuthMessage("Discord sign-in could not start. Please try again in a moment.");
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
          Nexora Rank uses Discord&apos;s official OAuth. Your password never reaches us, and we
          will never ask for a Roblox security cookie.
        </p>

        <div className="signin-scopes">
          <h2>What Discord shares</h2>
          <ul>
            {scopes.map(({ scope, explanation }) => (
              <li key={scope}>
                <code>{scope}</code>
                <p>{explanation}</p>
              </li>
            ))}
          </ul>
          <p className="signin-footnote">
            <ShieldCheck aria-hidden="true" />
            Nexora Rank cannot post as you, read your messages, or touch a server you have not
            connected to a workspace.
          </p>
        </div>
      </section>

      <section className="signin-action">
        <div className="signin-action-inner">
          <div className="signin-action-top">
            {/* The brand shows here on phones, where the editorial column is
                reordered below the action; on desktop the editorial one is used. */}
            <Link href="/" className="signin-brand signin-brand-mobile" aria-label="Nexora Rank home">
              <BrandMark compact /> Nexora Rank
            </Link>
            <Link href="/" className="signin-back">
              <ArrowLeft className="size-4" aria-hidden="true" /> Back
            </Link>
            <ThemeToggle />
          </div>

          <span className="signin-eyebrow">Sign in</span>
          <h2>Continue with Discord</h2>
          <p className="signin-action-lede">
            Discord will ask you to approve the access listed here, then send you straight back.
          </p>

          <button className="discord-button" onClick={continueWithDiscord} disabled={discordBusy}>
            {discordBusy ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <DiscordMark />}
            {discordBusy ? "Opening Discord…" : "Continue with Discord"}
          </button>

          <RobloxPending />

          {authMessage && (
            <div role="alert" className="signin-alert">
              <TriangleAlert aria-hidden="true" />
              <span>{authMessage}</span>
            </div>
          )}

          <p className="signin-legal">
            By continuing you agree to the{" "}
            <Link href="/legal/terms-of-service">Terms of Service</Link> and acknowledge the{" "}
            <Link href="/legal/privacy">Privacy Policy</Link>.
          </p>
        </div>
      </section>
    </main>
  );
}

function RobloxPending() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="roblox-pending">
          <Gamepad2 className="size-[18px]" aria-hidden="true" />
          <b>Continue with Roblox</b>
          <span className="soon">Soon</span>
        </button>
      </DialogTrigger>
      <DialogContent className="border-white/10 bg-[#141210] text-[#f7f3ec] sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Roblox sign-in is waiting on review</DialogTitle>
          <DialogDescription className="leading-6 text-[#f7f3ec]/50">
            Roblox OAuth apps have to be reviewed before they can be used publicly. Ours is in
            that queue. Until it clears, sign in with Discord — you will be able to attach your
            Roblox account to the same workspace afterwards without starting over.
          </DialogDescription>
        </DialogHeader>
        <p className="mt-1 flex items-start gap-2 rounded-xl border border-emerald-400/12 bg-emerald-400/[.05] p-3 text-xs leading-6 text-emerald-200/70">
          <ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          We will use official Roblox OAuth and scoped Open Cloud access. We will never ask for
          your <code className="text-emerald-200/90">.ROBLOSECURITY</code> cookie.
        </p>
      </DialogContent>
    </Dialog>
  );
}
