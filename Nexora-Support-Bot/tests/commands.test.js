import assert from "node:assert/strict";
import test from "node:test";
import { commands } from "../src/commands/index.js";
import { transcriptText } from "../src/services/support.js";

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
    ["claim", "close", "close-reason", "ask-close", "rename", "add", "remove"],
  );
});

test("support team role is pinned to the official role", async () => {
  const { loadConfig } = await import("../config/index.js");
  const config = loadConfig({
    DISCORD_TOKEN: "x".repeat(40),
    DISCORD_CLIENT_ID: "1542533178554585099",
    SUPPORT_GUILD_ID: "1542617161825255474",
  });
  assert.equal(config.supportTeamRoleId, "1543548810272309299");
});

test("plain-text transcripts include relayed embed messages and attachments", () => {
  const transcript = transcriptText(
    { name: "ticket-member-8202" },
    [
      {
        author: { tag: "Nexora Support#8612", bot: true },
        cleanContent: "",
        createdAt: new Date("2026-08-29T20:18:38.233Z"),
        attachments: new Map([["1", { url: "https://example.com/file.png" }]]),
        embeds: [
          {
            title: "Member message",
            description: "I need help with my workspace.",
            fields: [],
          },
        ],
      },
    ],
    {
      memberTag: "member#8202",
      memberId: "123456789",
      closedBy: "agent#1000",
      reason: "Resolved",
      closedAt: new Date("2026-08-29T20:20:00.000Z"),
    },
  );

  assert.match(transcript, /NEXORA SUPPORT TRANSCRIPT/);
  assert.match(transcript, /Member message/);
  assert.match(transcript, /I need help with my workspace\./);
  assert.match(transcript, /Attachment: https:\/\/example\.com\/file\.png/);
  assert.match(transcript, /Reason: Resolved/);
});
