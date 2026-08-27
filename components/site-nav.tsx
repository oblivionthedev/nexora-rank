import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { signOut } from "@/app/auth-actions";
import { BrandMark } from "@/components/brand-mark";
import { ThemeToggle } from "@/components/theme-toggle";
import { createClient } from "@/lib/supabase/server";

const links = [
  { href: "/#platform", label: "Platform" },
  { href: "/bot", label: "Discord bot" },
  { href: "/#workflow", label: "How it works" },
  { href: "/pricing", label: "Pricing" },
  { href: "/security", label: "Security" },
];

/**
 * Server component so the signed-in / signed-out state is decided before the
 * HTML is sent. No loading flicker, and no auth state in client JavaScript.
 */
export async function SiteNav() {
  let signedIn = false;
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    signedIn = Boolean(data.user);
  } catch {
    // If Supabase is unreachable the marketing page must still render; we just
    // fall back to the signed-out nav rather than failing the whole route.
    signedIn = false;
  }

  return (
    <nav className="landing-nav" aria-label="Primary navigation">
      <Link href="/" className="flex items-center gap-2.5" aria-label="Nexora Rank home">
        <BrandMark />
        <span className="text-[15px] font-semibold tracking-[-0.02em] text-white">Nexora Rank</span>
      </Link>

      <div className="hidden items-center gap-7 text-sm text-white/58 md:flex">
        {links.map((link) => (
          <Link key={link.href} href={link.href} className="nav-link">{link.label}</Link>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <ThemeToggle />
        {signedIn ? (
          <>
            <form action={signOut}>
              <button type="submit" className="nav-ghost-button">Log out</button>
            </form>
            <Link href="/dashboard" className="nav-primary-button">
              Dashboard <ArrowRight className="size-3.5" aria-hidden="true" />
            </Link>
          </>
        ) : (
          <>
            <Link href="/login" className="nav-ghost-button hidden sm:block">Sign in</Link>
            <Link href="/login?next=/dashboard" className="nav-primary-button">
              Get started <ArrowRight className="size-3.5" aria-hidden="true" />
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
