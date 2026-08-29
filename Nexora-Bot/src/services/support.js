import { ChannelType, EmbedBuilder, PermissionFlagsBits } from "discord.js";
import { UserError } from "../lib/errors.js";

const ticketPrefix = "nexora-support:";
const black = 0x000000;

function topicUserId(channel) {
  return channel?.type === ChannelType.GuildText && channel.topic?.startsWith(ticketPrefix)
    ? channel.topic.slice(ticketPrefix.length)
    : null;
}

function attachmentLines(message) {
  return [...message.attachments.values()].map((attachment) => attachment.url).join("\n");
}

export function createSupportService(client, config, logger) {
  async function staffGuild() {
    return client.guilds.fetch(config.staffGuildId);
  }

  async function supportCategory(guild) {
    await guild.channels.fetch();
    let category = guild.channels.cache.find((channel) => channel.type === ChannelType.GuildCategory && channel.name === "Nexora Support");
    if (category) return category;
    const overwrites = [
      { id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
      { id: client.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageChannels, PermissionFlagsBits.ReadMessageHistory] },
    ];
    const supportRole = guild.roles.cache.find((role) => role.name.toLowerCase() === "nexora support");
    if (supportRole) overwrites.push({ id: supportRole.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] });
    category = await guild.channels.create({ name: "Nexora Support", type: ChannelType.GuildCategory, permissionOverwrites: overwrites, reason: "Nexora Support inbox" });
    return category;
  }

  async function ticketFor(user) {
    const guild = await staffGuild();
    await guild.channels.fetch();
    let channel = guild.channels.cache.find((candidate) => topicUserId(candidate) === user.id);
    if (channel) return channel;
    const category = await supportCategory(guild);
    const safeName = user.username.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").slice(0, 45) || "member";
    channel = await guild.channels.create({
      name: `ticket-${safeName}-${user.id.slice(-4)}`,
      type: ChannelType.GuildText,
      parent: category.id,
      topic: `${ticketPrefix}${user.id}`,
      reason: `Nexora Support conversation for ${user.tag}`,
    });
    await channel.send({ embeds: [new EmbedBuilder().setColor(black).setTitle("New Nexora Support conversation").setDescription("Reply normally in this channel. Nexora will deliver staff messages to the member's DMs.").addFields({ name: "Member", value: `${user.tag}\n\`${user.id}\`` }).setThumbnail(user.displayAvatarURL()).setTimestamp()] });
    return channel;
  }

  async function receiveDirectMessage(message) {
    const ticket = await ticketFor(message.author);
    const files = attachmentLines(message);
    const description = [message.content || "*Attachment only*", files].filter(Boolean).join("\n\n").slice(0, 4000);
    await ticket.send({ embeds: [new EmbedBuilder().setColor(black).setAuthor({ name: message.author.globalName || message.author.username, iconURL: message.author.displayAvatarURL() }).setDescription(description).setFooter({ text: `Member · ${message.author.id}` }).setTimestamp()] });
    await message.reply({ embeds: [new EmbedBuilder().setColor(black).setTitle("Nexora Support received your message").setDescription("A support agent will reply here. You can send another message or attachment at any time.").setFooter({ text: "Nexora Support" })] });
    logger.info("Support message received", { userId: message.author.id, channelId: ticket.id });
  }

  async function relayStaffMessage(message) {
    const userId = topicUserId(message.channel);
    if (!userId || message.author.bot || !message.content && !message.attachments.size) return false;
    const user = await client.users.fetch(userId);
    const files = attachmentLines(message);
    const description = [message.content || "*Attachment only*", files].filter(Boolean).join("\n\n").slice(0, 4000);
    await user.send({ embeds: [new EmbedBuilder().setColor(black).setAuthor({ name: message.member?.displayName || message.author.globalName || message.author.username, iconURL: message.author.displayAvatarURL() }).setTitle("Nexora Support").setDescription(description).setFooter({ text: "Reply to continue this conversation" }).setTimestamp()] });
    await message.react("✅").catch(() => undefined);
    return true;
  }

  async function closeTicket(channel, reason, actor) {
    const userId = topicUserId(channel);
    if (!userId) throw new UserError("Use this command inside an open Nexora Support ticket channel.", "support_ticket_required");
    const user = await client.users.fetch(userId);
    await user.send({ embeds: [new EmbedBuilder().setColor(black).setTitle("Nexora Support conversation closed").setDescription(reason).setFooter({ text: "Send a new DM to Nexora whenever you need more help." }).setTimestamp()] }).catch(() => undefined);
    const userTag = user.tag;
    await channel.delete(`Closed by ${actor.tag}`);
    logger.info("Support ticket closed", { userId, actorId: actor.id });
    return { userTag };
  }

  return { receiveDirectMessage, relayStaffMessage, closeTicket };
}
