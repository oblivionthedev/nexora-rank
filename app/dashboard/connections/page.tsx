import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic="force-dynamic";
export default async function LegacyConnectionsRedirect(){const supabase=await createClient();const{data:{user}}=await supabase.auth.getUser();if(!user)redirect("/login?next=/dashboard");const{data:membership}=await supabase.from("workspace_members").select("workspace_id").eq("user_id",user.id).limit(1).maybeSingle();if(!membership)redirect("/onboarding");const{data:workspace}=await supabase.from("workspaces").select("public_id").eq("id",membership.workspace_id).single();redirect(workspace?`/dashboard/${workspace.public_id}/connections`:"/dashboard")}
