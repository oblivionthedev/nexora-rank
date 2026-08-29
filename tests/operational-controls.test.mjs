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
  const [migration, page, form] = await Promise.all([
    readFile(
      new URL(
        "../supabase/migrations/20260829192724_add_beta_controls_and_support_system.sql",
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
  assert.match(migration, /'beta_closed'/);
  assert.match(page, /get_public_platform_settings/);
  assert.match(page, /force-dynamic/);
  assert.match(form, /Applications are currently closed/);
});
