import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("publishes a staff-managed partner directory with verified Roblox details", async () => {
  const [page, staff, actions, migration] = await Promise.all([
    read("app/partners/page.tsx"),
    read("app/staff/page.tsx"),
    read("app/staff/actions.ts"),
    read("supabase/migrations/20260830090635_add_partners_directory.sql"),
  ]);
  assert.match(page, /Owned by/);
  assert.match(page, /discord_invite_url/);
  assert.match(staff, /action=\{addPartner\}/);
  assert.match(actions, /getRobloxGroupDetails/);
  assert.match(migration, /enable row level security/);
  assert.match(migration, /staff_management_denied/);
});

test("workspace Discord targets are selected from the linked server", async () => {
  const [communications, automations, operations, ranking] = await Promise.all([
    read("app/dashboard/[workspaceId]/communications/page.tsx"),
    read("app/dashboard/[workspaceId]/automations/page.tsx"),
    read("app/dashboard/[workspaceId]/operations/page.tsx"),
    read("app/dashboard/[workspaceId]/ranking/page.tsx"),
  ]);
  assert.match(communications, /DiscordChannelSelect/);
  assert.match(automations, /DiscordChannelSelect/);
  assert.match(operations, /DiscordRoleSelect/);
  assert.match(ranking, /DiscordRoleSelect/);
  assert.doesNotMatch(
    `${communications}${automations}${operations}${ranking}`,
    /Discord channel ID|Discord role ID/,
  );
});

test("workspace settings require the exact name for permanent deletion", async () => {
  const settings = await read("app/dashboard/[workspaceId]/settings/page.tsx");
  assert.match(settings, /Delete workspace forever/);
  assert.match(settings, /confirmation_name/);
  assert.match(settings, /value="delete"/);
});
