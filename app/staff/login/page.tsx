import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  BadgeCheck,
  Clock3,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { StaffCodeForm } from "@/components/staff-code-form";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
export const dynamic = "force-dynamic";
export default async function StaffLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const query = await searchParams;
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data: blockState } = await supabase.rpc("account_block_state");
      if ((blockState as { blocked?: boolean } | null)?.blocked) {
        await supabase.auth.signOut();
        redirect("/login?error=security_blocked");
      }
      const { data } = await supabase.rpc("staff_access_state");
      if ((data as { authorized?: boolean } | null)?.authorized)
        redirect("/staff");
    }
  }
  return (
    <main className="staff-login-page">
      <div className="staff-login-brand">
        <Link href="/">
          <BrandMark />
          Nexora
        </Link>
        <span>Private operations</span>
      </div>
      <div className="staff-login-grid">
        <section className="staff-login-story">
          <Link href="/" className="staff-login-back">
            <ArrowLeft />
            Back to Nexora
          </Link>
          <p className="staff-login-kicker">Staff authorization</p>
          <h1>
            Private access.
            <br />
            <em>Two checks.</em>
          </h1>
          <p>
            A one-time bot code proves you were invited. Discord then confirms
            which staff member is entering.
          </p>
          <ol>
            <li>
              <span>01</span>
              <div>
                <b>Generate a private code</b>
                <small>
                  The Nexora owner runs <code>/login create</code> in the private Staff server.
                  Codes expire after ten minutes.
                </small>
              </div>
            </li>
            <li>
              <span>02</span>
              <div>
                <b>Authorize with Discord</b>
                <small>
                  Your Discord display name and avatar become your Staff
                  profile.
                </small>
              </div>
            </li>
            <li>
              <span>03</span>
              <div>
                <b>Enter the operations room</b>
                <small>
                  Access lasts twelve hours and every sensitive action stays
                  audited.
                </small>
              </div>
            </li>
          </ol>
        </section>
        <section className="staff-login-card">
          <div className="staff-login-card-icon">
            <LockKeyhole />
          </div>
          <p>Step 1 of 2</p>
          <h2>Enter your access code</h2>
          <small>
            The command is available only in the private Nexora Staff Discord
            server and only its owner can generate a code.
          </small>
          {query.error ? (
            <div className="staff-login-error">
              That code could not be used. It may be invalid, expired, already
              used, or the Discord authorization did not match.
            </div>
          ) : null}
          <StaffCodeForm />
          <div className="staff-login-trust">
            <span>
              <BadgeCheck />
              One use
            </span>
            <span>
              <Clock3 />
              10 minutes
            </span>
            <span>
              <ShieldCheck />
              Discord verified
            </span>
          </div>
        </section>
      </div>
    </main>
  );
}
