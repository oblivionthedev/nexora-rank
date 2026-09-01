import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));

test("stores OAuth credentials encrypted and never in browser cookies", async () => {
  const [callback, crypto, migration] = await Promise.all([
    readFile(path.join(root, "app/auth/roblox/callback/route.ts"), "utf8"),
    readFile(path.join(root, "lib/roblox-token-crypto.ts"), "utf8"),
    readFile(
      path.join(
        root,
        "supabase/migrations/20260901134913_prepare_roblox_oauth_execution.sql",
      ),
      "utf8",
    ),
  ]);

  assert.match(callback, /encryptRobloxToken\(accessToken\)/);
  assert.match(callback, /store_roblox_oauth_credential/);
  assert.doesNotMatch(callback, /cookies\.set\([^)]*access_token/);
  assert.match(crypto, /"AES-GCM"/);
  assert.match(crypto, /digest\("SHA-256"/);
  assert.match(migration, /nexora_private\.roblox_oauth_credentials/);
  assert.match(migration, /open_cloud_ready', true/);
});

test("refreshes rotating tokens and verifies every Roblox rank mutation", async () => {
  const [executor, openCloud, actions] = await Promise.all([
    readFile(path.join(root, "lib/roblox-action-executor.ts"), "utf8"),
    readFile(path.join(root, "lib/roblox-open-cloud.ts"), "utf8"),
    readFile(path.join(root, "app/dashboard/[workspaceId]/actions.ts"), "utf8"),
  ]);

  assert.match(executor, /refreshRobloxOAuthToken/);
  assert.match(executor, /rotate_roblox_oauth_credential/);
  assert.match(executor, /code\.includes\("http_401"\)/);
  assert.match(openCloud, /assignRole/);
  assert.match(openCloud, /unassignRole/);
  assert.match(openCloud, /roblox_role_verification_failed/);
  assert.match(actions, /executeRobloxGroupMemberAction/);
  assert.match(actions, /metadata\?\.open_cloud_ready/);
});

test("does not fake unsupported Roblox member removal", async () => {
  const executor = await readFile(
    path.join(root, "lib/roblox-action-executor.ts"),
    "utf8",
  );
  assert.match(executor, /roblox_open_cloud_kick_unsupported/);
});
