import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  commandAllowedInGuild,
  commands,
  officialServerCommands,
  publicCommands,
} from "../src/commands/index.js";

test("all command names are unique and valid", () => {
  const names = commands.map((command) => command.data.name);
  assert.equal(new Set(names).size, names.length);
  assert.ok(names.length >= 10);
  for (const name of names) assert.match(name, /^[a-z0-9_-]{1,32}$/);
});

test("commands serialize to valid guild-only definitions", () => {
  for (const command of commands) {
    const definition = command.data.toJSON();
    assert.ok(
      definition.description.length >= 1 &&
        definition.description.length <= 100,
    );
    assert.equal(definition.dm_permission, false);
  }
});

test("private platform commands include login, switches, verification, and channel formats", () => {
  const privateNames = commands
    .filter((command) => command.staffOnly)
    .map((command) => command.data.name);
  assert.deepEqual(privateNames, [
    "login",
    "toggle",
    "verifypanel",
    "rules",
    "faq",
    "welcome",
    "getting-started",
    "resources",
    "about",
  ]);
});

test("customer servers receive only standard workspace commands", () => {
  assert.ok(publicCommands.length > officialServerCommands.length);
  assert.ok(publicCommands.every((command) => !command.staffOnly));
  assert.ok(officialServerCommands.every((command) => command.staffOnly));
  assert.deepEqual(
    commands,
    [...publicCommands, ...officialServerCommands],
  );
});

test("runtime command scope blocks private commands outside the Nexora server", () => {
  const publicCommand = publicCommands[0];
  const privateCommand = officialServerCommands[0];
  const officialGuildId = "1542617161825255474";

  assert.equal(commandAllowedInGuild(publicCommand, "111111111111111111", officialGuildId), true);
  assert.equal(commandAllowedInGuild(privateCommand, officialGuildId, officialGuildId), true);
  assert.equal(commandAllowedInGuild(privateCommand, "111111111111111111", officialGuildId), false);
  assert.equal(commandAllowedInGuild(privateCommand, null, officialGuildId), false);
});

test("verification panel sends members to the official website", async () => {
  const panel = commands.find((command) => command.data.name === "verifypanel");
  assert.ok(panel);
  assert.equal(panel.data.toJSON().dm_permission, false);
  const source = await readFile(new URL("../src/commands/verifypanel.js", import.meta.url), "utf8");
  assert.match(source, /`\$\{config\.siteUrl\}\/verify`/);
  assert.doesNotMatch(source, /setCustomId/);
});

test("channel formats contain clear rules, FAQs, onboarding, and trusted links", async () => {
  const source = await readFile(new URL("../src/commands/channel-formats.js", import.meta.url), "utf8");
  assert.match(source, /Nexora Community Rules/);
  assert.match(source, /Nexora Frequently Asked Questions/);
  assert.match(source, /Get started with Nexora/);
  assert.match(source, /Official Nexora Resources/);
  assert.match(source, /https:\/\/discord\.gg\/YY9nXqqWTk/);
  assert.match(source, /https:\/\/www\.roblox\.com\/communities\/596263047/);
});

test("applications supports listing, decisions, and announcements", () => {
  const applications = commands.find((command) => command.data.name === "applications").data.toJSON();
  assert.deepEqual(applications.options.map((option) => option.name), ["list", "decide", "announce"]);
});

test("link accepts plan-specific dashboard codes", () => {
  const link = commands.find((command) => command.data.name === "link").data.toJSON();
  const code = link.options.find((option) => option.name === "code");
  assert.equal(code.min_length, 24);
  assert.equal(code.max_length, 64);
  assert.match(code.description, /plan-specific/i);
});
