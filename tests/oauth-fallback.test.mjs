import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("the public Site URL forwards OAuth codes to the session callback", async () => {
  const home = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");

  assert.match(home, /params\.code/);
  assert.match(home, /redirect\(`\/auth\/callback\?\$\{callbackParams\.toString\(\)\}`\)/);
  assert.match(home, /next:\s*"\/dashboard"/);
});
