import assert from "node:assert/strict";
import test, { after } from "node:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

const root = fileURLToPath(new URL("..", import.meta.url));
const vite = await createServer({ configFile: false, appType: "custom", root, resolve: { alias: { "@": root } }, server: { middlewareMode: true, hmr: false }, esbuild: { jsx: "automatic" } });
after(() => vite.close());
test("Roblox connect is a real link and works without a hydrated click handler", async () => {
  const { OnboardingIdentityAction } = await vite.ssrLoadModule("/components/onboarding-identity-actions.tsx");
  const html = renderToStaticMarkup(React.createElement(OnboardingIdentityAction, { provider: "custom:roblox" }));
  assert.match(html, /<a[^>]*href="\/auth\/roblox\/start\?next=\/onboarding"/);
  assert.match(html, /Connect Roblox/);
  assert.doesNotMatch(html, /<button/);
});
test("Roblox setup uses the provider layout wrapper and readable responsive spacing", () => {
  const page = readFileSync(new URL("../app/onboarding/page.tsx", import.meta.url), "utf8");
  const card = page.slice(page.indexOf('{activeStep === robloxStep ?'), page.indexOf('{activeStep === groupStep ?'));
  assert.match(card, /className="provider-stack">\s*<ProviderStatus/);
  assert.match(card, /Continue setup/);
  assert.match(card, /Check connection again/);
  const css = readFileSync(new URL("../app/onboarding.css", import.meta.url), "utf8");
  assert.match(css, /\.setup-card\.setup-roblox-card h2\{[^}]*line-height:1\.12/);
  assert.match(css, /\.setup-roblox-card \.provider-stack p\{[^}]*white-space:normal/);
  assert.match(css, /\.setup-roblox-card \.provider-action\{[^}]*grid-column:1\/-1/);
});
test("group authorization requests fresh consent without weakening required scopes", () => {
  const route = readFileSync(new URL("../app/auth/roblox/start/route.ts", import.meta.url), "utf8");
  assert.match(route, /set\("prompt", "consent"\)/);
  assert.match(route, /set\("scope", ROBLOX_OAUTH_SCOPES\)/);
});
