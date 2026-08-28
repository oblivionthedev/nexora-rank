import test from "node:test";
import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";

test("the supplied Nexora artwork is used for the shared mark and browser icon", async () => {
  const [mark, layout] = await Promise.all([
    readFile(new URL("../components/brand-mark.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    access(new URL("../public/nexora-discord-logo.png", import.meta.url)),
  ]);

  assert.match(mark, /src="\/nexora-discord-logo\.png"/);
  assert.match(mark, /object-cover/);
  assert.match(layout, /shortcut:\s*"\/nexora-discord-logo\.png"/);
  assert.match(layout, /apple:\s*"\/nexora-discord-logo\.png"/);
  assert.doesNotMatch(mark, /<svg/);
});
