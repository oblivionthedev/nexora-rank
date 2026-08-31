import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { UserError } from "../lib/errors.js";
import { colors, embed } from "../lib/response.js";

export const unlinkCommand = {
  data: new SlashCommandBuilder()
    .setName("unlink")
    .setDescription("Disconnect this Discord server from Nexora")
    .addStringOption((option) =>
      option
        .setName("confirm")
        .setDescription("Type DISCONNECT to confirm")
        .setRequired(true),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .setDMPermission(false),
  async execute(interaction, { nexora }) {
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
      throw new UserError(
        "You need **Manage Server** permission to disconnect this server.",
        "discord_manage_server_required",
      );
    }
    if (
      interaction.options.getString("confirm", true).trim().toUpperCase() !==
      "DISCONNECT"
    ) {
      return interaction.editReply({
        embeds: [
          embed(
            "Confirmation required",
            "Run the command again and type **DISCONNECT**.",
            colors.warning,
          ),
        ],
      });
    }
    await nexora.disconnectGuild(interaction.guildId, interaction.user.id);
    await interaction.editReply({
      embeds: [
        embed(
          "Server disconnected",
          "This Discord server is no longer linked to a Nexora workspace. You can reconnect it with a new code from Dashboard → Connections.",
          colors.warning,
        ),
      ],
    });
  },
};
