import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { supportEmbed } from "../lib/response.js";

export const setupCommand = {
  data: new SlashCommandBuilder()
    .setName("setup")
    .setDescription("Create the organized Nexora Support ticket system")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .setDMPermission(false),
  async execute(interaction, { support }) {
    const configured = await support.setup(interaction.user);
    await interaction.editReply({
      embeds: [
        supportEmbed(
          "Nexora Support is ready",
          `Created or verified:\n• ${configured.category.name} ticket category\n• ${configured.role} agent role\n• ${configured.transcripts} transcript archive\n• ${configured.logs} action log\n\nUse \`/panel\` in a public help channel next.`,
        ),
      ],
    });
  },
};
