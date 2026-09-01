import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("declined Beta applicants can reapply only after 24 hours", async () => {
  const migration = await read(
    "supabase/migrations/20260830092720_allow_beta_reapply_and_add_official_partner.sql",
  );
  assert.match(migration, /existing\.updated_at \+ interval '24 hours'/);
  assert.match(migration, /'reapply_wait'/);
  assert.match(migration, /status = 'submitted'/);
});

test("Staff can grant an audited one-use bypass of the Beta reapply wait", async () => {
  const [migration, actions, panel] = await Promise.all([
    read("supabase/migrations/20260901181933_fix_workspace_access_and_beta_reapply_override.sql"),
    read("app/staff/actions.ts"),
    read("components/beta-reapply-override-dialog.tsx"),
  ]);
  assert.match(migration, /staff_bypass_beta_reapply_wait/);
  assert.match(migration, /actor_role not in \('owner', 'admin'\)/);
  assert.match(migration, /beta_reapply_wait_bypassed/);
  assert.match(migration, /existing\.reapply_wait_bypassed_at is null/);
  assert.match(actions, /bypassBetaReapplyWait/);
  assert.match(panel, /Bypass 24h wait/);
});

test("existing workspace members keep dashboard access", async () => {
  const migration = await read(
    "supabase/migrations/20260901181933_fix_workspace_access_and_beta_reapply_override.sql",
  );
  assert.match(migration, /workspace_member boolean := false/);
  assert.match(migration, /staff_role is not null or beta_selected or workspace_member/);
});

test("Discord and Roblox resource choices refresh every minute", async () => {
  const [refresh, roles, ranking, settings] = await Promise.all([
    read("components/resource-auto-refresh.tsx"),
    read("lib/roblox-groups.ts"),
    read("app/dashboard/[workspaceId]/ranking/page.tsx"),
    read("app/dashboard/[workspaceId]/settings/page.tsx"),
  ]);
  assert.match(refresh, /60_000/);
  assert.match(roles, /\/roles/);
  assert.match(ranking, /RobloxRoleSelect/);
  assert.match(settings, /RobloxRolesMultiSelect/);
});

test("official Discord verification opens and completes in the browser", async () => {
  const [page, action, panel] = await Promise.all([
    read("app/verify/page.tsx"),
    read("app/verify/actions.ts"),
    read("Nexora-Bot/src/commands/verifypanel.js"),
  ]);
  assert.match(page, /Continue with Discord/);
  assert.match(action, /assignDiscordGuildRole/);
  assert.match(panel, /\/verify/);
  assert.match(panel, /Verify with Nexora/);
  assert.match(panel, /\$\{config\.siteUrl\}\/verify/);
  assert.doesNotMatch(panel, /setCustomId/);
});
