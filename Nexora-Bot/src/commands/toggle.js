import { SlashCommandBuilder } from "discord.js";
import { UserError } from "../lib/errors.js";
import { colors, embed } from "../lib/response.js";

export const toggleCommand = {
  staffOnly: true,
  data: new SlashCommandBuilder()
    .setName("toggle")
    .setDescription("Change a live Nexora platform switch")
    .setDMPermission(false)
    .addSubcommand((subcommand) =>
      subcommand
        .setName("beta")
        .setDescription("Open or close Nexora Beta applications")
        .addBooleanOption((option) =>
          option
            .setName("enabled")
            .setDescription("On accepts new applications; off closes the form")
            .setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("workspaces")
        .setDescription("Allow or pause new workspace creation")
        .addBooleanOption((option) =>
          option
            .setName("enabled")
            .setDescription(
              "On allows selected Beta users to create workspaces",
            )
            .setRequired(true),
        ),
    ),
  async execute(interaction, { config, nexora }) {
    if (
      interaction.guildId !== config.staffGuildId ||
      interaction.user.id !== config.authorizationOwnerId
    ) {
      throw new UserError(
        "Only the Nexora owner can change live platform switches.",
        "authorization_owner_required",
      );
    }

    const enabled = interaction.options.getBoolean("enabled", true);
    const switchName = interaction.options.getSubcommand(true);
    const isBeta = switchName === "beta";
    const state = isBeta
      ? await nexora.setBetaEnabled({
          enabled,
          actorDiscordId: interaction.user.id,
        })
      : await nexora.setWorkspaceCreationEnabled({
          enabled,
          actorDiscordId: interaction.user.id,
        });
    const statusEmbed = embed(
      isBeta
        ? enabled
          ? "Nexora Beta opened"
          : "Nexora Beta closed"
        : enabled
          ? "Workspace creation opened"
          : "Workspace creation paused",
      isBeta
        ? enabled
          ? "The website is now accepting new Beta applications."
          : "The application form is now closed. Existing applicants can still check their status."
        : enabled
          ? "Selected Beta users can now create workspaces. Staff access remains available."
          : "New workspace creation is paused for Beta users. Staff access and existing data are unaffected.",
      colors.neutral,
    )
      .setFooter({ text: `Changed by ${interaction.user.tag}` })
      .setTimestamp(new Date(state.updated_at || Date.now()));

    const channel = await interaction.client.channels
      .fetch(config.providerStatusChannelId)
      .catch(() => null);
    if (channel?.isTextBased()) await channel.send({ embeds: [statusEmbed] });
    await interaction.editReply({ embeds: [statusEmbed] });
  },
};
