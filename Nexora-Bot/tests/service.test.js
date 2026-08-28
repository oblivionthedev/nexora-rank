import test from "node:test";
import assert from "node:assert/strict";
import { createNexoraService } from "../src/services/nexora.js";

test("Supabase service initializes with the Node WebSocket fallback", () => {
  const service = createNexoraService({
    supabaseUrl: "https://example.supabase.co",
    supabaseServiceRoleKey: "s".repeat(40),
    siteUrl: "https://www.nexorarank.tech",
  }, { warn() {} });
  assert.equal(typeof service.getWorkspace, "function");
  assert.equal(typeof service.claimLink, "function");
});
