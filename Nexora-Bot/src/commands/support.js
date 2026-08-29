import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { UserError } from "../lib/errors.js";
import { colors, embed } from "../lib/response.js";

export const supportCommand = {
  staffOnly: true,
  data: new SlashCommandBuilder()
    .setName("support")
    .setDescription("Manage the current Nexora Support conversation")
    .setDMPermission(false)
    .addSubcommand((subcommand) => subcommand.setName("close").setDescription("Close this support conversation")
      .addStringOption((option) => option.setName("reason").setDescription("Optional closing note sent to the member").setMaxLength(500))),
  async execute(interaction, { config, support }) {
    if (interaction.guildId !== config.staffGuildId) throw new UserError("Support controls exist only in the Nexora Staff server.", "staff_guild_required");
    const allowed = interaction.user.id === interaction.guild.ownerId || interaction.memberPermissions?.has(PermissionFlagsBits.ManageMessages);
    if (!allowed) throw new UserError("You need Manage Messages permission to close a support conversation.", "support_permission_required");
    const result = await support.closeTicket(interaction.channel, interaction.options.getString("reason") || "Your Nexora Support conversation has been closed.", interaction.user);
    await interaction.editReply({ embeds: [embed("Support conversation closed", `Conversation with **${result.userTag}** was closed and the member was notified.`, colors.neutral)] });
  },
};
