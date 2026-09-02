import assert from "node:assert/strict";
import test, { after } from "node:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";

const root = fileURLToPath(new URL("..", import.meta.url));
const vite = await createServer({
  configFile: false, appType: "custom", root,
  resolve: { alias: { "@": root } },
  plugins: [{ name: "verification-db-test", enforce: "pre",
    resolveId(id) { if (id.replaceAll("\\", "/").endsWith("/lib/supabase/server")) return "\0verification-db"; },
    load(id) { if (id === "\0verification-db") return "export async function createClient() { return globalThis.__verificationDb; }"; },
  }],
  server: { middlewareMode: true, hmr: false },
});
const config = await vite.ssrLoadModule("/lib/roblox-oauth.ts");
const { exchangeRobloxVerification } = await vite.ssrLoadModule("/lib/roblox-verification.ts");
const { GET: start } = await vite.ssrLoadModule("/app/auth/roblox/verify/start/route.ts");
const { GET: callback } = await vite.ssrLoadModule("/app/auth/roblox/verify/callback/route.ts");
const keys = ["ROBLOX_VERIFICATION_CLIENT_ID", "ROBLOX_VERIFICATION_CLIENT_SECRET", "ROBLOX_VERIFICATION_ENABLED", "CRON_SECRET"];
const previous = Object.fromEntries(keys.map(key => [key, process.env[key]]));
process.env.ROBLOX_VERIFICATION_CLIENT_ID = "verification-client";
process.env.ROBLOX_VERIFICATION_CLIENT_SECRET = "verification-secret";
process.env.ROBLOX_VERIFICATION_ENABLED = "true";
process.env.CRON_SECRET = "test-server-secret";
after(async () => { for (const key of keys) { if (previous[key] === undefined) delete process.env[key]; else process.env[key] = previous[key]; } delete globalThis.__verificationDb; await vite.close(); });
const request = (path, cookies = {}) => ({ url: `https://www.nexorarank.tech${path}`, cookies: { get: name => cookies[name] ? { value: cookies[name] } : undefined } });
function db(user = { id: "nexora-user" }) {
  const chain = { select() { return this; }, eq() { return this; }, not() { return this; }, async maybeSingle() { return { data: { id: "discord-link" } }; } };
  return { auth: { async getUser() { return { data: { user } }; } }, from() { return chain; }, async rpc() { return { data: true }; } };
}
const validCookies = { nexora_verify_state: "state", nexora_verify_pkce: "verifier", nexora_verify_user: "nexora-user" };
const profile = { sub: "123", preferred_username: "Builder", name: "Builder Display", picture: "https://example.com/avatar.png" };
function mockProvider(t, scope = "openid profile", customProfile = profile) {
  return t.mock.method(globalThis, "fetch", async (url, options) => {
    if (url.endsWith("/token")) {
      assert.equal(options.body.get("client_id"), "verification-client");
      assert.equal(options.body.get("client_secret"), "verification-secret");
      assert.equal(options.body.get("redirect_uri"), "https://www.nexorarank.tech/auth/roblox/verify/callback");
      assert.equal(options.body.get("code_verifier"), "verifier");
      return Response.json({ access_token: "private-token", scope }); // No refresh token needed.
    }
    if (url.endsWith("/userinfo")) return Response.json(customProfile);
    if (url.endsWith("/introspect")) {
      assert.equal(options.body.get("client_id"), "verification-client");
      return Response.json({ active: true, sub: "123", client_id: "verification-client", scope: "openid profile" });
    }
    throw new Error("Verification must not call group/resource APIs");
  });
}
test("verification needs its own explicit activation and never uses group credentials", () => {
  assert.equal(config.ROBLOX_VERIFICATION_SCOPES, "openid profile");
  assert.equal(config.isRobloxVerificationReady(), true);
  process.env.ROBLOX_VERIFICATION_ENABLED = "false";
  assert.equal(config.isRobloxVerificationReady(), false);
  process.env.ROBLOX_VERIFICATION_ENABLED = "true";
  delete process.env.ROBLOX_VERIFICATION_CLIENT_SECRET;
  assert.equal(config.isRobloxVerificationReady(), false);
  process.env.ROBLOX_VERIFICATION_CLIENT_SECRET = "verification-secret";
});
test("start requests profile-only scopes with isolated PKCE and user-bound cookies", async () => {
  globalThis.__verificationDb = db();
  const response = await start(request("/auth/roblox/verify/start"));
  const target = new URL(response.headers.get("location"));
  assert.equal(target.searchParams.get("client_id"), "verification-client");
  assert.equal(target.searchParams.get("scope"), "openid profile");
  assert.equal(target.searchParams.get("redirect_uri"), "https://www.nexorarank.tech/auth/roblox/verify/callback");
  assert.equal(target.searchParams.get("code_challenge_method"), "S256");
  assert.equal(response.cookies.get("nexora_verify_user").value, "nexora-user");
  assert.match(response.headers.get("set-cookie"), /HttpOnly/i);
  assert.match(response.headers.get("set-cookie"), /Path=\/auth\/roblox\/verify/);
  assert.equal(response.cookies.get("nexora_roblox_state"), undefined);
});
test("unauthenticated start returns to verification, not restricted onboarding", async () => {
  globalThis.__verificationDb = db(null);
  const response = await start(request("/auth/roblox/verify/start"));
  assert.equal(new URL(response.headers.get("location")).pathname, "/login");
  assert.equal(new URL(response.headers.get("location")).searchParams.get("next"), "/verify");
});
test("verification exchanges profile without refresh token or group resources", async t => {
  const fetchMock = mockProvider(t);
  assert.deepEqual(await exchangeRobloxVerification("code", "verifier", "https://www.nexorarank.tech"), { id: "123", username: "Builder", displayName: "Builder Display", avatarUrl: profile.picture });
  assert.equal(fetchMock.mock.calls.length, 2);
});
test("incomplete scopes introspect against verification app only", async t => {
  const mock = mockProvider(t, null);
  assert.equal((await exchangeRobloxVerification("code", "verifier", "https://www.nexorarank.tech")).id, "123");
  assert.equal(mock.mock.calls.length, 3);
});
test("disabled verification never starts OAuth", async t => {
  process.env.ROBLOX_VERIFICATION_ENABLED = "false";
  try {
    const fetchMock = t.mock.method(globalThis, "fetch", () => { throw new Error("must not fetch"); });
    const response = await start(request("/auth/roblox/verify/start"));
    assert.equal(new URL(response.headers.get("location")).searchParams.get("error"), "roblox_verification_pending");
    assert.equal(fetchMock.mock.calls.length, 0);
  } finally { process.env.ROBLOX_VERIFICATION_ENABLED = "true"; }
});
test("cancelled consent does not store any identity", async t => {
  globalThis.__verificationDb = db();
  const rpc = t.mock.method(globalThis.__verificationDb, "rpc", () => { throw new Error("must not store"); });
  const response = await callback(request("/auth/roblox/verify/callback?error=access_denied&state=state", validCookies));
  assert.equal(new URL(response.headers.get("location")).searchParams.get("error"), "roblox_authorization_declined");
  assert.equal(rpc.mock.calls.length, 0);
});
test("duplicate account stays rejected rather than claiming verification succeeded", async t => {
  globalThis.__verificationDb = db();
  mockProvider(t);
  t.mock.method(globalThis.__verificationDb, "rpc", async () => ({ data: null, error: { code: "23505" } }));
  const response = await callback(request("/auth/roblox/verify/callback?code=code&state=state", validCookies));
  assert.equal(new URL(response.headers.get("location")).searchParams.get("error"), "roblox_account_already_linked");
});
test("malformed Roblox profile is rejected", async t => {
  mockProvider(t, "openid profile", { sub: "not-a-roblox-id" });
  await assert.rejects(exchangeRobloxVerification("code", "verifier", "https://www.nexorarank.tech"));
});
test("callback rejects missing/cross-flow state before contacting Roblox", async t => {
  const fetchMock = t.mock.method(globalThis, "fetch", () => { throw new Error("must not fetch"); });
  const response = await callback(request("/auth/roblox/verify/callback?code=code&state=state", { nexora_roblox_state: "state" }));
  assert.equal(new URL(response.headers.get("location")).searchParams.get("error"), "roblox_not_ready");
  assert.equal(fetchMock.mock.calls.length, 0);
});
test("callback rejects a different signed-in Nexora user", async t => {
  globalThis.__verificationDb = db({ id: "different-user" });
  const fetchMock = t.mock.method(globalThis, "fetch", () => { throw new Error("must not fetch"); });
  const response = await callback(request("/auth/roblox/verify/callback?code=code&state=state", validCookies));
  assert.equal(new URL(response.headers.get("location")).searchParams.get("error"), "verification_session_changed");
  assert.equal(fetchMock.mock.calls.length, 0);
});
test("successful callback stores only verified profile, never group tokens", async t => {
  globalThis.__verificationDb = db();
  mockProvider(t);
  const rpc = t.mock.method(globalThis.__verificationDb, "rpc", async (name, args) => {
    assert.equal(name, "store_roblox_verification");
    assert.equal(args.provider_user_id, "123");
    assert.equal(args.candidate_secret, "test-server-secret");
    assert.equal(JSON.stringify(args).includes("private-token"), false);
    return { data: true };
  });
  const response = await callback(request("/auth/roblox/verify/callback?code=code&state=state", validCookies));
  assert.equal(response.headers.get("location"), "https://www.nexorarank.tech/verify");
  assert.equal(rpc.mock.calls.length, 1);
  assert.match(response.headers.get("set-cookie"), /Max-Age=0/);
});
test("migration requires both authenticated actor and server secret; never writes group credentials", () => {
  const sql = readFileSync(new URL("../supabase/migrations/20260902191945_separate_roblox_verification_app.sql", import.meta.url), "utf8");
  assert.match(sql, /actor is null or not coalesce\(nexora_private.cron_secret_valid/);
  assert.match(sql, /security invoker/);
  assert.match(sql, /from public, anon/);
  assert.match(sql, /'open_cloud_ready', false/);
  assert.doesNotMatch(sql, /(?:insert into|update) nexora_private\.roblox_oauth_credentials/i);
  assert.match(sql, /roblox_group_account_mismatch/);
});
