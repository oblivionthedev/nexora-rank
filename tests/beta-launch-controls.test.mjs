import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("publishes a Staff-managed Groups using Nexora directory", async () => {
  const [page, nav, staff, migration] = await Promise.all([
    read("app/groups/page.tsx"),
    read("components/site-nav.tsx"),
    read("app/staff/page.tsx"),
    read("supabase/migrations/20260830142743_add_groups_security_and_beta_launch_controls.sql"),
  ]);
  assert.match(page, /Groups using Nexora/);
  assert.match(nav, /href: "\/groups"/);
  assert.match(staff, /staff_nexora_groups/);
  assert.match(migration, /nexora_groups_public_read/);
});

test("Beta launch access is invite-only and unauthorized access remains alertable", async () => {
  const [dashboard, callback, migration, bot] = await Promise.all([
    read("app/dashboard/layout.tsx"),
    read("app/auth/callback/route.ts"),
    read("supabase/migrations/20260830142743_add_groups_security_and_beta_launch_controls.sql"),
    read("Nexora-Bot/src/index.js"),
  ]);
  assert.match(dashboard, /dashboard_access_state/);
  assert.match(callback, /report_security_incident/);
  assert.match(migration, /interval '60 seconds'/);
  assert.match(bot, /securityPingRoleId/);
  assert.match(bot, /60_000/);
});

test("workspace rank requests use linked members, live roles, reasons, and audit logs", async () => {
  const [page, actions, migration] = await Promise.all([
    read("app/dashboard/[workspaceId]/automations/page.tsx"),
    read("app/dashboard/[workspaceId]/actions.ts"),
    read("supabase/migrations/20260830142743_add_groups_security_and_beta_launch_controls.sql"),
  ]);
  assert.match(page, /workspace_rank_candidates/);
  assert.match(page, /target_role_id/);
  assert.match(page, /name="reason"/);
  assert.match(actions, /create_workspace_rank_request/);
  assert.match(migration, /rank\.requested/);
  assert.match(migration, /workspace_member_not_found/);
});

test("applications can be archived or permanently deleted", async () => {
  const [workspaceApplications, staffActions] = await Promise.all([
    read("app/dashboard/[workspaceId]/applications/page.tsx"),
    read("app/staff/actions.ts"),
  ]);
  assert.match(workspaceApplications, /value="archived"/);
  assert.match(workspaceApplications, />Delete</);
  assert.match(staffActions, /staff_archive_beta_application/);
  assert.match(staffActions, /staff_delete_beta_application/);
});
