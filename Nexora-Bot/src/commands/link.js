import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { UserError } from "../lib/errors.js";
import { colors, embed } from "../lib/response.js";

export const linkCommand = {
  data: new SlashCommandBuilder()
    .setName("link")
    .setDescription("Connect this Discord server to a Nexora workspace")
    .addStringOption((option) => option.setName("code").setDescription("Paste the plan-specific NX code shown in your dashboard").setRequired(true).setMinLength(24).setMaxLength(64))
    .setDMPermission(false),
  async execute(interaction, { nexora }) {
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
      throw new UserError("You need **Manage Server** permission to connect this server.", "discord_manage_server_required");
    }
    const entered = interaction.options.getString("code", true).trim().toUpperCase();
    const code = entered.match(/NX-(?:FREE|BASIC|PLUS|PREMIUM|PRO|ENTERPRISE)-[A-F0-9]{16}/)?.[0];
    if (!code) {
      throw new UserError(
        "Paste the complete plan link code from **Dashboard → Connections**. It starts with `NX-`.",
        "invalid_link_code",
      );
    }
    const workspace = await nexora.claimLink({ code, guildId: interaction.guildId, guildName: interaction.guild.name, discordUserId: interaction.user.id });
    const plan = workspace.plan_tier ? `${workspace.plan_tier.charAt(0).toUpperCase()}${workspace.plan_tier.slice(1)} plan` : "workspace plan";
    await interaction.editReply({ embeds: [embed("Server connected", `**${interaction.guild.name}** is now linked to **${workspace.workspace_name}** with its **${plan}** code.\n\nWorkspace ID: \`${workspace.workspace_id}\``, colors.success)] });
  },
};
