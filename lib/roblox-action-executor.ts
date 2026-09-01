import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import {
  decryptRobloxToken,
  encryptRobloxToken,
} from "@/lib/roblox-token-crypto";
import {
  parseRobloxScopes,
  refreshRobloxOAuthToken,
  robloxTokenExpiry,
  setRobloxGroupMemberRole,
} from "@/lib/roblox-open-cloud";

type ActionCredential = {
  action_id: string;
  workspace_id: string;
  roblox_group_id: string;
  target_roblox_user_id: string;
  action_type: string;
  requested_role_id: string | null;
  requested_role_name: string | null;
  requested_role_rank: number | null;
  credential_user_id: string;
  credential_provider_user_id: string;
  access_token_ciphertext: string;
  refresh_token_ciphertext: string;
  token_expires_at: string;
  token_scopes: string[];
};

function executionSecret() {
  const secret = process.env.CRON_SECRET;
  if (!secret) throw new Error("roblox_execution_not_configured");
  return secret;
}

async function finish(
  supabase: SupabaseClient<Database>,
  actionId: string,
  succeeded: boolean,
  errorCode: string | null,
  roleId: string | null,
  roleName: string | null,
) {
  await supabase.rpc("complete_group_member_action", {
    candidate_secret: executionSecret(),
    target_action_id: actionId,
    execution_succeeded: succeeded,
    execution_error_code: errorCode,
    observed_role_id: roleId,
    observed_role_name: roleName,
  });
}

export async function executeRobloxGroupMemberAction(
  supabase: SupabaseClient<Database>,
  actionId: string,
) {
  const secret = executionSecret();
  const { data, error } = await supabase.rpc("claim_group_member_action", {
    candidate_secret: secret,
    target_action_id: actionId,
  });
  if (error || !data?.[0]) {
    return { ok: false as const, error: error?.message || "roblox_reconnect_required" };
  }
  const action = data[0] as ActionCredential;

  if (action.action_type === "kick") {
    await finish(supabase, actionId, false, "roblox_open_cloud_kick_unsupported", null, null);
    return { ok: false as const, error: "roblox_open_cloud_kick_unsupported" };
  }
  if (!action.requested_role_id || !action.requested_role_name) {
    await finish(supabase, actionId, false, "roblox_target_role_missing", null, null);
    return { ok: false as const, error: "roblox_target_role_missing" };
  }

  try {
    let accessToken = await decryptRobloxToken(action.access_token_ciphertext);
    let refreshToken = await decryptRobloxToken(action.refresh_token_ciphertext);
    const refreshCredential = async () => {
      const refreshed = await refreshRobloxOAuthToken(refreshToken);
      accessToken = refreshed.access_token;
      refreshToken = refreshed.refresh_token;
      const scopes = parseRobloxScopes(refreshed.scope);
      const { error: rotationError } = await supabase.rpc(
        "rotate_roblox_oauth_credential",
        {
          candidate_secret: secret,
          target_action_id: actionId,
          target_credential_user_id: action.credential_user_id,
          access_token_ciphertext: await encryptRobloxToken(refreshed.access_token),
          refresh_token_ciphertext: await encryptRobloxToken(refreshed.refresh_token),
          token_expires_at: robloxTokenExpiry(refreshed.expires_in),
          token_scopes: scopes.length ? scopes : action.token_scopes,
        },
      );
      if (rotationError) throw new Error("roblox_credential_rotation_failed");
    };

    if (new Date(action.token_expires_at).getTime() <= Date.now() + 60_000) {
      await refreshCredential();
    }

    try {
      await setRobloxGroupMemberRole({
        accessToken,
        groupId: action.roblox_group_id,
        userId: action.target_roblox_user_id,
        targetRoleId: action.requested_role_id,
      });
    } catch (error) {
      const code = error instanceof Error ? error.message : "";
      if (!code.includes("http_401")) throw error;
      await refreshCredential();
      await setRobloxGroupMemberRole({
        accessToken,
        groupId: action.roblox_group_id,
        userId: action.target_roblox_user_id,
        targetRoleId: action.requested_role_id,
      });
    }
    await finish(
      supabase,
      actionId,
      true,
      null,
      action.requested_role_id,
      action.requested_role_name,
    );
    return { ok: true as const };
  } catch (error) {
    const code = error instanceof Error ? error.message.slice(0, 120) : "roblox_execution_failed";
    await finish(supabase, actionId, false, code, null, null);
    return { ok: false as const, error: code };
  }
}
