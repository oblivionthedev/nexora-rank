"use client";

import { useState } from "react";
import Image from "next/image";
import { LoaderCircle } from "lucide-react";
import { startOAuthSignIn } from "@/lib/supabase/oauth";

export function ApplicationDiscordSignIn({ returnTo }: { returnTo: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signIn() {
    setBusy(true);
    setError(null);
    const result = await startOAuthSignIn("discord", returnTo);
    if (result.error) {
      setBusy(false);
      setError("Discord sign-in could not start. Please try again.");
    }
  }

  return (
    <div>
      <button type="button" className="application-discord-button" onClick={signIn} disabled={busy}>
        {busy ? <LoaderCircle className="animate-spin" /> : <Image src="/discord.svg" alt="" width={22} height={22} />}
        {busy ? "Opening Discord…" : "Continue with Discord"}
      </button>
      {error ? <p className="application-portal-error" role="alert">{error}</p> : null}
    </div>
  );
}
