import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("applications expose a Discord-authenticated public submission flow", async () => {
  const [page, action] = await Promise.all([
    read("app/apply/[formId]/page.tsx"),
    read("app/apply/[formId]/actions.ts"),
  ]);
  assert.match(page, /Continue with Discord to apply/);
  assert.match(page, /response_\$\{field\.id\}/);
  assert.match(action, /applicant_discord_user_id/);
  assert.match(action, /sendDiscordChannelMessage/);
});

test("workspace application builder uses live Discord roles and permanent links", async () => {
  const [page, builder, resources] = await Promise.all([
    read("app/dashboard/[workspaceId]/applications/page.tsx"),
    read("components/application-builder.tsx"),
    read("lib/discord-resources.ts"),
  ]);
  assert.match(page, /Application ID/);
  assert.match(page, /announceApplication/);
  assert.match(builder, /Discord role applicants are applying for/);
  assert.match(resources, /guilds\/\$\{guildId\}\/roles/);
});

test("application inserts are scoped to the selected form workspace", async () => {
  const migration = await read("supabase/migrations/20260829203830_fix_application_submission_workspace_scope.sql");
  assert.match(migration, /application_form\.workspace_id = application_submissions\.workspace_id/);
  assert.match(migration, /applicant_id = \(select auth\.uid\(\)\)/);
});
