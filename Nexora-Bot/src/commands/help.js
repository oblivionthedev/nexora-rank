import { SlashCommandBuilder } from "discord.js";
import { embed } from "../lib/response.js";

export const helpCommand = {
  data: new SlashCommandBuilder().setName("help").setDescription("Show the Nexora command guide").setDMPermission(false),
  async execute(interaction) {
    const response = embed("Nexora commands", "Manage your connected Roblox community without leaving Discord.")
      .addFields(
        { name: "Connection", value: "`/setup` — guided setup\n`/link` — connect with a dashboard code\n`/diagnostics` — verify setup and permissions\n`/unlink` — disconnect safely\n`/workspace` — workspace details\n`/status` — service status" },
        { name: "Ranking", value: "`/setrank` — request a rank with autocomplete\n`/rank request` — request a configured rank\n`/rank approve` or `/rank cancel` — review a request\n`/rank roles` — configured ranks\n`/rank history` — recent requests" },
        { name: "Operations", value: "`/user` — inspect a linked member\n`/activity` — recorded staff activity\n`/quota` — configured activity targets\n`/applications list` — pending applications\n`/applications decide` — approve or decline\n`/audit` — workspace, Roblox, bot, and game logs" },
        { name: "Nexora Support", value: "DM the Nexora bot to open a private support conversation. An authorized human agent will reply in the same DM." },
        { name: "Private by default", value: "Command replies are only visible to you. Workspace roles decide which operations you can use." },
      );
    await interaction.editReply({ embeds: [response] });
  },
};
