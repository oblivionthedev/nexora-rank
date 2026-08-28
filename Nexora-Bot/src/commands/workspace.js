import { SlashCommandBuilder } from "discord.js";
import { colors, embed } from "../lib/response.js";

export const workspaceCommand = {
  data: new SlashCommandBuilder().setName("workspace").setDescription("View this server's Nexora workspace").setDMPermission(false),
  async execute(interaction, { nexora, config }) {
    const { workspace, actor, counts } = await nexora.workspaceSummary(interaction.guildId, interaction.user.id);
    const response = embed(workspace.name, `You have **${actor.role}** access in this workspace.`, workspace.operational_status === "active" ? colors.roseGold : colors.danger)
      .addFields(
        { name: "Workspace ID", value: `\`${workspace.public_id}\``, inline: true },
        { name: "Roblox group", value: workspace.roblox_group_name || workspace.roblox_group_id || "Not connected", inline: true },
        { name: "Status", value: workspace.moderation_status === "clear" ? "Operational" : workspace.moderation_status, inline: true },
        { name: "Members", value: String(counts.members), inline: true },
        { name: "Rank operations", value: String(counts.ranks), inline: true },
        { name: "Activity sessions", value: String(counts.sessions), inline: true },
      )
      .setURL(`${config.siteUrl}/dashboard/${workspace.public_id}`);
    await interaction.editReply({ embeds: [response] });
  },
};
