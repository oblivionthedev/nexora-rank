import { SlashCommandBuilder } from "discord.js";
import { embed } from "../lib/response.js";

export const activityCommand = {
  data: new SlashCommandBuilder()
    .setName("activity")
    .setDescription("View recorded Roblox activity")
    .addStringOption((option) => option.setName("username").setDescription("Roblox username; omit to use your linked account").setMinLength(3).setMaxLength(20))
    .addIntegerOption((option) => option.setName("days").setDescription("Activity window").setMinValue(1).setMaxValue(90))
    .setDMPermission(false),
  async execute(interaction, { nexora }) {
    const result = await nexora.activitySummary(interaction.guildId, interaction.user.id, { username: interaction.options.getString("username"), days: interaction.options.getInteger("days") ?? 7 });
    await interaction.editReply({ embeds: [embed(`${result.target.username}'s activity`, `**${result.minutes.toLocaleString()} minutes** across **${result.sessions} sessions** during the last **${result.days} days**.`)] });
  },
};
