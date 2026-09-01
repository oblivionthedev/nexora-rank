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

  const { data: access } = await supabase.rpc("dashboard_access_state");
  const accessState = access as { allowed?: boolean; reason?: string } | null;
  const allowed = Boolean(accessState?.allowed);
  if (!allowed) {
    if (accessState?.reason === "beta_selection_required") {
      redirect("/beta?access=selection_required#apply");
    }
    if (accessState?.reason === "security_blocked") {
      await supabase.auth.signOut();
      redirect("/login?error=security_blocked");
    }
    redirect("/beta?access=selection_required#apply");
  }

  return children;
}
