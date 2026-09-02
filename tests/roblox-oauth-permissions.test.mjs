import assert from "node:assert/strict";
import test, { after } from "node:test";
import { createServer } from "vite";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const vite = await createServer({
  appType: "custom",
  configFile: false,
  root,
  resolve: { alias: { "@": root } },
  server: { middlewareMode: true },
});
const { resolveRobloxGrantedScopes, RobloxPermissionError } = await vite.ssrLoadModule(
  "/lib/roblox-oauth-permissions.ts",
);
const { parseRobloxScopes } = await vite.ssrLoadModule("/lib/roblox-open-cloud.ts");
const previousId = process.env.ROBLOX_CLIENT_ID;
const previousSecret = process.env.ROBLOX_CLIENT_SECRET;
process.env.ROBLOX_CLIENT_ID = "test-client";
process.env.ROBLOX_CLIENT_SECRET = "test-secret";
after(async () => {
  if (previousId === undefined) delete process.env.ROBLOX_CLIENT_ID;
  else process.env.ROBLOX_CLIENT_ID = previousId;
  if (previousSecret === undefined) delete process.env.ROBLOX_CLIENT_SECRET;
  else process.env.ROBLOX_CLIENT_SECRET = previousSecret;
  await vite.close();
});

const fullScope = "openid profile group:read group:write";
const request = { accessToken: "test-access-token", tokenScope: undefined, expectedUserId: "123" };
const validClaims = { active: true, client_id: "test-client", sub: "123", scope: fullScope };

test("normalizes returned scopes without crashing on absent or malformed data", () => {
  assert.deepEqual(parseRobloxScopes("openid\tprofile\nprofile group:read"), ["openid", "profile", "group:read"]);
  assert.deepEqual(parseRobloxScopes(["openid", "profile group:read"]), ["openid", "profile", "group:read"]);
  for (const value of [null, undefined, {}, 7, ["openid", 7]]) {
    assert.deepEqual(parseRobloxScopes(value), []);
  }
});

test("accepts complete server-issued token scopes without another network call", async (t) => {
  const fetchMock = t.mock.method(globalThis, "fetch", () => { throw new Error("Unexpected request"); });
  assert.deepEqual(await resolveRobloxGrantedScopes({ ...request, tokenScope: fullScope }), fullScope.split(" "));
  assert.equal(fetchMock.mock.calls.length, 0);
});

for (const [name, tokenScope] of [["missing", undefined], ["incomplete", "openid profile"], ["malformed", {}]]) {
  test(`confirms ${name} token scopes against Roblox's authenticated introspection endpoint`, async (t) => {
    const fetchMock = t.mock.method(globalThis, "fetch", async (url, options) => {
      assert.equal(url, "https://apis.roblox.com/oauth/v1/token/introspect");
      assert.equal(options.method, "POST");
      assert.equal(options.cache, "no-store");
      assert.ok(options.signal instanceof AbortSignal);
      assert.equal(options.body.get("token"), request.accessToken);
      assert.equal(options.body.get("client_id"), "test-client");
      assert.equal(options.body.get("client_secret"), "test-secret");
      return Response.json(validClaims);
    });
    assert.deepEqual(await resolveRobloxGrantedScopes({ ...request, tokenScope }), fullScope.split(" "));
    assert.equal(fetchMock.mock.calls.length, 1);
  });
}

for (const [name, override] of [
  ["inactive token", { active: false }],
  ["wrong account", { sub: "456" }],
  ["wrong app", { client_id: "other-app" }],
  ["missing account", { sub: undefined }],
]) {
  test(`rejects ${name} even when introspection includes all permissions`, async (t) => {
    t.mock.method(globalThis, "fetch", async () => Response.json({ ...validClaims, ...override }));
    await assert.rejects(resolveRobloxGrantedScopes(request), (error) =>
      error instanceof RobloxPermissionError && error.code === "roblox_permission_check_failed");
  });
}

test("does not grant missing write permission or merge conflicting scope responses", async (t) => {
  t.mock.method(globalThis, "fetch", async () => Response.json({ ...validClaims, scope: "openid profile group:read" }));
  await assert.rejects(
    resolveRobloxGrantedScopes({ ...request, tokenScope: "group:write" }),
    (error) => error instanceof RobloxPermissionError &&
      error.code === "roblox_permissions_required" &&
      error.missingScopes.join(" ") === "group:write",
  );
});

for (const [name, response] of [
  ["empty scope", () => Response.json({ ...validClaims, scope: "" })],
  ["omitted scope", () => Response.json({ ...validClaims, scope: undefined })],
]) {
  test(`never assumes requested permissions when Roblox returns ${name}`, async (t) => {
    t.mock.method(globalThis, "fetch", async () => response());
    await assert.rejects(resolveRobloxGrantedScopes(request), (error) =>
      error instanceof RobloxPermissionError && error.code === "roblox_permissions_required");
  });
}

for (const [name, response] of [
  ["network failure", () => { throw new Error("test-access-token must not appear in errors"); }],
  ["provider error", () => new Response("test-secret must not appear in errors", { status: 500 })],
  ["invalid JSON", () => new Response("not JSON")],
  ["invalid claims", () => Response.json(null)],
]) {
  test(`reports ${name} as a verification failure, not declined permissions`, async (t) => {
    t.mock.method(globalThis, "fetch", async () => response());
    await assert.rejects(resolveRobloxGrantedScopes(request), (error) => {
      assert.equal(error.message, "roblox_permission_check_failed");
      assert.doesNotMatch(error.message, /test-access-token|test-secret/);
      return true;
    });
  });
}
