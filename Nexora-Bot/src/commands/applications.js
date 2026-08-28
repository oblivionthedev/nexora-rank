import { SlashCommandBuilder } from "discord.js";
import { colors, embed, truncate } from "../lib/response.js";

export const applicationsCommand = {
  data: new SlashCommandBuilder()
    .setName("applications")
    .setDescription("Review Nexora applications")
    .addSubcommand((command) => command.setName("list").setDescription("List recent applications")
      .addStringOption((option) => option.setName("status").setDescription("Application status").addChoices(
        { name: "Submitted", value: "submitted" }, { name: "In review", value: "in_review" }, { name: "Approved", value: "approved" }, { name: "Declined", value: "declined" },
      ))
      .addIntegerOption((option) => option.setName("limit").setDescription("Number of applications").setMinValue(1).setMaxValue(10)))
    .addSubcommand((command) => command.setName("decide").setDescription("Approve or decline an application")
      .addStringOption((option) => option.setName("submission_id").setDescription("Full submission ID").setRequired(true).setMinLength(36).setMaxLength(36))
      .addStringOption((option) => option.setName("decision").setDescription("Decision").setRequired(true).addChoices({ name: "Approve", value: "approve" }, { name: "Decline", value: "decline" }))
      .addStringOption((option) => option.setName("notes").setDescription("Private review notes").setMaxLength(500)))
    .setDMPermission(false),
  async execute(interaction, { nexora }) {
    const subcommand = interaction.options.getSubcommand();
    if (subcommand === "decide") {
      const result = await nexora.decideApplication(interaction.guildId, interaction.user.id, {
        submissionId: interaction.options.getString("submission_id", true), decision: interaction.options.getString("decision", true), notes: interaction.options.getString("notes"),
      });
      await interaction.editReply({ embeds: [embed(`Application ${result.status}`, `Submission \`${result.id}\` was **${result.status}**.`, result.status === "approved" ? colors.success : colors.warning)] });
      return;
    }
    const applications = await nexora.listApplications(interaction.guildId, interaction.user.id, interaction.options.getString("status"), interaction.options.getInteger("limit") ?? 8);
    const content = applications.length ? applications.map((item) => `**${item.application_forms?.name || "Application"}** · ${item.status}\nApplicant Roblox ID: ${item.applicant_roblox_user_id || "Not linked"}\n\`${item.id}\` · <t:${Math.floor(new Date(item.submitted_at).getTime() / 1000)}:R>`).join("\n\n") : "No matching applications were found.";
    await interaction.editReply({ embeds: [embed("Recent applications", truncate(content, 3900))] });
  },
};
