import test from "node:test";
import assert from "node:assert/strict";
import { loadConfig } from "../config/index.js";

const valid = {
  DISCORD_TOKEN: "a".repeat(40),
  DISCORD_CLIENT_ID: "1542533178554585099",
  DISCORD_GUILD_ID: "",
  SUPABASE_URL: "https://example.supabase.co",
  SUPABASE_SERVICE_ROLE_KEY: "s".repeat(40),
  NEXORA_SITE_URL: "https://www.nexorarank.tech/",
  PORT: "3001",
  LOG_LEVEL: "info",
};

test("configuration normalizes URLs and numeric port", () => {
  const config = loadConfig(valid);
  assert.equal(config.siteUrl, "https://www.nexorarank.tech");
  assert.equal(config.port, 3001);
  assert.equal(config.discordGuildId, null);
});

test("configuration rejects missing private keys", () => {
  assert.throws(
    () => loadConfig({ ...valid, DISCORD_TOKEN: "" }),
    /DISCORD_TOKEN/,
  );
  assert.throws(
    () => loadConfig({ ...valid, SUPABASE_SERVICE_ROLE_KEY: "" }),
    /SUPABASE_SERVICE_ROLE_KEY/,
  );
});

test("configuration ignores an invalid optional test server ID", () => {
  const config = loadConfig({
    ...valid,
    DISCORD_CLIENT_ID: "wrong-value",
    DISCORD_GUILD_ID: "your_test_server_id",
  });
  assert.equal(config.discordClientId, "1542533178554585099");
  assert.equal(config.discordGuildId, null);
});

test("configuration pins the only authorization-code owner", () => {
  const config = loadConfig(valid);
  assert.equal(config.authorizationOwnerId, "1515743540259328202");
});
