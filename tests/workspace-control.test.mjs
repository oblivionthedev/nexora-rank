import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const migrationPath = new URL("../supabase/migrations/20260828161000_expand_workspace_control_center.sql", import.meta.url);

test("workspace control migration enforces service restrictions", async () => {
  const sql = await readFile(migrationPath, "utf8");
  assert.match(sql, /workspace_control_state/);
  assert.match(sql, /claim_discord_link_code/);
  assert.match(sql, /authenticate_workspace_api_key/);
  assert.match(sql, /target\.operational_status<>'active'/);
  assert.match(sql, /moderation_expires_at/);
  assert.match(sql, /release_expired_staff_suspensions/);
});

test("dashboard uses permanent workspace URLs and complete navigation", async () => {
  const [redirectPage, shell] = await Promise.all([
    readFile(new URL("../app/dashboard/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/workspace-shell.tsx", import.meta.url), "utf8"),
  ]);
  assert.match(redirectPage, /dashboard\/\$\{workspace\.public_id\}/);
  for (const label of ["Overview", "Connections", "Members", "Logs", "Settings & API"]) assert.match(shell, new RegExp(label));
  assert.doesNotMatch(shell, /Soon/);
});

test("API keys keep the required length and valid prefix", async () => {
  const sql = await readFile(new URL("../supabase/migrations/20260828163000_fix_workspace_api_key_scopes.sql", import.meta.url), "utf8");
  assert.match(sql, /char_length\(raw_key\)<>25/);
  assert.match(sql, /nx_live_/);
  assert.match(sql, /ranks:write/);
});
