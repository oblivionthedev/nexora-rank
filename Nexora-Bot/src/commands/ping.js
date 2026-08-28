import { SlashCommandBuilder } from "discord.js";
import { colors, embed } from "../lib/response.js";

export const pingCommand = {
  data: new SlashCommandBuilder().setName("ping").setDescription("Check Nexora bot latency").setDMPermission(false),
  async execute(interaction) {
    const latency = Math.max(0, Date.now() - interaction.createdTimestamp);
    await interaction.editReply({ embeds: [embed("Nexora is online", `Interaction: **${latency}ms**\nGateway: **${interaction.client.ws.ping}ms**`, colors.success)] });
  },
};
