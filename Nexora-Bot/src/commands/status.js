import { SlashCommandBuilder } from "discord.js";
import { colors, embed, relativeTime } from "../lib/response.js";

export const statusCommand = {
  data: new SlashCommandBuilder().setName("status").setDescription("Check Nexora and this workspace").setDMPermission(false),
  async execute(interaction, { nexora }) {
    const workspace = await nexora.getWorkspace(interaction.guildId, { allowRestricted: true });
    const active = workspace.operational_status === "active";
    const response = embed(active ? "All workspace operations available" : "Workspace operations disabled", active
      ? "The bot is connected and this workspace is operational."
      : `Status: **${workspace.moderation_status}**\nReason: ${workspace.moderation_reason || "No reason provided"}\nEnds: ${relativeTime(workspace.moderation_expires_at)}`,
    active ? colors.success : colors.danger).addFields(
      { name: "Workspace", value: workspace.name, inline: true },
      { name: "Workspace ID", value: `\`${workspace.public_id}\``, inline: true },
      { name: "Gateway", value: `${interaction.client.ws.ping}ms`, inline: true },
    );
    await interaction.editReply({ embeds: [response] });
  },
};
