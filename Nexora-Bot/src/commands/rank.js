import { SlashCommandBuilder } from "discord.js";
import { colors, embed, truncate } from "../lib/response.js";

export const rankCommand = {
  data: new SlashCommandBuilder()
    .setName("rank")
    .setDescription("Request and review Roblox rank operations")
    .addSubcommand((command) => command.setName("request").setDescription("Request a configured Roblox rank")
      .addStringOption((option) => option.setName("username").setDescription("Roblox username").setRequired(true).setMinLength(3).setMaxLength(20))
      .addStringOption((option) => option.setName("rank").setDescription("Configured Roblox rank name").setRequired(true).setMinLength(1).setMaxLength(100))
      .addStringOption((option) => option.setName("reason").setDescription("Why this rank is being requested").setRequired(true).setMinLength(2).setMaxLength(500)))
    .addSubcommand((command) => command.setName("approve").setDescription("Approve a pending rank request")
      .addStringOption((option) => option.setName("request_id").setDescription("Full request ID from rank history").setRequired(true).setMinLength(36).setMaxLength(36)))
    .addSubcommand((command) => command.setName("cancel").setDescription("Cancel a pending rank request")
      .addStringOption((option) => option.setName("request_id").setDescription("Full request ID from rank history").setRequired(true).setMinLength(36).setMaxLength(36))
      .addStringOption((option) => option.setName("reason").setDescription("Why the request is cancelled").setRequired(true).setMinLength(2).setMaxLength(100)))
    .addSubcommand((command) => command.setName("roles").setDescription("List the workspace's configured ranks"))
    .addSubcommand((command) => command.setName("history").setDescription("View recent rank requests")
      .addIntegerOption((option) => option.setName("limit").setDescription("Number of requests").setMinValue(1).setMaxValue(10)))
    .setDMPermission(false),
  async execute(interaction, { nexora }) {
    const subcommand = interaction.options.getSubcommand();
    if (subcommand === "request") {
      const result = await nexora.requestRank(interaction.guildId, interaction.user.id, {
        username: interaction.options.getString("username", true), rankName: interaction.options.getString("rank", true), reason: interaction.options.getString("reason", true),
      });
      const waiting = result.status === "pending";
      await interaction.editReply({ embeds: [embed(waiting ? "Rank request awaiting review" : "Rank request approved", `**${result.target_username}** → **${result.to_role_name}**\nRequest ID: \`${result.id}\``, waiting ? colors.warning : colors.success)] });
      return;
    }
    if (subcommand === "approve" || subcommand === "cancel") {
      const result = await nexora.reviewRank(interaction.guildId, interaction.user.id, {
        actionId: interaction.options.getString("request_id", true), decision: subcommand, reason: interaction.options.getString("reason"),
      });
      await interaction.editReply({ embeds: [embed(`Rank request ${result.status}`, `**${result.target_username}** → **${result.to_role_name}**`, result.status === "approved" ? colors.success : colors.warning)] });
      return;
    }
    if (subcommand === "roles") {
      const roles = await nexora.listRankBindings(interaction.guildId, interaction.user.id);
      const content = roles.length ? roles.map((role) => `**${role.roblox_role_name}** · ID ${role.roblox_role_id}${role.requires_approval ? " · approval required" : ""}`).join("\n") : "No rank bindings are configured yet.";
      await interaction.editReply({ embeds: [embed("Configured Roblox ranks", truncate(content, 3900))] });
      return;
    }
    const history = await nexora.listRankHistory(interaction.guildId, interaction.user.id, interaction.options.getInteger("limit") ?? 8);
    const content = history.length ? history.map((item) => `**${item.target_username}** → ${item.to_role_name} · **${item.status}**\n\`${item.id}\` · <t:${Math.floor(new Date(item.requested_at).getTime() / 1000)}:R>`).join("\n\n") : "No rank requests have been recorded.";
    await interaction.editReply({ embeds: [embed("Recent rank requests", truncate(content, 3900))] });
  },
};
