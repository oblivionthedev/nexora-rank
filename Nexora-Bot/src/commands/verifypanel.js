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
        .setLabel("Verify with Nexora")
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
            "Press the button below to open **nexorarank.tech/verify**. Authorize Discord there, confirm your connected account, and complete the website check to receive server access.\n\n**No Discord password is shared.** Nexora uses Discord's official authorization flow.",
          fields: [
            {
              name: "1 · Open",
              value: "Press **Verify with Nexora** below.",
              inline: true,
            },
            {
              name: "2 · Verify",
              value: "Authorize Discord and press **Verify me now** on the website.",
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
