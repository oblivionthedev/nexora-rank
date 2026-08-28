import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));

test("allows Discord-only onboarding while Roblox approval is pending", async () => {
  const onboarding = await readFile(path.join(root, "app/onboarding/page.tsx"), "utf8");

  assert.match(onboarding, /const identityReady = discordConnected;/);
  assert.match(onboarding, /Available after approval/);
  assert.doesNotMatch(onboarding, /!robloxConnected \? <OnboardingIdentityAction provider="custom:roblox"/);
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
  assert.match(health, /api\.status\.io\/1\.0\/status\/59db90dbcdeb2f04dadcf16d/);
  assert.match(health, /headers: \{ apikey: publishableKey \}/);
  assert.match(navigation, /href: "\/status", label: "Status"/);
});
