import test from "node:test";
import assert from "node:assert/strict";
import { commands } from "../src/commands/index.js";

test("all command names are unique and valid", () => {
  const names = commands.map((command) => command.data.name);
  assert.equal(new Set(names).size, names.length);
  assert.ok(names.length >= 10);
  for (const name of names) assert.match(name, /^[a-z0-9_-]{1,32}$/);
});

test("commands serialize to valid guild-only definitions", () => {
  for (const command of commands) {
    const definition = command.data.toJSON();
    assert.ok(definition.description.length >= 1 && definition.description.length <= 100);
    assert.equal(definition.dm_permission, false);
  }
});
