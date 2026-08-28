import { SlashCommandBuilder } from "discord.js";
import { embed } from "../lib/response.js";

export const userCommand = {
  data: new SlashCommandBuilder().setName("user").setDescription("Inspect a member's linked Nexora accounts")
    .addUserOption((option) => option.setName("member").setDescription("Discord member to inspect"))
    .setDMPermission(false),
  async execute(interaction, { nexora }) {
    const member = interaction.options.getUser("member") || interaction.user;
    const account = await nexora.inspectLinkedUser(interaction.guildId, interaction.user.id, member.id);
    const response = embed("Linked account", `Account details for <@${member.id}>.`).addFields(
      { name: "Discord", value: account.discord?.display_name || account.discord?.username || member.username, inline: true },
      { name: "Roblox", value: account.roblox ? `${account.roblox.display_name || account.roblox.username}\nID: \`${account.roblox.provider_user_id}\`` : "Not linked", inline: true },
      { name: "Workspace role", value: account.workspaceRole || "Not a workspace member", inline: true },
    );
    await interaction.editReply({ embeds: [response] });
  },
};
