import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  Bot,
  Check,
  FileCheck2,
  Headphones,
  KeyRound,
  Link2,
  MessageSquareText,
  Radio,
  Search,
  ShieldCheck,
  Sparkles,
  Workflow,
} from "lucide-react";
import { BrandMark } from "@/components/brand-mark";

const inviteUrl =
  "https://discord.com/oauth2/authorize?client_id=1542533178554585099&permissions=581652858399894&integration_type=0&scope=bot%20applications.commands";
export const metadata: Metadata = {
  title: "Discord Bot",
  description:
    "Invite Nexora for Discord operations, ranking, activity, applications, and controlled workspace actions.",
};
const commands: Array<{ name: string; detail: string; icon: typeof Bot }> = [
  {
    name: "/setup",
    detail:
      "A guided checklist for connecting the correct Discord server and workspace.",
    icon: Workflow,
  },
  {
    name: "/diagnostics",
    detail:
      "A plain-language health report for permissions, connection status, and service access.",
    icon: ShieldCheck,
  },
  {
    name: "/rank",
    detail:
      "Policy-checked promotions and rank requests with a permanent review history.",
    icon: Activity,
  },
  {
    name: "/applications",
    detail:
      "Review application submissions and publish a decision without leaving Discord.",
    icon: FileCheck2,
  },
  {
    name: "/audit",
    detail: "Find recent workspace actions and understand who changed what.",
    icon: Search,
  },
];
export default function BotPage() {
  return (
    <main className="site-shell bot-shell overflow-hidden">
      <nav className="landing-nav">
        <Link href="/" className="flex items-center gap-2.5">
          <BrandMark />
          <b>Nexora</b>
        </Link>
        <div className="hidden gap-7 text-sm text-white/55 md:flex">
          <Link href="/">Platform</Link>
          <a href="#commands">Commands</a>
          <a href="#support">Support</a>
          <Link href="/security">Security</Link>
        </div>
        <a
          href={inviteUrl}
          className="bot-primary-button inline-flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-semibold"
        >
          <Bot className="size-4" />
          Invite bot
        </a>
      </nav>
      <section className="bot-hero px-5 pb-24 pt-32 sm:px-8 sm:pt-40 lg:pb-32">
        <div className="bot-spotlight" />
        <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[1.08fr_.92fr]">
          <div className="relative z-10">
            <div className="bot-eyebrow">
              <Radio className="size-3.5" />
              Discord operations · Live beta
            </div>
            <h1 className="mt-7 max-w-4xl text-balance text-[clamp(3.4rem,7vw,7.2rem)] font-semibold leading-[.88] tracking-[-.075em] text-white">
              One bot.
              <br />
              <span className="text-white/34">Every operation.</span>
            </h1>
            <p className="mt-8 max-w-2xl text-balance text-base leading-8 text-white/52 sm:text-lg">
              Nexora brings workspace commands, rankings, activity checks,
              applications, and audit history into the Discord server your team
              already uses. Support runs through its own focused companion bot.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <a
                href={inviteUrl}
                className="bot-primary-button inline-flex h-12 items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold"
              >
                <Bot className="size-4" />
                Invite Nexora
              </a>
              <Link
                href="/dashboard/connections"
                className="bot-secondary-button inline-flex h-12 items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold"
              >
                <Link2 className="size-4" />
                Connect a server
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-7 gap-y-3 text-xs text-white/38">
              <span className="flex items-center gap-2">
                <Check className="size-3.5 text-white/70" />
                No Roblox cookie
              </span>
              <span className="flex items-center gap-2">
                <Check className="size-3.5 text-white/70" />
                No Administrator permission
              </span>
              <span className="flex items-center gap-2">
                <Check className="size-3.5 text-white/70" />
                Audited staff actions
              </span>
            </div>
          </div>
          <div className="bot-profile-stage">
            <div className="bot-profile-card">
              <div className="bot-banner-grid" />
              <div className="bot-avatar-wrap">
                <Image
                  src="/nexora-discord-logo.png"
                  alt="Nexora Discord bot"
                  width={180}
                  height={180}
                  priority
                  className="bot-avatar-image"
                />
                <span className="bot-online-dot" />
              </div>
              <div className="px-6 pb-6 pt-14 sm:px-8 sm:pb-8">
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-semibold text-white">Nexora</h2>
                  <span className="rounded bg-white px-1.5 py-0.5 text-[8px] font-black text-black">
                    APP
                  </span>
                </div>
                <p className="mt-1 text-xs text-white/30">
                  Official Nexora bot
                </p>
                <div className="mt-6 border-t border-white/[.07] pt-5">
                  <p className="text-[10px] font-semibold uppercase tracking-[.13em] text-white/30">
                    What it does
                  </p>
                  <p className="mt-3 text-sm leading-6 text-white/64">
                    Community operations, member connections, activity, and
                    controlled staff actions.
                  </p>
                </div>
                <div className="mt-5 rounded-xl border border-white/[.07] bg-white/[.025] p-4">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="flex items-center gap-2 text-white/46">
                      <Radio className="size-3 text-emerald-400" />
                      Ready for commands
                    </span>
                    <span className="text-white/25">/help</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="bot-floating-chip chip-one">
              <ShieldCheck className="size-3.5" />
              Policy passed
            </div>
            <div className="bot-floating-chip chip-two">
              <Link2 className="size-3.5" />
              Account connected
            </div>
          </div>
        </div>
      </section>
      <section id="commands" className="section-pad px-5 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="section-kicker bot-kicker">
            <Sparkles className="size-3.5" />
            Command surface
          </div>
          <h2 className="section-title">
            Fast when the work is small.
            <br />
            Clear when it is serious.
          </h2>
          <div className="bot-command-list mt-12">
            {commands.map(({ name, detail, icon: Icon }) => (
              <article className="bot-command-row" key={name}>
                <span className="bot-command-icon">
                  <Icon className="size-5" />
                </span>
                <div className="flex-1">
                  <code>{name}</code>
                  <p>{detail}</p>
                </div>
                <span className="bot-access-pill">Private reply</span>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section id="support" className="px-5 py-24 sm:px-8">
        <div className="bot-permission-panel mx-auto grid max-w-7xl gap-14 lg:grid-cols-2">
          <div>
            <div className="section-kicker bot-kicker">
              <Headphones className="size-3.5" />
              Nexora Support
            </div>
            <h2 className="mt-5 text-4xl font-semibold tracking-[-.055em] text-white sm:text-5xl">
              Support starts with a DM.
            </h2>
            <p className="mt-5 max-w-xl text-sm leading-7 text-white/44">
              Nexora Support is a separate bot and service. Members contact it
              privately from a Support panel; it opens an organized ticket,
              relays agent replies, preserves attachments, and archives a
              transcript when the conversation closes.
            </p>
          </div>
          <div className="bot-permission-list">
            <SupportRow
              icon={MessageSquareText}
              title="Private by default"
              text="A member never needs to post their issue in a public channel."
            />
            <SupportRow
              icon={Headphones}
              title="Human replies"
              text="Staff answer from a protected Discord ticket channel."
            />
            <SupportRow
              icon={KeyRound}
              title="Controlled access"
              text="Only people with the configured Nexora Support role can see and manage tickets."
            />
          </div>
        </div>
      </section>
      <section className="px-5 pb-16 pt-12 sm:px-8">
        <div className="bot-cta mx-auto max-w-7xl">
          <Bot className="size-7 text-white/70" />
          <h2 className="mt-5 max-w-3xl text-balance text-4xl font-semibold tracking-[-.055em] text-white sm:text-6xl">
            Put Nexora where your staff already works.
          </h2>
          <p className="mt-5 max-w-xl text-sm leading-7 text-white/42">
            Invite the official bot, connect the server from your workspace,
            then run /setup and /diagnostics.
          </p>
          <a
            href={inviteUrl}
            className="bot-primary-button mt-8 inline-flex h-12 items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold"
          >
            Invite Nexora <ArrowRight className="size-4" />
          </a>
        </div>
      </section>
    </main>
  );
}
function SupportRow({
  icon: Icon,
  title,
  text,
}: {
  icon: typeof Bot;
  title: string;
  text: string;
}) {
  return (
    <div className="bot-permission-row">
      <span className="allowed">
        <Icon className="size-4" />
      </span>
      <div>
        <b>{title}</b>
        <p>{text}</p>
      </div>
    </div>
  );
}
