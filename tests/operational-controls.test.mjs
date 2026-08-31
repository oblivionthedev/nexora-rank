import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("operational logs use the configured Nexora channels", async () => {
  const [logs, beta, onboarding, status] = await Promise.all([
    readFile(new URL("../lib/operational-logs.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/beta/actions.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/onboarding/actions.ts", import.meta.url), "utf8"),
    readFile(
      new URL("../app/api/cron/status-history/route.ts", import.meta.url),
      "utf8",
    ),
  ]);
  assert.match(logs, /1543327164118728704/);
  assert.match(logs, /1543328201034702929/);
  assert.match(logs, /1543328254453223434/);
  assert.match(beta, /betaSubmissions/);
  assert.match(onboarding, /workspacesCreated/);
  assert.match(status, /providerStatus/);
});

test("Beta availability is database-backed and enforced server-side", async () => {
  const [migration, creationControl, page, form] = await Promise.all([
    readFile(
      new URL(
        "../supabase/migrations/20260829192724_add_beta_controls_and_support_system.sql",
        import.meta.url,
      ),
      "utf8",
    ),
    readFile(
      new URL(
        "../supabase/migrations/20260830191650_temporarily_pause_workspace_creation.sql",
        import.meta.url,
      ),
      "utf8",
    ),
    readFile(new URL("../app/beta/page.tsx", import.meta.url), "utf8"),
    readFile(
      new URL("../components/beta-application-form.tsx", import.meta.url),
      "utf8",
    ),
  ]);
  assert.match(migration, /bot_set_beta_enabled/);
  assert.match(creationControl, /bot_set_workspace_creation_enabled/);
  assert.match(migration, /'beta_closed'/);
  assert.match(page, /get_public_platform_settings/);
  assert.match(page, /force-dynamic/);
  assert.match(form, /Applications are currently closed/);
});

test("Beta applications require a verified Discord server member", async () => {
  const [migration, action, page, form, discord] = await Promise.all([
    readFile(
      new URL(
        "../supabase/migrations/20260831140035_require_verified_discord_for_beta.sql",
        import.meta.url,
      ),
      "utf8",
    ),
    readFile(new URL("../app/beta/actions.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/beta/page.tsx", import.meta.url), "utf8"),
    readFile(
      new URL("../components/beta-application-form.tsx", import.meta.url),
      "utf8",
    ),
    readFile(new URL("../lib/discord-resources.ts", import.meta.url), "utf8"),
  ]);
  assert.match(migration, /actor is null/);
  assert.match(migration, /verified_at is not null/);
  assert.match(migration, /from public, anon/);
  assert.match(action, /checkDiscordGuildMembership/);
  assert.match(action, /Join the Nexora Community & Support server/);
  assert.match(page, /discordMember/);
  assert.match(form, /Discord verification required/);
  assert.match(form, /Join the Nexora Discord server/);
  assert.match(discord, /guilds\/\$\{guildId\}\/members\/\$\{userId\}/);
});
