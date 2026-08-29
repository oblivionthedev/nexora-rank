import assert from "node:assert/strict";
import test from "node:test";
import { commands } from "../src/commands/index.js";

test("support commands are unique and server-only", () => {
  const names = commands.map((command) => command.data.name);
  assert.equal(new Set(names).size, names.length);
  assert.deepEqual(names, ["setup", "panel", "ticket"]);
  for (const command of commands)
    assert.equal(command.data.toJSON().dm_permission, false);
});

test("ticket command includes the organized management actions", () => {
  const ticket = commands
    .find((command) => command.data.name === "ticket")
    .data.toJSON();
  assert.deepEqual(
    ticket.options.map((option) => option.name),
    ["claim", "close", "rename", "add", "remove"],
  );
});
