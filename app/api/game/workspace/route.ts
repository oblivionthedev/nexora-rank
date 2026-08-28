import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "@/lib/supabase/config";

export async function GET(request:Request){const authorization=request.headers.get("authorization")||"";const rawKey=authorization.startsWith("Bearer ")?authorization.slice(7).trim():"";const supabase=createClient<Database>(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});const{data,error}=await supabase.rpc("authenticate_workspace_api_key",{raw_key:rawKey});if(error)return Response.json({ok:false,error:error.message.includes("restricted")?"workspace_restricted":"invalid_api_key"},{status:403});return Response.json({ok:true,workspace:data},{headers:{"cache-control":"no-store"}})}
