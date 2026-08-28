import Link from "next/link";
import { ArrowRight, LayoutDashboard, LogIn } from "lucide-react";
import { signOut } from "@/app/dashboard/actions";
import { BrandMark } from "@/components/brand-mark";
import { createClient } from "@/lib/supabase/server";

const links = [
  { href: "/#platform", label: "Platform" },
  { href: "/team", label: "Team" },
  { href: "/pricing", label: "Pricing" },
  { href: "/security", label: "Security" },
  { href: "/status", label: "Status" },
];

/**
 * Floating island navigation.
 *
 * Server component, so the signed-in / signed-out state is resolved before the
 * HTML is sent — no loading flicker and no auth state in client JavaScript.
 *
 * The island detaches from the viewport edge and floats over the page on
 * desktop. On phones the links collapse and the primary actions move to a
 * thumb-reachable bottom island (rendered below), which is why pages that use
 * this component also carry `.island-clearance`.
 */
export async function SiteNav({ active }: { active?: string } = {}) {
  let signedIn = false;
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    signedIn = Boolean(data.user);
  } catch {
    // If Supabase is unreachable the marketing page must still render; fall
    // back to the signed-out nav rather than failing the whole route.
    signedIn = false;
  }

  return (
    <>
      <div className="island-shell">
        <nav className="island" aria-label="Primary navigation">
          <Link href="/" className="island-brand" aria-label="Nexora Rank home">
            <BrandMark />
            Nexora Rank
          </Link>

          <div className="island-links">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="island-link"
                data-active={active === link.href ? "true" : undefined}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="island-actions">
            {signedIn ? (
              <>
                <form action={signOut}>
                  <button type="submit" className="pill pill-ghost">
                    Log out
                  </button>
                </form>
                <Link href="/dashboard" className="pill pill-solid">
                  Dashboard <ArrowRight className="size-3.5" aria-hidden="true" />
                </Link>
              </>
            ) : (
              <>
                <Link href="/login" className="pill pill-ghost">
                  Sign in
                </Link>
                <Link href="/login?next=/onboarding" className="pill pill-solid">
                  Get started <ArrowRight className="size-3.5" aria-hidden="true" />
                </Link>
              </>
            )}
          </div>
        </nav>
      </div>

      {/* Thumb-reachable bottom island for phones. Same destinations as the top
          island's actions, so small screens never lose the primary path. */}
      <div className="island-bottom" role="group" aria-label="Quick actions">
        {signedIn ? (
          <>
            <form action={signOut} className="flex-1">
              <button type="submit" className="pill pill-ghost w-full">
                Log out
              </button>
            </form>
            <Link href="/dashboard" className="pill pill-solid">
              <LayoutDashboard className="size-4" aria-hidden="true" />
              Dashboard
            </Link>
          </>
        ) : (
          <>
            <Link href="/login" className="pill pill-ghost">
              Sign in
            </Link>
            <Link href="/login?next=/onboarding" className="pill pill-solid">
              <LogIn className="size-4" aria-hidden="true" />
              Get started
            </Link>
          </>
        )}
      </div>
    </>
  );
}
