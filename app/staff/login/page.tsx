import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, LockKeyhole, ShieldCheck } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { signOut } from "@/app/dashboard/actions";

export const dynamic = "force-dynamic";

export default async function StaffLoginPage() {
  let signedIn = false;
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    signedIn = Boolean(user);
    if (user) {
      const { data } = await supabase.rpc("staff_access_state");
      const access = data as { authorized?: boolean } | null;
      if (access?.authorized) redirect("/staff");
    }
  }

  return (
    <main className="min-h-screen bg-[#050303] px-5 py-10 text-white">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-xl items-center">
        <section className="glass-strong w-full overflow-hidden rounded-[32px] border border-white/10 p-7 sm:p-10">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-white/55 hover:text-white">
            <ArrowLeft className="size-4" /> Back to Nexora
          </Link>
          <div className="mt-10 flex size-14 items-center justify-center rounded-2xl bg-[#d79a9a]/12 text-[#d79a9a] ring-1 ring-[#d79a9a]/25">
            <LockKeyhole className="size-6" />
          </div>
          <p className="microlabel mt-7">Restricted operations</p>
          <h1 className="mt-3 font-display text-4xl font-extrabold tracking-[-0.035em]">Staff sign-in</h1>
          <p className="mt-4 text-sm leading-7 text-white/58">
            Staff use their normal Nexora account. Access is granted by a platform owner and verified by the database on every request.
          </p>
          {signedIn ? (
            <div className="mt-8 rounded-2xl border border-red-400/25 bg-red-400/8 p-5">
              <div className="flex gap-3"><ShieldCheck className="mt-0.5 size-5 text-red-300" /><div><b className="text-sm">No staff access</b><p className="mt-1 text-xs leading-6 text-white/55">This signed-in account is not assigned a platform staff role.</p></div></div>
              <form action={signOut} className="mt-4"><button className="pill pill-ghost" type="submit">Sign out</button></form>
            </div>
          ) : (
            <Link href="/login?next=/staff" className="mt-8 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[#ffffff] px-6 text-sm font-bold text-[#050303] transition hover:bg-white">
              Continue with secure sign-in
            </Link>
          )}
          <div className="mt-8 flex items-center gap-3 border-t border-white/8 pt-6 text-xs text-white/38"><BrandMark compact /><span>No separate admin password is stored.</span></div>
        </section>
      </div>
    </main>
  );
}
