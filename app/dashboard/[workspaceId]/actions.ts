"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getRobloxGroupDetails } from "@/lib/roblox-groups";
import { listRobloxGroups } from "@/lib/roblox-membership";

export type LinkCodeState={code?:string;expiresAt?:string;error?:string};
async function context(publicId:string){const supabase=await createClient();const{data:{user}}=await supabase.auth.getUser();if(!user)redirect(`/login?next=/dashboard/${publicId}`);const{data,error}=await supabase.rpc("workspace_control_state",{target_public_id:publicId});if(error||!data)redirect("/dashboard");return{supabase,user,state:data as unknown as {workspace:{id:string;role:string}}}}

export async function createDiscordCode(_state:LinkCodeState,formData:FormData):Promise<LinkCodeState>{const publicId=String(formData.get("public_id")||"");const{supabase,state}=await context(publicId);const{data,error}=await supabase.rpc("create_discord_link_code",{target_workspace_id:state.workspace.id});if(error)return{error:error.message.includes("suspended")?"Workspace connections are locked while restricted.":"Could not create a link code."};const result=data as {code?:string;expires_at?:string}|null;return result?.code?{code:result.code,expiresAt:result.expires_at}:{error:"Could not create a link code."}}

export async function connectRobloxGroup(formData:FormData){const publicId=String(formData.get("public_id")||"");const groupId=String(formData.get("group_id")||"").trim();if(!/^\d+$/.test(groupId))redirect(`/dashboard/${publicId}/connections?error=invalid_group`);const{supabase,user,state}=await context(publicId);if(!["owner","admin"].includes(state.workspace.role))redirect(`/dashboard/${publicId}/connections?error=manager_required`);const details=await getRobloxGroupDetails(groupId);if(!details)redirect(`/dashboard/${publicId}/connections?error=group_not_found`);
  const{data:link}=await supabase.from("account_links").select("provider_user_id").eq("user_id",user.id).eq("provider","roblox").maybeSingle();
  if(link){const groups=await listRobloxGroups(link.provider_user_id);const owned=groups.ok?groups.groups.find(g=>g.id===groupId&&g.roleRank===255):null;if(!owned)redirect(`/dashboard/${publicId}/connections?error=group_owner_required`)}
  const{error}=await supabase.rpc("set_workspace_roblox_group",{target_workspace_id:state.workspace.id,group_id:details.id,group_name:details.name,icon_url:details.iconUrl||"",oauth_verified:Boolean(link)});
  if(error)redirect(`/dashboard/${publicId}/connections?error=save_failed`);revalidatePath(`/dashboard/${publicId}`);redirect(`/dashboard/${publicId}/connections?saved=roblox`)}

export async function saveWorkspaceAccess(formData:FormData){const publicId=String(formData.get("public_id")||"");const rankMin=Number(formData.get("rank_min"));const roleIds=String(formData.get("role_ids")||"").split(",").map(v=>v.trim()).filter(v=>/^\d+$/.test(v));const{supabase,state}=await context(publicId);const{error}=await supabase.rpc("save_workspace_settings",{target_workspace_id:state.workspace.id,rank_min:rankMin,role_ids:roleIds});if(error)redirect(`/dashboard/${publicId}/settings?error=settings_failed`);revalidatePath(`/dashboard/${publicId}`);redirect(`/dashboard/${publicId}/settings?saved=access`)}
