import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";
import { UserError } from "../lib/errors.js";

export const verifyPanelCommand = {
  staffOnly: true,
  data: new SlashCommandBuilder()
    .setName("verifypanel")
    .setDescription("Post the official Nexora account verification panel")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .setDMPermission(false),
  async execute(interaction, { config }) {
    if (interaction.guildId !== config.staffGuildId)
      throw new UserError(
        "The Nexora verification panel can only be posted in the official Nexora server.",
        "official_server_required",
      );
    if (!interaction.channel?.isTextBased())
      throw new UserError(
        "Choose a text channel for the verification panel.",
        "text_channel_required",
      );

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel("Link accounts & verify")
        .setEmoji("✅")
        .setURL(`${config.siteUrl}/verify`)
        .setStyle(ButtonStyle.Link),
    );
    await interaction.channel.send({
      embeds: [
        {
          color: 0x000000,
          title: "Verify your Nexora account",
          description:
            "Press the button below to open **nexorarank.tech/verify**. Connect Discord, authorize Roblox on Roblox's official OAuth page, and complete the membership check to receive server access.\n\n**No password or Roblox cookie is shared.**",
          fields: [
            {
              name: "1 · Open",
              value: "Press **Verify with Nexora** below.",
              inline: true,
            },
            {
              name: "2 · Verify",
              value: "Connect both identities and press **Finish verification** on the website.",
              inline: true,
            },
            {
              name: "3 · Access",
              value: "Receive the Verified role, Roblox nickname sync, and a private receipt.",
              inline: true,
            },
          ],
          footer: { text: "Nexora Rank · Official verification" },
        },
      ],
      components: [row],
    });
    await interaction.editReply({
      content: "The Nexora verification panel is live in this channel.",
    });
  },
};
