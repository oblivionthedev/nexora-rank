"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Shared sign-out action. Lives at the app root (rather than under /dashboard)
 * so the marketing nav can use it too without importing across features.
 */
export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
