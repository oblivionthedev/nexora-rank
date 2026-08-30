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
  const allowed = Boolean((access as { allowed?: boolean } | null)?.allowed);
  if (!allowed) {
    await supabase.rpc("report_security_incident", {
      requested_scope: "dashboard_access",
      requested_target: "/dashboard",
      requested_details: { reason: "beta_selection_required" },
    });
    await supabase.auth.signOut();
    redirect("/beta?access=selection_required");
  }

  return children;
}
