import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const migrationPath = new URL(
  "../supabase/migrations/20260828161000_expand_workspace_control_center.sql",
  import.meta.url,
);

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
  const [redirectPage, navigation] = await Promise.all([
    readFile(new URL("../app/dashboard/page.tsx", import.meta.url), "utf8"),
    readFile(
      new URL("../components/workspace-navigation.tsx", import.meta.url),
      "utf8",
    ),
  ]);
  assert.match(redirectPage, /dashboard\/\$\{workspace\.public_id\}/);
  for (const label of [
    "Overview",
    "Connections",
    "Members",
    "Logs",
    "Settings & API",
  ])
    assert.match(navigation, new RegExp(label));
  assert.doesNotMatch(navigation, /Soon/);
});

test("API keys keep the required length and valid prefix", async () => {
  const sql = await readFile(
    new URL(
      "../supabase/migrations/20260828163000_fix_workspace_api_key_scopes.sql",
      import.meta.url,
    ),
    "utf8",
  );
  assert.match(sql, /char_length\(raw_key\)<>25/);
  assert.match(sql, /nx_live_/);
  assert.match(sql, /ranks:write/);
});

test("workspace themes and restrictions are enforced across UI and database", async () => {
  const [sql, shell, connections, editor] = await Promise.all([
    readFile(
      new URL(
        "../supabase/migrations/20260828171000_workspace_themes_and_owner_only_staff.sql",
        import.meta.url,
      ),
      "utf8",
    ),
    readFile(
      new URL("../components/workspace-shell.tsx", import.meta.url),
      "utf8",
    ),
    readFile(
      new URL(
        "../app/dashboard/[workspaceId]/connections/page.tsx",
        import.meta.url,
      ),
      "utf8",
    ),
    readFile(
      new URL("../components/workspace-theme-editor.tsx", import.meta.url),
      "utf8",
    ),
  ]);
  assert.match(sql, /save_workspace_theme/);
  assert.match(
    sql,
    /operational_status<>'active'|operational_status <> 'active'/,
  );
  assert.match(sql, /role = 'owner'/);
  assert.match(shell, /fixed inset-0 z-\[9999\]/);
  assert.match(
    shell,
    /Dashboard controls, Discord bot actions, API keys, and in-game requests are unavailable/,
  );
  assert.match(connections, /1542533178554585099/);
  assert.match(editor, /type="color"/);
  assert.match(editor, /gradient/);
});

test("overview connection cards use provider marks and branded actions", async () => {
  const overview = await readFile(
    new URL("../app/dashboard/[workspaceId]/page.tsx", import.meta.url),
    "utf8",
  );
  assert.match(overview, /src="\/discord\.svg"/);
  assert.match(overview, /src="\/roblox\.svg"/);
  assert.match(overview, /workspace-home-connection/);
  assert.match(overview, /provider="discord"/);
  assert.match(overview, /provider="roblox"/);
  assert.match(
    overview,
    /ready \? "Connected" : provider === "roblox" \? "Optional" : "Setup"/,
  );
});

test("banned workspaces use a canonical not-approved URL", async () => {
  const [shell, sync, page] = await Promise.all([
    readFile(
      new URL("../components/workspace-shell.tsx", import.meta.url),
      "utf8",
    ),
    readFile(
      new URL("../components/restricted-route-sync.tsx", import.meta.url),
      "utf8",
    ),
    readFile(
      new URL(
        "../app/dashboard/[workspaceId]/not-approved/page.tsx",
        import.meta.url,
      ),
      "utf8",
    ),
  ]);
  assert.match(shell, /moderation_status === "banned"/);
  assert.match(shell, /\/not-approved/);
  assert.match(sync, /router\.replace\(canonicalPath\)/);
  assert.match(page, /moderation_status !== "banned"/);
});
