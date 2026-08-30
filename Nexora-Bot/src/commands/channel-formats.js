import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";
import { UserError } from "../lib/errors.js";

const black = 0x050505;
const discord = 0x5865f2;
const rose = 0xd8a0a0;

function footer(builder, label) {
  return builder
    .setFooter({ text: `Nexora Rank · ${label}` })
    .setTimestamp();
}

function links(config, { verify = false, support = false } = {}) {
  const row = new ActionRowBuilder();
  if (verify) {
    row.addComponents(
      new ButtonBuilder()
        .setLabel("Verify with Nexora")
        .setEmoji("✅")
        .setURL(`${config.siteUrl}/verify`)
        .setStyle(ButtonStyle.Link),
    );
  }
  row.addComponents(
    new ButtonBuilder()
      .setLabel("Open Nexora")
      .setURL(config.siteUrl)
      .setStyle(ButtonStyle.Link),
  );
  if (support) {
    row.addComponents(
      new ButtonBuilder()
        .setLabel("Community & Support")
        .setURL("https://discord.gg/YY9nXqqWTk")
        .setStyle(ButtonStyle.Link),
    );
  }
  return row;
}

const panels = {
  rules(config) {
    return {
      embeds: [
        footer(
          new EmbedBuilder()
            .setColor(black)
            .setTitle("Nexora Community Rules")
            .setDescription(
              "Welcome to the official Nexora community. These rules keep the server useful, safe, and comfortable for community owners, staff members, partners, and Beta testers. By remaining here, you agree to follow them.",
            )
            .addFields(
              { name: "01 · Respect every member", value: "Treat people with patience and basic respect. Harassment, discrimination, hate speech, threats, targeted insults, and unwanted personal attacks are not allowed." },
              { name: "02 · Keep conversations appropriate", value: "Do not post sexual, graphic, shocking, or otherwise unsafe material. Usernames, avatars, links, files, and profile content must also remain appropriate." },
              { name: "03 · No spam or disruption", value: "Avoid flooding, repeated messages, excessive mentions, disruptive soundboards, reaction spam, or attempts to make channels difficult to use." },
              { name: "04 · Use the correct channels", value: "Read channel names and descriptions before posting. Keep support requests, feedback, bug reports, partnerships, and general conversation in their intended places." },
              { name: "05 · Protect accounts and private information", value: "Never share passwords, tokens, cookies, API keys, private staff information, or another person’s personal data. Nexora will never request your Roblox password or `.ROBLOSECURITY` cookie." },
              { name: "06 · No scams, impersonation, or malicious links", value: "Do not impersonate Nexora, its staff, partners, or other members. Phishing, malware, fake giveaways, account trading, and misleading downloads result in immediate action." },
              { name: "07 · Advertising requires permission", value: "Unapproved promotions, unsolicited DMs, server invites, referral links, and repeated self-promotion are prohibited. Use the official partnership process when relevant." },
              { name: "08 · Use support responsibly", value: "Provide accurate details, stay patient, and keep one issue in one ticket. Abuse of Support, false reports, or deliberately wasting agent time may remove access." },
              { name: "09 · Follow platform rules", value: "You must follow Discord’s Terms and Community Guidelines, Roblox’s Terms, and Nexora’s published policies while using this community or any Nexora service." },
              { name: "10 · Staff decisions and enforcement", value: "Staff may remove content or restrict access when needed to protect the community. Evading moderation or using alternate accounts can extend an action. If you believe a decision is wrong, appeal calmly through Support." },
            ),
          "Community standards",
        ),
        footer(
          new EmbedBuilder()
            .setColor(rose)
            .setTitle("Before you continue")
            .setDescription("Use common sense, ask when uncertain, and report unsafe behavior privately instead of escalating it publicly. Rules may be updated as Nexora grows."),
          "Thank you for keeping Nexora safe",
        ),
      ],
      components: [links(config, { verify: true, support: true })],
    };
  },

  faq(config) {
    return {
      embeds: [
        footer(
          new EmbedBuilder()
            .setColor(black)
            .setTitle("Nexora Frequently Asked Questions")
            .setDescription("Quick answers to the questions community owners and staff ask most often.")
            .addFields(
              { name: "What is Nexora?", value: "Nexora is a community operations platform for Roblox groups and Discord servers. It brings applications, activity, rank requests, communications, workflows, staff tools, and audit history into one workspace." },
              { name: "Is Nexora currently public?", value: "Nexora is in a limited Beta. Anyone may apply, but dashboard and workspace access are available only to selected applicants and authorized Nexora Staff." },
              { name: "How do I join the Beta?", value: `Apply at [${config.siteUrl.replace(/^https:\/\//, "")}/beta](${config.siteUrl}/beta). You can privately check your result with the lookup code provided after submission.` },
              { name: "Is Roblox verification required?", value: "No. Roblox OAuth is optional while provider approval is pending. Discord is currently used for identity, server linking, roles, applications, and verification." },
              { name: "Does Nexora ask for Roblox passwords or cookies?", value: "Never. Nexora does not request Roblox passwords or `.ROBLOSECURITY` cookies. Approved provider connections and official authorization methods are the only accepted approach." },
              { name: "How do I become Discord verified?", value: `Use the button below or open [Nexora Verification](${config.siteUrl}/verify). Authorize Discord on the website, then complete the verification check to receive access.` },
              { name: "Where can I get help?", value: "Use the Nexora Support panel and DM the separate **Nexora Support** bot. A private ticket is created for the Support Team, and a transcript is saved when it closes." },
              { name: "Can I advertise or partner with Nexora?", value: `Unapproved advertising is not allowed. Established communities can review the public [Partners page](${config.siteUrl}/partners) and contact Nexora Staff through the official Support server.` },
              { name: "Are paid plans available?", value: "Billing and purchased plans are not active yet. Beta access currently does not require payment." },
              { name: "Who can see workspace actions?", value: "Workspace access is role-based. Important changes are recorded in audit logs so owners can review who performed an action and why." },
            ),
          "Questions answered clearly",
        ),
      ],
      components: [links(config, { verify: true, support: true })],
    };
  },

  welcome(config) {
    return {
      embeds: [
        footer(
          new EmbedBuilder()
            .setColor(black)
            .setTitle("Welcome to Nexora")
            .setDescription("The operations layer for modern Roblox communities. Connect your Discord identity, verify securely, explore the platform, and help shape Nexora during Beta.")
            .addFields(
              { name: "Start here", value: "**1.** Read the community rules\n**2.** Verify through the official Nexora website\n**3.** Explore the information and community channels\n**4.** Apply for Beta if you operate a real community", inline: false },
              { name: "Built for operators", value: "Applications · Activity · Ranking requests · Communications · Workflows · Staff accountability", inline: false },
              { name: "Need assistance?", value: "Use the Support panel and message the separate Nexora Support bot. Your conversation stays private between you and authorized Support agents.", inline: false },
            )
            .setThumbnail(`${config.siteUrl}/nexora-discord-logo.png`),
          "Community & Support",
        ),
      ],
      components: [links(config, { verify: true, support: true })],
    };
  },

  gettingstarted(config) {
    return {
      embeds: [
        footer(
          new EmbedBuilder()
            .setColor(discord)
            .setTitle("Get started with Nexora")
            .setDescription("Follow these steps in order. Verification is completed on the official Nexora website—never through a password request or a file download.")
            .addFields(
              { name: "1 · Join the official server", value: "Stay in the Nexora Community & Support server while completing verification." },
              { name: "2 · Open secure verification", value: `Visit [${config.siteUrl.replace(/^https:\/\//, "")}/verify](${config.siteUrl}/verify) or use the button below.` },
              { name: "3 · Authorize Discord", value: "Confirm the Discord account you want connected. Nexora receives only the approved identity information—not your password." },
              { name: "4 · Complete the website check", value: "Press **Verify me now** on the Nexora verification page. The official Verified role is assigned after the server and bot checks pass." },
              { name: "5 · Apply for Beta · optional", value: `Community owners can submit a Beta application at [Apply for Nexora Beta](${config.siteUrl}/beta). Dashboard access begins only after selection.` },
            ),
          "Secure onboarding",
        ),
      ],
      components: [links(config, { verify: true, support: true })],
    };
  },

  resources(config) {
    return {
      embeds: [
        footer(
          new EmbedBuilder()
            .setColor(black)
            .setTitle("Official Nexora Resources")
            .setDescription("Use only these official destinations. Staff will never send you an unofficial login page or ask for private credentials.")
            .addFields(
              { name: "Platform", value: `[Nexora home](${config.siteUrl})\n[How it works](${config.siteUrl}/#how-it-works)\n[Service status](${config.siteUrl}/status)` , inline: true },
              { name: "Community", value: "[Discord community](https://discord.gg/YY9nXqqWTk)\n[Roblox community](https://www.roblox.com/communities/596263047)\n[Groups using Nexora](${config.siteUrl}/groups)", inline: true },
              { name: "Access", value: `[Discord verification](${config.siteUrl}/verify)\n[Beta application](${config.siteUrl}/beta)\n[Sign in](${config.siteUrl}/login)`, inline: true },
              { name: "Trust & policies", value: `[Security](${config.siteUrl}/security) · [Privacy](${config.siteUrl}/legal/privacy) · [Terms](${config.siteUrl}/legal/terms-of-service)`, inline: false },
            ),
          "Official links only",
        ),
      ],
      components: [links(config, { verify: true, support: true })],
    };
  },

  about(config) {
    return {
      embeds: [
        footer(
          new EmbedBuilder()
            .setColor(black)
            .setTitle("What Nexora does")
            .setDescription("Nexora gives Roblox community teams one clear place to operate across Discord and Roblox—without shared passwords, unsafe cookies, or invisible staff actions.")
            .addFields(
              { name: "Recruit", value: "Publish Discord-authenticated applications, select real server roles, review answers, and announce openings through the bot.", inline: true },
              { name: "Operate", value: "Track activity, quotas, sessions, leave requests, tasks, knowledge, announcements, and community workflows.", inline: true },
              { name: "Govern", value: "Control workspace roles, record rank requests, inspect logs, and keep every important staff action accountable.", inline: true },
              { name: "Current Beta", value: "Discord operations are live. Roblox account linking and automatic rank execution remain limited until the approved provider connection is available.", inline: false },
            ),
          "Community operations, made clear",
        ),
      ],
      components: [links(config, { verify: true, support: true })],
    };
  },
};

function formatCommand(name, description, panel) {
  return {
    staffOnly: true,
    data: new SlashCommandBuilder()
      .setName(name)
      .setDescription(description)
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
      .setDMPermission(false),
    async execute(interaction, { config }) {
      if (interaction.guildId !== config.staffGuildId)
        throw new UserError(
          "Official Nexora channel formats can only be published in the Nexora Community & Support server.",
          "official_server_required",
        );
      if (!interaction.channel?.isTextBased())
        throw new UserError("Run this command in a text channel.", "text_channel_required");
      await interaction.channel.send(panels[panel](config));
      await interaction.editReply({ content: `The **${name.replaceAll("-", " ")}** panel is now live in this channel.` });
    },
  };
}

export const channelFormatCommands = [
  formatCommand("rules", "Publish the official Nexora community rules", "rules"),
  formatCommand("faq", "Publish the official Nexora frequently asked questions", "faq"),
  formatCommand("welcome", "Publish the official Nexora welcome panel", "welcome"),
  formatCommand("getting-started", "Publish the Nexora onboarding and verification guide", "gettingstarted"),
  formatCommand("resources", "Publish official Nexora links and resources", "resources"),
  formatCommand("about", "Publish a clear explanation of what Nexora does", "about"),
];
