import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("unauthorized access creates a server-enforced 24 hour account block", async () => {
  const migration = await read(
    "supabase/migrations/20260830194351_add_24_hour_security_email_blocks.sql",
  );
  assert.match(migration, /security_account_blocks/);
  assert.match(migration, /now\(\) \+ interval '24 hours'/);
  assert.match(migration, /on conflict \(user_id\) do update/);
  assert.match(migration, /create or replace function nexora_private\.workspace_role/);
  assert.match(migration, /create or replace function nexora_private\.current_staff_role/);
  assert.match(migration, /'reason', 'security_blocked'/);
});

test("staff owners and admins can remove mistaken blocks", async () => {
  const [migration, staffPage, staffActions] = await Promise.all([
    read("supabase/migrations/20260830194351_add_24_hour_security_email_blocks.sql"),
    read("app/staff/page.tsx"),
    read("app/staff/actions.ts"),
  ]);
  assert.match(migration, /staff_unblock_security_account/);
  assert.match(migration, /actor_role not in \('owner', 'admin'\)/);
  assert.match(staffPage, /Unblock email/);
  assert.match(staffActions, /unblockSecurityAccount/);
});

test("blocked accounts receive a clear login message", async () => {
  const [login, dashboard, callback] = await Promise.all([
    read("app/login/page.tsx"),
    read("app/dashboard/layout.tsx"),
    read("app/auth/callback/route.ts"),
  ]);
  assert.match(login, /blocked from protected Nexora areas for 24 hours/);
  assert.match(dashboard, /security_blocked/);
  assert.match(callback, /security_blocked/);
});
