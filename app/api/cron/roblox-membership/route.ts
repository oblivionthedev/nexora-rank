import { checkRequiredRobloxMembership, createMembershipAutomationClient } from "@/lib/roblox-membership";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

type CheckTarget = {
  workspace_id: string;
  owner_user_id: string;
  roblox_user_id: string | null;
  plan_key: string;
  plan_status: string;
};

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const supabase = createMembershipAutomationClient();
  await supabase.rpc("release_expired_staff_suspensions", { candidate_secret: secret });
  const { data, error } = await supabase.rpc("claim_free_membership_checks", {
    candidate_secret: secret,
    batch_size: 250,
  });
  if (error) return Response.json({ ok: false, error: "claim_failed" }, { status: 500 });

  const targets = (data ?? []) as CheckTarget[];
  let checked = 0;
  let failures = 0;

  for (let index = 0; index < targets.length; index += 8) {
    const batch = targets.slice(index, index + 8);
    await Promise.all(batch.map(async (target) => {
      let result: "member" | "not_member" | "unverifiable" | "exempt";
      let errorCode: string | null = null;

      if (target.plan_key !== "free" && ["active", "trialing"].includes(target.plan_status)) {
        result = "exempt";
      } else if (!target.roblox_user_id) {
        result = "not_member";
        errorCode = "roblox_identity_missing";
      } else {
        const membership = await checkRequiredRobloxMembership(target.roblox_user_id);
        result = membership.ok ? (membership.member ? "member" : "not_member") : "unverifiable";
        errorCode = membership.ok ? null : membership.error;
      }

      const { error: recordError } = await supabase.rpc("record_free_membership_check", {
        candidate_secret: secret,
        target_workspace_id: target.workspace_id,
        check_result: result,
        error_code: errorCode ?? undefined,
      });
      if (recordError) failures += 1;
      else checked += 1;
    }));
  }

  return Response.json({ ok: failures === 0, checked, failures });
}
