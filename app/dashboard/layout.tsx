import { redirect } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  if (!isSupabaseConfigured()) {
    redirect("/");
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    redirect("/login?next=/dashboard");
  }

  const ownerEmail = process.env.NEXORA_OWNER_EMAIL?.trim().toLowerCase();
  const signedInEmail = data.user.email?.trim().toLowerCase();

  // Fail closed if the owner allowlist is missing or the account does not match.
  if (!ownerEmail || signedInEmail !== ownerEmail) {
    redirect("/");
  }

  return children;
}
