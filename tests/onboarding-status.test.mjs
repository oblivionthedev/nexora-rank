import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));

test("requires the one-time Roblox connection as soon as approved OAuth is enabled", async () => {
  const onboarding = await readFile(
    path.join(root, "app/onboarding/page.tsx"),
    "utf8",
  );

  assert.match(
    onboarding,
    /const robloxAvailable =\s*process\.env\.NEXT_PUBLIC_ROBLOX_OAUTH_ENABLED === "true";/,
  );
  assert.match(
    onboarding,
    /const robloxRequired = robloxAvailable;/,
  );
  assert.match(
    onboarding,
    /const identityReady =\s*discordConnected && \(!robloxRequired \|\| robloxConnected\);/,
  );
  assert.match(
    onboarding,
    /robloxConnected\s*\? "connected"\s*:\s*robloxRequired\s*\? "required"\s*:\s*"optional"/,
  );
  assert.match(onboarding, /brand="discord"/);
  assert.match(onboarding, /brand="roblox"/);
  assert.match(
    onboarding,
    /robloxAvailable\s*\? \(\s*<OnboardingIdentityAction provider="custom:roblox"/,
  );
});

test("implements fail-safe free workspace Roblox membership enforcement", async () => {
  const [migration, cron, legal] = await Promise.all([
    readFile(
      path.join(
        root,
        "supabase/migrations/20260828113000_add_free_workspace_roblox_eligibility.sql",
      ),
      "utf8",
    ),
    readFile(
      path.join(root, "app/api/cron/roblox-membership/route.ts"),
      "utf8",
    ),
    readFile(path.join(root, "lib/legal-documents.ts"), "utf8"),
  ]);

  assert.match(
    migration,
    /free_roblox_membership_enforced boolean not null default false/,
  );
  assert.match(migration, /membership_grace_hours integer not null default 48/);
  assert.match(migration, /check_result = 'unverifiable'/);
  assert.match(
    migration,
    /suspension_reason = 'free_owner_left_required_roblox_group'/,
  );
  assert.match(
    cron,
    /request\.headers\.get\("authorization"\) !== `Bearer \$\{secret\}`/,
  );
  assert.match(legal, /Roblox community with ID 596263047/);
  assert.match(legal, /48-hour grace period/);
});

test("exposes a live service status route and navigation entry", async () => {
  const [page, health, navigation] = await Promise.all([
    readFile(path.join(root, "app/status/page.tsx"), "utf8"),
    readFile(path.join(root, "lib/service-status.ts"), "utf8"),
    readFile(path.join(root, "components/site-nav.tsx"), "utf8"),
  ]);

  assert.match(page, /getServiceHealth/);
  assert.match(health, /Nexora authentication/);
  assert.match(health, /discordstatus\.com\/api\/v2\/status\.json/);
  assert.match(
    health,
    /api\.status\.io\/1\.0\/status\/59db90dbcdeb2f04dadcf16d/,
  );
  assert.match(health, /headers: \{ apikey: publishableKey \}/);
  assert.match(navigation, /href: "\/status", label: "Status"/);
});
