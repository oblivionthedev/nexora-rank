import { SlashCommandBuilder } from "discord.js";
import { embed, truncate } from "../lib/response.js";

export const auditCommand = {
  data: new SlashCommandBuilder()
    .setName("audit")
    .setDescription("View recent Nexora workspace logs")
    .addStringOption((option) => option.setName("source").setDescription("Filter the log source").addChoices(
      { name: "Workspace", value: "workspace" }, { name: "Roblox group", value: "roblox" },
      { name: "Discord bot", value: "discord" }, { name: "Game", value: "game" },
    ))
    .addIntegerOption((option) => option.setName("limit").setDescription("Number of events").setMinValue(1).setMaxValue(15))
    .setDMPermission(false),
  async execute(interaction, { nexora }) {
    const source = interaction.options.getString("source");
    const limit = interaction.options.getInteger("limit") ?? 8;
    const logs = await nexora.listLogs(interaction.guildId, interaction.user.id, { source, limit });
    const lines = logs.length ? logs.map((log) => `**${truncate(log.summary, 90)}**\n${log.source} · ${log.event_type} · <t:${Math.floor(new Date(log.created_at).getTime() / 1000)}:R>`).join("\n\n") : "No matching events have been recorded.";
    await interaction.editReply({ embeds: [embed("Recent audit events", truncate(lines, 3900))] });
  },
};
