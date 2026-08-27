"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function createWorkspace(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim().toLowerCase();
  if (name.length < 2 || name.length > 64 || !/^[a-z0-9][a-z0-9-]{1,46}[a-z0-9]$/.test(slug)) redirect("/dashboard?error=invalid_workspace");

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/dashboard");

  const { error } = await supabase.rpc("create_workspace", { workspace_name: name, workspace_slug: slug });
  if (error) redirect(`/dashboard?error=${error.code === "23505" ? "slug_taken" : "workspace_failed"}`);
  redirect("/dashboard");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
