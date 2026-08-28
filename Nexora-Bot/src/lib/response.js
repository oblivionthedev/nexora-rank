import { EmbedBuilder } from "discord.js";

export const colors = {
  roseGold: 0xd8a0a0,
  discord: 0x5865f2,
  success: 0x59d9a3,
  warning: 0xf0b86e,
  danger: 0xe78484,
  neutral: 0x2b2525,
};

export function embed(title, description, color = colors.roseGold) {
  return new EmbedBuilder()
    .setColor(color)
    .setTitle(title)
    .setDescription(description)
    .setFooter({ text: "Nexora Rank" })
    .setTimestamp();
}

export function truncate(value, length = 1000) {
  const text = String(value ?? "");
  return text.length > length ? `${text.slice(0, length - 1)}…` : text;
}

export function relativeTime(value) {
  if (!value) return "Never";
  return `<t:${Math.floor(new Date(value).getTime() / 1000)}:R>`;
}
