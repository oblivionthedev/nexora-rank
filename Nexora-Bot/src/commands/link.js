import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { UserError } from "../lib/errors.js";
import { colors, embed } from "../lib/response.js";

export const linkCommand = {
  data: new SlashCommandBuilder()
    .setName("link")
    .setDescription("Connect this Discord server to a Nexora workspace")
    .addStringOption((option) => option.setName("code").setDescription("The NX- code shown in your dashboard").setRequired(true).setMinLength(15).setMaxLength(15))
    .setDMPermission(false),
  async execute(interaction, { nexora }) {
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
      throw new UserError("You need **Manage Server** permission to connect this server.", "discord_manage_server_required");
    }
    const code = interaction.options.getString("code", true).trim().toUpperCase();
    const workspace = await nexora.claimLink({ code, guildId: interaction.guildId, guildName: interaction.guild.name, discordUserId: interaction.user.id });
    await interaction.editReply({ embeds: [embed("Server connected", `**${interaction.guild.name}** is now linked to **${workspace.workspace_name}**.\n\nWorkspace ID: \`${workspace.workspace_id}\``, colors.success)] });
  },
};
