import test from "node:test";
import assert from "node:assert/strict";
import { createNexoraService } from "../src/services/nexora.js";
import { readFile } from "node:fs/promises";

test("Supabase service initializes with the Node WebSocket fallback", () => {
  const service = createNexoraService({
    supabaseUrl: "https://example.supabase.co",
    supabaseServiceRoleKey: "s".repeat(40),
    siteUrl: "https://www.nexorarank.tech",
  }, { warn() {} });
  assert.equal(typeof service.getWorkspace, "function");
  assert.equal(typeof service.claimLink, "function");
});

test("linking uses the private database RPC instead of a website round-trip", async () => {
  const source = await readFile(
    new URL("../src/services/nexora.js", import.meta.url),
    "utf8",
  );
  assert.match(source, /database\.rpc\("claim_discord_link_code"/);
  assert.doesNotMatch(source, /api\/discord\/link/);
});

test("unlink accepts a Discord server manager without requiring workspace membership", async () => {
  const source = await readFile(
    new URL("../src/services/nexora.js", import.meta.url),
    "utf8",
  );
  const disconnect = source.slice(source.indexOf("async function disconnectGuild"));
  assert.match(disconnect, /getWorkspace\(guildId, \{ allowRestricted: true \}\)/);
  assert.doesNotMatch(disconnect.split("async function listLogs")[0], /context\(guildId/);
});
