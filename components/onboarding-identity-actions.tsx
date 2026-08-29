"use client";

import { useState } from "react";
import { Bot, Gamepad2, LoaderCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Provider = "discord" | "custom:roblox";

export function OnboardingIdentityAction({ provider }: { provider: Provider }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const isRoblox = provider === "custom:roblox";

  async function connect() {
    setBusy(true);
    setMessage(null);
    const supabase = createClient();
    const { error } = await supabase.auth.linkIdentity({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/onboarding`,
        scopes: isRoblox
          ? "openid profile"
          : "identify email guilds guilds.members.read",
      },
    });

    if (error) {
      setBusy(false);
      setMessage(
        isRoblox
          ? "Roblox sign-in could not start. The approved OAuth provider must be enabled in Supabase."
          : "Discord linking could not start. Manual account linking may need to be enabled in Supabase.",
      );
    }
  }

  const Icon = isRoblox ? Gamepad2 : Bot;
  return (
    <div>
      <button
        type="button"
        className="onboarding-provider-button"
        onClick={connect}
        disabled={busy}
      >
        {busy ? (
          <LoaderCircle className="size-4 animate-spin" />
        ) : (
          <Icon className="size-4" />
        )}
        {busy
          ? `Opening ${isRoblox ? "Roblox" : "Discord"}…`
          : `Connect ${isRoblox ? "Roblox" : "Discord"}`}
      </button>
      {message ? (
        <p className="onboarding-inline-error" role="status">
          {message}
        </p>
      ) : null}
    </div>
  );
}
