import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";
import { UserError } from "../lib/errors.js";

export const VERIFY_BUTTON_ID = "nexora_verify_identity";

export const verifyPanelCommand = {
  staffOnly: true,
  data: new SlashCommandBuilder()
    .setName("verifypanel")
    .setDescription("Post the official Nexora account verification panel")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .setDMPermission(false),
  async execute(interaction, { config }) {
    if (interaction.guildId !== config.staffGuildId)
      throw new UserError("The Nexora verification panel can only be posted in the official Nexora server.", "official_server_required");
    if (!interaction.channel?.isTextBased())
      throw new UserError("Choose a text channel for the verification panel.", "text_channel_required");

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(VERIFY_BUTTON_ID)
        .setLabel("Verify with Nexora")
        .setEmoji("✅")
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setLabel("Open Nexora")
        .setURL(`${config.siteUrl}/login?next=/dashboard`)
        .setStyle(ButtonStyle.Link),
    );
    await interaction.channel.send({
      embeds: [
        {
          color: 0x000000,
          title: "Verify your Nexora account",
          description:
            "Connect your Discord identity to Nexora, then press **Verify with Nexora**. Verified members receive the official role instantly.\n\n**No Discord password is shared.** Nexora checks only the Discord identity connected through official authorization.",
          fields: [
            { name: "1 · Connect", value: "Open Nexora and sign in with Discord.", inline: true },
            { name: "2 · Verify", value: "Return here and press the green button.", inline: true },
          ],
          footer: { text: "Nexora Rank · Official verification" },
        },
      ],
      components: [row],
    });
    await interaction.editReply({ content: "The Nexora verification panel is live in this channel." });
  },
};
