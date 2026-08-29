import assert from "node:assert/strict";
import test from "node:test";
import { sendDiscordChannelMessage } from "../lib/discord-messages.ts";

test("sends a safe message after verifying the channel belongs to the workspace server", async () => {
  const calls = [];
  const fetchImpl = async (url, options = {}) => {
    calls.push({ url, options });
    if (calls.length === 1) return Response.json({ guild_id: "11111111111111111", type: 0 });
    return Response.json({ id: "33333333333333333" });
  };
  const result = await sendDiscordChannelMessage({ token: "secret", guildId: "11111111111111111", channelId: "22222222222222222", content: "Hello Nexora", fetchImpl });
  assert.deepEqual(result, { ok: true, messageId: "33333333333333333" });
  assert.equal(calls.length, 2);
  assert.equal(calls[1].url, "https://discord.com/api/v10/channels/22222222222222222/messages");
  assert.deepEqual(JSON.parse(calls[1].options.body), { content: "Hello Nexora", allowed_mentions: { parse: [] } });
});

test("refuses to send to a channel outside the workspace server", async () => {
  let calls = 0;
  const result = await sendDiscordChannelMessage({
    token: "secret",
    guildId: "11111111111111111",
    channelId: "22222222222222222",
    content: "Do not send",
    fetchImpl: async () => { calls += 1; return Response.json({ guild_id: "99999999999999999", type: 0 }); },
  });
  assert.deepEqual(result, { ok: false, error: "discord_channel_wrong_server" });
  assert.equal(calls, 1);
});

test("returns a clear permission error when Discord denies channel access", async () => {
  const result = await sendDiscordChannelMessage({
    token: "secret",
    guildId: "11111111111111111",
    channelId: "22222222222222222",
    content: "Hello",
    fetchImpl: async () => new Response(null, { status: 403 }),
  });
  assert.deepEqual(result, { ok: false, error: "discord_permission_missing" });
});

test("sends a branded embed and updates the bot nickname when requested", async () => {
  const calls = [];
  const fetchImpl = async (url, options = {}) => {
    calls.push({ url, options });
    if (calls.length === 1) return Response.json({ guild_id: "11111111111111111", type: 0 });
    if (calls.length === 2) return Response.json({ nick: "Nexora News" });
    return Response.json({ id: "33333333333333333" });
  };
  const embed = { title: "Large header", description: "**Important message**", color: 5793266, author: { name: "Nexora Operations" }, footer: { text: "Powered by Nexora" } };
  const result = await sendDiscordChannelMessage({ token: "secret", guildId: "11111111111111111", channelId: "22222222222222222", content: "Important message", embed, botNickname: "Nexora News", fetchImpl });
  assert.equal(result.ok, true);
  assert.equal(calls[1].url, "https://discord.com/api/v10/guilds/11111111111111111/members/@me");
  assert.deepEqual(JSON.parse(calls[1].options.body), { nick: "Nexora News" });
  assert.deepEqual(JSON.parse(calls[2].options.body), { embeds: [embed], allowed_mentions: { parse: [] } });
});
