import { ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder } from "discord.js";
import { embed } from "../lib/response.js";

function verificationCommand(name, description, switching = false) {
  return {
    // Guild-scoped to the official Nexora server, but available to every member.
    staffOnly: true,
    data: new SlashCommandBuilder().setName(name).setDescription(description).setDMPermission(false),
    async execute(interaction, { config }) {
      const url = switching
        ? `${config.siteUrl}/auth/roblox/start?next=/verify`
        : `${config.siteUrl}/verify`;
      const response = embed(
        switching ? "Switch your Roblox account" : "Verify with Nexora",
        switching
          ? "Open Nexora to authorize a different Roblox account. Your Discord identity stays connected and your verification updates after you finish the website flow."
          : "Open the official Nexora verification page, connect Discord and Roblox through OAuth, and confirm your community membership. Nexora never asks for your password or Roblox cookie.",
        0x050505,
      ).addFields(
        { name: "1 · Discord", value: "Confirm the Discord account you use in this server.", inline: true },
        { name: "2 · Roblox", value: "Authorize your Roblox identity on Roblox's official page.", inline: true },
        { name: "3 · Access", value: "Receive the Verified role, nickname sync, and a private receipt.", inline: true },
      );
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setLabel(switching ? "Switch Roblox account" : "Open secure verification").setEmoji(switching ? "🔄" : "✅").setURL(url).setStyle(ButtonStyle.Link),
      );
      await interaction.editReply({ embeds: [response], components: [row] });
    },
  };
}

export const verifyCommand = verificationCommand("verify", "Open Nexora account verification");
export const switchCommand = verificationCommand("switch", "Switch the Roblox account linked to Nexora", true);
