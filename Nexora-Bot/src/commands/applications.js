import { ChannelType, SlashCommandBuilder } from "discord.js";
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
    .addSubcommand((command) => command.setName("announce").setDescription("Publish an open application in a Discord channel")
      .addStringOption((option) => option.setName("application_id").setDescription("Application ID from the Nexora dashboard").setRequired(true).setMinLength(36).setMaxLength(36))
      .addChannelOption((option) => option.setName("channel").setDescription("Channel that should receive the application").setRequired(true).addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)))
    .setDMPermission(false),
  async execute(interaction, { nexora, config }) {
    const subcommand = interaction.options.getSubcommand();
    if (subcommand === "announce") {
      const application = await nexora.getApplication(interaction.guildId, interaction.user.id, interaction.options.getString("application_id", true));
      const channel = interaction.options.getChannel("channel", true);
      const announcement = embed(application.name, `${application.description || "Applications are now open."}\n\n**Position:** ${application.target_role_name || "Community team"}\n**Application ID:** \`${application.id}\`\n\n[Apply through Nexora](${config.siteUrl}/apply/${application.id})`, 0x111111);
      await channel.send({ embeds: [announcement] });
      await interaction.editReply({ embeds: [embed("Application announced", `Published **${application.name}** in ${channel}.`, colors.success)] });
      return;
    }
    if (subcommand === "decide") {
      const result = await nexora.decideApplication(interaction.guildId, interaction.user.id, {
        submissionId: interaction.options.getString("submission_id", true), decision: interaction.options.getString("decision", true), notes: interaction.options.getString("notes"),
      });
      let roleNote = "";
      const form = Array.isArray(result.application_forms) ? result.application_forms[0] : result.application_forms;
      if (result.status === "approved" && result.applicant_discord_user_id && form?.target_role_id) {
        try {
          const member = await interaction.guild.members.fetch(result.applicant_discord_user_id);
          await member.roles.add(form.target_role_id, `Nexora application approved by ${interaction.user.tag}`);
          roleNote = `\nAssigned **@${form.target_role_name || "application role"}**.`;
        } catch {
          roleNote = "\nThe decision was saved, but Discord could not assign the role. Check the bot role hierarchy and Manage Roles permission.";
        }
      }
      await interaction.editReply({ embeds: [embed(`Application ${result.status}`, `Submission \`${result.id}\` was **${result.status}**.${roleNote}`, result.status === "approved" ? colors.success : colors.warning)] });
      return;
    }
    const applications = await nexora.listApplications(interaction.guildId, interaction.user.id, interaction.options.getString("status"), interaction.options.getInteger("limit") ?? 8);
    const content = applications.length ? applications.map((item) => `**${item.application_forms?.name || "Application"}** · ${item.status}\nApplicant Roblox ID: ${item.applicant_roblox_user_id || "Not linked"}\n\`${item.id}\` · <t:${Math.floor(new Date(item.submitted_at).getTime() / 1000)}:R>`).join("\n\n") : "No matching applications were found.";
    await interaction.editReply({ embeds: [embed("Recent applications", truncate(content, 3900))] });
  },
};
