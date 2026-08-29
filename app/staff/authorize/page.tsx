"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, LoaderCircle, ShieldCheck } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { createClient } from "@/lib/supabase/client";
function DiscordLogo() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.317 4.37a19.8 19.8 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.211.375-.445.865-.608 1.25a18.4 18.4 0 0 0-5.487 0c-.164-.394-.406-.875-.618-1.25a.077.077 0 0 0-.078-.037A19.7 19.7 0 0 0 3.677 4.37.07.07 0 0 0 3.645 4.397C.533 9.046-.319 13.58.1 18.058a.082.082 0 0 0 .031.056c2.053 1.508 4.041 2.423 5.993 3.03a.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.042-.106 12.3 12.3 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.372-.291a.074.074 0 0 1 .078-.011c3.928 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .079.01c.12.1.246.198.373.293a.077.077 0 0 1-.007.128c-.598.35-1.22.65-1.873.891a.077.077 0 0 0-.04.107c.36.698.771 1.363 1.225 1.993a.076.076 0 0 0 .084.029c1.961-.607 3.95-1.522 6.002-3.03a.077.077 0 0 0 .031-.055c.5-5.177-.838-9.674-3.548-13.66a.062.062 0 0 0-.031-.029ZM8.02 15.331c-1.183 0-2.157-1.086-2.157-2.419s.956-2.419 2.157-2.419c1.21 0 2.176 1.095 2.157 2.419 0 1.333-.956 2.419-2.157 2.419Zm7.975 0c-1.183 0-2.157-1.086-2.157-2.419s.955-2.419 2.157-2.419c1.21 0 2.176 1.095 2.157 2.419 0 1.333-.947 2.419-2.157 2.419Z" />
    </svg>
  );
}
export default function StaffAuthorizePage() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function authorize() {
    setBusy(true);
    setError("");
    const supabase = createClient();
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent("/staff/complete")}`;
    const result = await supabase.auth.signInWithOAuth({
      provider: "discord",
      options: { redirectTo, scopes: "identify email" },
    });
    if (result.error) {
      setBusy(false);
      setError("Discord authorization could not start. Please try again.");
    }
  }
  return (
    <main className="staff-authorize-page">
      <section>
        <Link href="/staff/login">
          <ArrowLeft />
          Use a different code
        </Link>
        <BrandMark />
        <p>Step 2 of 2</p>
        <h1>Confirm your Staff profile.</h1>
        <small>
          Nexora will use your Discord display name and profile image inside the
          Staff panel. Your server memberships, messages, and password are not
          shared with Nexora.
        </small>
        <div className="staff-share-card">
          <ShieldCheck />
          <div>
            <b>Discord shares</b>
            <span>
              <Check />
              Account ID
            </span>
            <span>
              <Check />
              Display name
            </span>
            <span>
              <Check />
              Profile image
            </span>
          </div>
        </div>
        {error ? <div className="staff-login-error">{error}</div> : null}
        <button onClick={authorize} disabled={busy}>
          <DiscordLogo />
          {busy ? (
            <>
              <LoaderCircle className="animate-spin" />
              Opening Discord…
            </>
          ) : (
            "Authorize with Discord"
          )}
        </button>
        <em>
          The Staff code is redeemed only after Discord returns successfully.
        </em>
      </section>
    </main>
  );
}
