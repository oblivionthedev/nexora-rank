import { SlashCommandBuilder } from "discord.js";
import { supportEmbed } from "../lib/response.js";

export const ticketCommand = {
  data: new SlashCommandBuilder()
    .setName("ticket")
    .setDescription("Manage an open Nexora Support conversation")
    .setDMPermission(false)
    .addSubcommand((command) =>
      command.setName("claim").setDescription("Assign this ticket to yourself"),
    )
    .addSubcommand((command) =>
      command
        .setName("close")
        .setDescription("Close the ticket with the default resolution"),
    )
    .addSubcommand((command) =>
      command
        .setName("close-reason")
        .setDescription("Close the ticket with a reason")
        .addStringOption((option) =>
          option
            .setName("reason")
            .setDescription("Resolution shown to the member")
            .setMaxLength(300)
            .setRequired(true),
        ),
    )
    .addSubcommand((command) =>
      command.setName("ask-close").setDescription("Ask the member to close the conversation"),
    )
    .addSubcommand((command) =>
      command
        .setName("rename")
        .setDescription("Rename this ticket channel")
        .addStringOption((option) =>
          option
            .setName("name")
            .setDescription("New ticket name")
            .setMinLength(2)
            .setMaxLength(70)
            .setRequired(true),
        ),
    )
    .addSubcommand((command) =>
      command
        .setName("add")
        .setDescription("Give another person access to this ticket")
        .addUserOption((option) =>
          option
            .setName("user")
            .setDescription("Person to add")
            .setRequired(true),
        ),
    )
    .addSubcommand((command) =>
      command
        .setName("remove")
        .setDescription("Remove a person from this ticket")
        .addUserOption((option) =>
          option
            .setName("user")
            .setDescription("Person to remove")
            .setRequired(true),
        ),
    ),
  async execute(interaction, { support }) {
    await support.requireAgent(interaction);
    if (!support.userIdFromTicket(interaction.channel))
      throw new Error("ticket_required");
    const action = interaction.options.getSubcommand();

    if (action === "claim") {
      await support.claim(interaction.channel, interaction.user);
      await interaction.editReply({
        embeds: [
          supportEmbed(
            "Ticket claimed",
            "This conversation is assigned to you.",
          ),
        ],
      });
      return;
    }
    if (action === "close" || action === "close-reason") {
      const reason = action === "close-reason"
        ? interaction.options.getString("reason", true)
        : "Conversation resolved";
      await interaction.editReply({
        embeds: [
          supportEmbed(
            "Closing ticket",
            "Creating the transcript and notifying the member…",
          ),
        ],
      });
      await support.close(interaction.channel, interaction.user, reason);
      return;
    }
    if (action === "ask-close") {
      await support.askMemberToClose(interaction.channel, interaction.user);
      await interaction.editReply({ embeds: [supportEmbed("Confirmation requested", "The member received a private close button.")] });
      return;
    }
    if (action === "rename") {
      const name = interaction.options
        .getString("name", true)
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, "-")
        .replace(/-+/g, "-")
        .slice(0, 70);
      await interaction.channel.setName(name || "support-ticket");
      await interaction.editReply({
        embeds: [
          supportEmbed(
            "Ticket renamed",
            `This channel is now **${interaction.channel.name}**.`,
          ),
        ],
      });
      return;
    }

    const user = interaction.options.getUser("user", true);
    if (action === "add") {
      await interaction.channel.permissionOverwrites.edit(user.id, {
        ViewChannel: true,
        SendMessages: true,
        ReadMessageHistory: true,
      });
      await interaction.editReply({
        embeds: [
          supportEmbed("Person added", `${user} can now view this ticket.`),
        ],
      });
      return;
    }
    await interaction.channel.permissionOverwrites.delete(user.id);
    await interaction.editReply({
      embeds: [
        supportEmbed(
          "Person removed",
          `${user} can no longer view this ticket.`,
        ),
      ],
    });
  },
};
