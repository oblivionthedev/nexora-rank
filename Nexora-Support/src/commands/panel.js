import {
  ChannelType,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";
import { supportEmbed } from "../lib/response.js";

export const panelCommand = {
  data: new SlashCommandBuilder()
    .setName("panel")
    .setDescription("Publish the Nexora Support DM panel")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .setDMPermission(false)
    .addChannelOption((option) =>
      option
        .setName("channel")
        .setDescription("Channel for the public Support panel")
        .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement),
    ),
  async execute(interaction, { support }) {
    const channel =
      interaction.options.getChannel("channel") || interaction.channel;
    if (!channel?.isTextBased()) throw new Error("panel_channel_required");
    const message = await support.sendPanel(channel, interaction.user);
    await interaction.editReply({
      embeds: [
        supportEmbed(
          "Support panel published",
          `The DM Support panel is now live in ${channel}. [Open panel](${message.url})`,
        ),
      ],
    });
  },
};
