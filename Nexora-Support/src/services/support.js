import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  PermissionFlagsBits,
} from "discord.js";
import { supportEmbed } from "../lib/response.js";

const categoryName = "Nexora Support";
const roleName = "Nexora Support";
const transcriptName = "support-transcripts";
const logsName = "support-logs";
const ticketPrefix = "nexora-support:";

function userIdFromTicket(channel) {
  return channel?.type === ChannelType.GuildText &&
    channel.topic?.startsWith(ticketPrefix)
    ? channel.topic.slice(ticketPrefix.length).split(";")[0]
    : null;
}

function safeChannelName(value) {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 48) || "member"
  );
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

async function allMessages(channel) {
  const messages = [];
  let before;
  for (;;) {
    const batch = await channel.messages.fetch({ limit: 100, before });
    if (!batch.size) break;
    messages.push(...batch.values());
    before = batch.last().id;
    if (batch.size < 100) break;
  }
  return messages.sort(
    (left, right) => left.createdTimestamp - right.createdTimestamp,
  );
}

function transcriptDocument(channel, messages) {
  const rows = messages
    .map((message) => {
      const attachments = [...message.attachments.values()]
        .map(
          (attachment) =>
            `<a href="${escapeHtml(attachment.url)}">Attachment</a>`,
        )
        .join(" · ");
      return `<article><header><b>${escapeHtml(message.author.tag)}</b><time>${message.createdAt.toISOString()}</time></header><p>${escapeHtml(message.cleanContent || "Attachment only")}</p>${attachments}</article>`;
    })
    .join("\n");
  return `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(channel.name)}</title><style>body{background:#080606;color:#f7f2f2;font:15px system-ui;margin:0;padding:40px}main{max-width:900px;margin:auto}h1{font-size:32px}article{border-top:1px solid #2d2727;padding:18px 0}header{display:flex;justify-content:space-between;gap:20px}time{color:#8e8484;font-size:12px}p{white-space:pre-wrap;line-height:1.7}a{color:#e9b7b7}</style></head><body><main><h1>Nexora Support transcript</h1><p>${escapeHtml(channel.name)} · ${messages.length} messages</p>${rows}</main></body></html>`;
}

export function createSupportService(client, config, logger) {
  async function guild() {
    return client.guilds.fetch(config.supportGuildId);
  }

  async function setup(actor) {
    const target = await guild();
    await Promise.all([target.channels.fetch(), target.roles.fetch()]);
    let role = target.roles.cache.find((item) => item.name === roleName);
    if (!role) {
      role = await target.roles.create({
        name: roleName,
        color: 0xd7a1a1,
        mentionable: true,
        reason: `Nexora Support setup by ${actor.tag}`,
      });
    }

    let category = target.channels.cache.find(
      (item) =>
        item.type === ChannelType.GuildCategory && item.name === categoryName,
    );
    if (!category) {
      category = await target.channels.create({
        name: categoryName,
        type: ChannelType.GuildCategory,
        permissionOverwrites: [
          {
            id: target.roles.everyone.id,
            deny: [PermissionFlagsBits.ViewChannel],
          },
          {
            id: role.id,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.ReadMessageHistory,
              PermissionFlagsBits.AttachFiles,
            ],
          },
          {
            id: client.user.id,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.ReadMessageHistory,
              PermissionFlagsBits.ManageChannels,
              PermissionFlagsBits.AttachFiles,
            ],
          },
        ],
        reason: `Nexora Support setup by ${actor.tag}`,
      });
    }

    async function ensureChannel(name) {
      let channel = target.channels.cache.find(
        (item) =>
          item.type === ChannelType.GuildText &&
          item.parentId === category.id &&
          item.name === name,
      );
      if (!channel) {
        channel = await target.channels.create({
          name,
          type: ChannelType.GuildText,
          parent: category.id,
          reason: `Nexora Support setup by ${actor.tag}`,
        });
      }
      return channel;
    }

    const [transcripts, logs] = await Promise.all([
      ensureChannel(transcriptName),
      ensureChannel(logsName),
    ]);
    await logs.send({
      embeds: [
        supportEmbed(
          "Support system ready",
          `Tickets will open under **${category.name}**. Closed conversations will be saved in ${transcripts}. Agents need the ${role} role.`,
        ),
      ],
    });
    return { target, role, category, transcripts, logs };
  }

  async function resources() {
    const target = await guild();
    await Promise.all([target.channels.fetch(), target.roles.fetch()]);
    const category = target.channels.cache.find(
      (item) =>
        item.type === ChannelType.GuildCategory && item.name === categoryName,
    );
    const role = target.roles.cache.find((item) => item.name === roleName);
    const transcripts = target.channels.cache.find(
      (item) =>
        item.type === ChannelType.GuildText && item.name === transcriptName,
    );
    const logs = target.channels.cache.find(
      (item) => item.type === ChannelType.GuildText && item.name === logsName,
    );
    if (!category || !role || !transcripts || !logs) return null;
    return { target, role, category, transcripts, logs };
  }

  async function sendPanel(channel, actor) {
    const configured = (await resources()) || (await setup(actor));
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel("Message Nexora Support")
        .setStyle(ButtonStyle.Link)
        .setURL(`https://discord.com/users/${client.user.id}`),
    );
    const message = await channel.send({
      embeds: [
        supportEmbed(
          "Need help with Nexora?",
          "Send this bot a direct message. A private conversation will open for the Nexora Support team, and every reply will stay between you and the assigned agents.",
        ).addFields(
          {
            name: "Private",
            value:
              "Your messages are visible only to authorized Support agents.",
            inline: true,
          },
          {
            name: "Recorded",
            value: "A transcript is saved when the conversation closes.",
            inline: true,
          },
        ),
      ],
      components: [row],
    });
    await configured.logs.send({
      embeds: [
        supportEmbed(
          "Support panel published",
          `${actor.tag} published a panel in ${channel}.`,
        ),
      ],
    });
    return message;
  }

  async function ticketFor(user) {
    const configured = await resources();
    if (!configured) throw new Error("support_not_configured");
    let ticket = configured.target.channels.cache.find(
      (item) => userIdFromTicket(item) === user.id,
    );
    if (ticket) return { ticket, configured, created: false };
    ticket = await configured.target.channels.create({
      name: `ticket-${safeChannelName(user.globalName || user.username)}-${user.id.slice(-4)}`,
      type: ChannelType.GuildText,
      parent: configured.category.id,
      topic: `${ticketPrefix}${user.id}`,
      reason: `Support conversation for ${user.tag}`,
    });
    const controls = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("ticket:claim")
        .setLabel("Claim")
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId("ticket:close")
        .setLabel("Close & transcript")
        .setStyle(ButtonStyle.Danger),
    );
    await ticket.send({
      content: configured.role.toString(),
      embeds: [
        supportEmbed(
          "New support conversation",
          "Reply normally in this channel to message the member. Claim the ticket when you begin, and close it when the issue is resolved.",
        )
          .setAuthor({
            name: user.globalName || user.username,
            iconURL: user.displayAvatarURL(),
          })
          .addFields({ name: "Member", value: `${user.tag}\n\`${user.id}\`` }),
      ],
      components: [controls],
      allowedMentions: { roles: [configured.role.id] },
    });
    await configured.logs.send({
      embeds: [supportEmbed("Ticket opened", `${user.tag} opened ${ticket}.`)],
    });
    return { ticket, configured, created: true };
  }

  async function receiveDm(message) {
    const { ticket, created } = await ticketFor(message.author);
    const attachments = [...message.attachments.values()]
      .map((item) => item.url)
      .join("\n");
    const description = [message.content || "Attachment only", attachments]
      .filter(Boolean)
      .join("\n\n")
      .slice(0, 4000);
    await ticket.send({
      embeds: [
        supportEmbed("Member message", description).setAuthor({
          name: message.author.globalName || message.author.username,
          iconURL: message.author.displayAvatarURL(),
        }),
      ],
    });
    await message.reply({
      embeds: [
        supportEmbed(
          created ? "Support conversation opened" : "Message delivered",
          created
            ? "Your private ticket is open. A Nexora Support agent will reply here as soon as possible."
            : "Your message was added to the open conversation.",
        ),
      ],
    });
  }

  async function relayAgentMessage(message) {
    const userId = userIdFromTicket(message.channel);
    if (!userId || message.author.bot) return false;
    const configured = await resources();
    const isAgent =
      message.member?.roles.cache.has(configured?.role.id) ||
      message.member?.permissions.has(PermissionFlagsBits.ManageGuild);
    if (!isAgent) return false;
    const user = await client.users.fetch(userId);
    const attachments = [...message.attachments.values()]
      .map((item) => item.url)
      .join("\n");
    const description = [message.content || "Attachment only", attachments]
      .filter(Boolean)
      .join("\n\n")
      .slice(0, 4000);
    await user.send({
      embeds: [
        supportEmbed("Nexora Support", description).setAuthor({
          name: message.member?.displayName || message.author.username,
          iconURL: message.author.displayAvatarURL(),
        }),
      ],
    });
    await message.react("✅").catch(() => undefined);
    return true;
  }

  async function requireAgent(interaction) {
    const configured = await resources();
    if (!configured) throw new Error("support_not_configured");
    const member = await configured.target.members.fetch(interaction.user.id);
    if (
      !member.roles.cache.has(configured.role.id) &&
      !member.permissions.has(PermissionFlagsBits.ManageGuild)
    ) {
      throw new Error("support_agent_required");
    }
    return configured;
  }

  async function claim(channel, actor) {
    const userId = userIdFromTicket(channel);
    if (!userId) throw new Error("ticket_required");
    const baseTopic = `${ticketPrefix}${userId}`;
    await channel.setTopic(`${baseTopic};claimed=${actor.id}`);
    await channel.send({
      embeds: [
        supportEmbed(
          "Ticket claimed",
          `${actor} is handling this conversation.`,
        ),
      ],
    });
  }

  async function close(channel, actor, reason = "Conversation resolved") {
    const userId = userIdFromTicket(channel);
    if (!userId) throw new Error("ticket_required");
    const configured = await resources();
    const user = await client.users.fetch(userId);
    const messages = await allMessages(channel);
    const html = transcriptDocument(channel, messages);
    const transcriptMessage = await configured.transcripts.send({
      embeds: [
        supportEmbed(
          "Support transcript",
          `**Member:** ${user.tag} (\`${user.id}\`)\n**Closed by:** ${actor.tag}\n**Reason:** ${reason}\n**Messages:** ${messages.length}`,
        ),
      ],
      files: [{ attachment: Buffer.from(html), name: `${channel.name}.html` }],
    });
    await configured.logs.send({
      embeds: [
        supportEmbed(
          "Ticket closed",
          `${actor.tag} closed **${channel.name}**. [Open transcript](${transcriptMessage.url})`,
        ),
      ],
    });
    await user
      .send({
        embeds: [
          supportEmbed(
            "Support conversation closed",
            `${reason}\n\nSend another DM whenever you need more help.`,
          ),
        ],
      })
      .catch(() => undefined);
    await channel.delete(`Closed by ${actor.tag}: ${reason}`);
  }

  return {
    setup,
    resources,
    sendPanel,
    receiveDm,
    relayAgentMessage,
    requireAgent,
    claim,
    close,
    userIdFromTicket,
  };
}
