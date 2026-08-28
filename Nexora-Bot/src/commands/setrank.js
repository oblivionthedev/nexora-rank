import { SlashCommandBuilder } from "discord.js";
import { colors, embed } from "../lib/response.js";

export const setrankCommand = {
  data: new SlashCommandBuilder().setName("setrank").setDescription("Request a configured Roblox rank")
    .addStringOption((option) => option.setName("username").setDescription("Roblox username").setRequired(true).setMinLength(3).setMaxLength(20))
    .addStringOption((option) => option.setName("rank").setDescription("Configured Roblox rank").setRequired(true).setAutocomplete(true))
    .addStringOption((option) => option.setName("reason").setDescription("Optional reason").setMinLength(2).setMaxLength(500))
    .setDMPermission(false),
  async autocomplete(interaction, { nexora }) {
    const focused = interaction.options.getFocused().toLowerCase();
    const roles = await nexora.listRankBindings(interaction.guildId, interaction.user.id);
    await interaction.respond(roles.filter((role) => role.roblox_role_name.toLowerCase().includes(focused)).slice(0, 25).map((role) => ({ name: role.roblox_role_name, value: role.roblox_role_name })));
  },
  async execute(interaction, { nexora }) {
    const result = await nexora.requestRank(interaction.guildId, interaction.user.id, {
      username: interaction.options.getString("username", true),
      rankName: interaction.options.getString("rank", true),
      reason: interaction.options.getString("reason") || "Discord setrank request",
    });
    const waiting = result.status === "pending";
    await interaction.editReply({ embeds: [embed(waiting ? "Rank request awaiting review" : "Rank request approved", `**${result.target_username}** → **${result.to_role_name}**\nRequest ID: \`${result.id}\``, waiting ? colors.warning : colors.success)] });
  },
};
