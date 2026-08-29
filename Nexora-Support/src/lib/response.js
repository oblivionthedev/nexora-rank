import { EmbedBuilder } from "discord.js";

export function supportEmbed(title, description) {
  return new EmbedBuilder()
    .setColor(0x000000)
    .setTitle(title)
    .setDescription(description)
    .setFooter({ text: "Nexora Support" })
    .setTimestamp();
}
