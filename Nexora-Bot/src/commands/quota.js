import { SlashCommandBuilder } from "discord.js";
import { embed, truncate } from "../lib/response.js";

export const quotaCommand = {
  data: new SlashCommandBuilder().setName("quota").setDescription("View configured activity quotas").setDMPermission(false),
  async execute(interaction, { nexora }) {
    const quotas = await nexora.listQuotas(interaction.guildId, interaction.user.id);
    const content = quotas.length ? quotas.map((item) => `**${item.roleName}**\n${item.minutes_required} minutes ${item.period}${item.grace_minutes ? ` · ${item.grace_minutes} grace minutes` : ""}`).join("\n\n") : "No activity quotas are configured yet.";
    await interaction.editReply({ embeds: [embed("Activity quotas", truncate(content, 3900))] });
  },
};
