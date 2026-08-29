import { randomInt } from "node:crypto";
import { SlashCommandBuilder } from "discord.js";
import { UserError } from "../lib/errors.js";
import { colors, embed, relativeTime } from "../lib/response.js";

const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generateCode() {
  return Array.from(
    { length: 25 },
    () => alphabet[randomInt(alphabet.length)],
  ).join("");
}

export const loginCommand = {
  staffOnly: true,
  data: new SlashCommandBuilder()
    .setName("login")
    .setDescription("Manage secure Nexora Staff authorization")
    .setDMPermission(false)
    .addSubcommand((subcommand) =>
      subcommand
        .setName("create")
        .setDescription("Create a private one-time Staff login code")
        .addStringOption((option) =>
          option
            .setName("role")
            .setDescription("Access granted for this Staff session")
            .setRequired(true)
            .addChoices(
              { name: "Support", value: "support" },
              { name: "Moderator", value: "moderator" },
              { name: "Administrator", value: "admin" },
            ),
        ),
    ),
  async execute(interaction, { config, nexora }) {
    if (interaction.guildId !== config.staffGuildId) {
      throw new UserError(
        "This command exists only in the private Nexora Staff server.",
        "staff_guild_required",
      );
    }
    if (interaction.user.id !== config.authorizationOwnerId) {
      throw new UserError(
        "Only the Nexora owner can create Staff login codes.",
        "authorization_owner_required",
      );
    }

    const role = interaction.options.getString("role", true);
    const code = generateCode();
    const result = await nexora.createStaffAccessCode({
      code,
      guildId: interaction.guildId,
      creatorDiscordId: interaction.user.id,
      role,
    });
    const privateCode = embed(
      "Private Nexora Staff login",
      `Send this code only to the person you want to authorize.\n\n\`${code}\`\n\nThey must enter it at [nexorarank.tech/staff/login](${config.siteUrl}/staff/login) and then authorize their own Discord account.`,
      colors.neutral,
    ).addFields(
      {
        name: "Access",
        value: role[0].toUpperCase() + role.slice(1),
        inline: true,
      },
      { name: "Expires", value: relativeTime(result.expires_at), inline: true },
      {
        name: "Security",
        value: "25 characters · one use · expires automatically",
      },
    );

    try {
      await interaction.user.send({ embeds: [privateCode] });
    } catch {
      throw new UserError(
        "I could not DM you. Allow direct messages from this server, then run the command again.",
        "owner_dm_closed",
      );
    }

    await interaction.editReply({
      embeds: [
        embed(
          "Login code sent privately",
          "Check your direct messages from Nexora. The code was not posted in this server.",
          colors.success,
        ),
      ],
    });
  },
};
