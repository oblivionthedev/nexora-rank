"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export type ApiKeyActionState = { apiKey?: string; prefix?: string; error?: string };

export async function rotateApiKey(_state: ApiKeyActionState, formData: FormData): Promise<ApiKeyActionState> {
  const workspaceId = String(formData.get("workspace_id") ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(workspaceId)) return { error: "Invalid workspace." };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in again before replacing the key." };
  const { data, error } = await supabase.rpc("rotate_workspace_api_key", { p_workspace_id: workspaceId });
  if (error) {
    if (error.message.includes("workspace_suspended")) return { error: "API keys are locked while this workspace is restricted." };
    if (error.message.includes("not_authorized")) return { error: "Only workspace owners and admins can replace the API key." };
    return { error: "The API key could not be replaced. Try again." };
  }
  const result = data as { api_key?: string; key_prefix?: string } | null;
  if (!result?.api_key || result.api_key.length !== 25) return { error: "The new key was not returned safely." };
  revalidatePath("/dashboard");
  return { apiKey: result.api_key, prefix: result.key_prefix };
}
