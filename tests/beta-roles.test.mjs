import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("Beta selection synchronizes the official Discord role", async () => {
  const [actions, ids, migration] = await Promise.all([
    read("app/staff/actions.ts"),
    read("lib/nexora-discord.ts"),
    read("supabase/migrations/20260830093000_beta_discord_roles_and_workspace_delete_fix.sql"),
  ]);
  assert.match(ids, /1543356004316614687/);
  assert.match(actions, /status === "selected"/);
  assert.match(actions, /removeDiscordGuildRole/);
  assert.match(migration, /discord_user_id/);
});

test("workspace owners and verified members use their official roles", async () => {
  const [onboarding, ids] = await Promise.all([
    read("app/onboarding/actions.ts"),
    read("lib/nexora-discord.ts"),
  ]);
  assert.match(ids, /1543357165836705883/);
  assert.match(ids, /1543357235185324123/);
  assert.match(onboarding, /NEXORA_WORKSPACE_OWNER_ROLE_ID/);
});

test("permanent workspace deletion permits only a parent cascade", async () => {
  const migration = await read("supabase/migrations/20260830093000_beta_discord_roles_and_workspace_delete_fix.sql");
  assert.match(migration, /tg_op = 'DELETE'/);
  assert.match(migration, /not exists[\s\S]*public\.workspaces/);
  assert.match(migration, /A workspace must keep at least one owner/);
});
