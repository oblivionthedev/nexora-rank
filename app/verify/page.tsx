import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { createClient } from "@/lib/supabase/server";
import { verifyNexoraDiscordMember } from "./actions";

export const metadata: Metadata = {
  title: "Discord Verification",
  description: "Verify your Discord identity with Nexora Rank.",
};
export const dynamic = "force-dynamic";

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ verified?: string; error?: string }>;
}) {
  const query = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: discord } = user
    ? await supabase
        .from("account_links")
        .select("username,display_name,avatar_url")
        .eq("user_id", user.id)
        .eq("provider", "discord")
        .maybeSingle()
    : { data: null };
  return (
    <main className="verify-page">
      <nav>
        <Link href="/" className="home-brand">
          <BrandMark />
          <span>Nexora Rank</span>
        </Link>
        <Link href="https://discord.gg/YY9nXqqWTk" target="_blank">
          Community server <ExternalLink />
        </Link>
      </nav>
      <section>
        <div className="verify-mark">
          <Image src="/discord.svg" width={34} height={34} alt="Discord" />
        </div>
        <p>Official Discord verification</p>
        <h1>
          One secure check.
          <br />
          <span>Your Nexora role.</span>
        </h1>
        <p className="verify-copy">
          Authorize your Discord identity through Nexora, then receive the
          official Verified role in the Nexora Community &amp; Support server.
          Your password is never shared.
        </p>
        {query.verified ? (
          <div className="verify-result success">
            <BadgeCheck />
            <div>
              <b>You are verified</b>
              <span>Your official Nexora Verified role is active.</span>
            </div>
          </div>
        ) : null}
        {query.error ? (
          <div className="verify-result error">
            <ShieldCheck />
            <div>
              <b>Verification could not finish</b>
              <span>
                Join the Nexora server first and make sure the bot can manage
                your role, then try again.
              </span>
            </div>
          </div>
        ) : null}
        {discord ? (
          <>
            <div className="verify-account">
              {discord.avatar_url ? (
                <img src={discord.avatar_url} alt="" />
              ) : (
                <span>DC</span>
              )}
              <div>
                <small>Connected Discord account</small>
                <b>{discord.display_name || discord.username}</b>
              </div>
            </div>
            <form action={verifyNexoraDiscordMember}>
              <button>
                Verify me now <ArrowRight />
              </button>
            </form>
          </>
        ) : (
          <Link href="/login?next=/verify" className="verify-button">
            Continue with Discord <ArrowRight />
          </Link>
        )}
        <small className="verify-note">
          You must already be a member of the Nexora Community &amp; Support
          Discord server.
        </small>
      </section>
    </main>
  );
}
