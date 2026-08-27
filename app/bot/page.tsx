import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  Bot,
  Check,
  CircleDot,
  Clock3,
  Command,
  Download,
  FileCheck2,
  Fingerprint,
  GitBranch,
  KeyRound,
  Link2,
  LockKeyhole,
  MessageSquareText,
  Radio,
  Search,
  ShieldCheck,
  Sparkles,
  TerminalSquare,
  UsersRound,
  Workflow,
} from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { ThemeToggle } from "@/components/theme-toggle";

export const metadata: Metadata = {
  title: "Discord Bot",
  description: "Meet the Nexora Rank Discord bot for Roblox linking, ranking, activity, applications, and audited community operations.",
};

const commands = [
  { command: "/link", detail: "Connect a Discord identity to the Roblox account the member chooses.", icon: Link2, access: "Everyone" },
  { command: "/rank", detail: "Request a promotion, demotion, or set-rank action through workspace policy.", icon: GitBranch, access: "Operators" },
  { command: "/activity", detail: "See a member’s sessions, quota progress, streak, and recent places.", icon: Activity, access: "Staff" },
  { command: "/applications", detail: "Open the review queue, score submissions, and publish decisions.", icon: FileCheck2, access: "Reviewers" },
  { command: "/audit", detail: "Find who changed what, when it happened, and which rule allowed it.", icon: Search, access: "Admins" },
];

const steps = [
  { number: "01", title: "A member runs /link", text: "Nexora opens a private, time-limited connection flow. Credentials never pass through Discord messages." },
  { number: "02", title: "Identity is verified", text: "Discord and Roblox IDs are attached to one Nexora profile using official authorization." },
  { number: "03", title: "Policies do the work", text: "Rank paths, activity quotas, application rules, and role sync all use the same verified identity." },
];

export default function BotPage() {
  return (
    <main className="site-shell bot-shell overflow-hidden">
      <nav className="landing-nav" aria-label="Primary navigation">
        <Link href="/" className="flex items-center gap-2.5" aria-label="Nexora Rank home">
          <BrandMark /><span className="text-[15px] font-semibold tracking-[-0.02em] text-white">Nexora Rank</span>
        </Link>
        <div className="hidden items-center gap-7 text-sm text-white/58 md:flex">
          <Link href="/#platform" className="nav-link">Platform</Link>
          <span className="nav-link text-white">Discord bot</span>
          <a href="#commands" className="nav-link">Commands</a>
          <a href="#permissions" className="nav-link">Permissions</a>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link href="/login" className="hidden rounded-xl px-4 py-2 text-sm font-medium text-white/68 transition hover:text-white sm:block">Sign in</Link>
          <Link href="/dashboard" className="bot-primary-button inline-flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-semibold">Open app <ArrowRight className="size-3.5" /></Link>
        </div>
      </nav>

      <section className="bot-hero px-5 pb-24 pt-32 sm:px-8 sm:pt-40 lg:pb-32">
        <div className="bot-spotlight" />
        <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[1.08fr_.92fr]">
          <div className="relative z-10">
            <div className="bot-eyebrow"><Radio className="size-3.5" /> Discord control layer · Private alpha</div>
            <h1 className="mt-7 max-w-4xl text-balance text-[clamp(3.4rem,7vw,7.2rem)] font-semibold leading-[.88] tracking-[-.075em] text-white">
              One bot.<br /><span className="text-white/34">Every operation.</span>
            </h1>
            <p className="mt-8 max-w-2xl text-balance text-base leading-8 text-white/48 sm:text-lg">
              Nexora connects Roblox communities with Discord—linking identities, managing ranks, tracking activity, reviewing applications, and recording every staff action in one clear system.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link href="/login" className="bot-primary-button inline-flex h-12 items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold"><Fingerprint className="size-4" /> Connect identity</Link>
              <a href="/nexora-discord-logo.png" download className="bot-secondary-button inline-flex h-12 items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold"><Download className="size-4" /> Download bot logo</a>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-7 gap-y-3 text-xs text-white/32">
              <span className="flex items-center gap-2"><Check className="size-3.5 text-white/70" /> No Roblox cookie</span>
              <span className="flex items-center gap-2"><Check className="size-3.5 text-white/70" /> No admin permission</span>
              <span className="flex items-center gap-2"><Check className="size-3.5 text-white/70" /> Full audit history</span>
            </div>
          </div>

          <div className="bot-profile-stage">
            <div className="bot-profile-card">
              <div className="bot-banner-grid" />
              <div className="bot-avatar-wrap">
                <Image src="/nexora-discord-logo.png" alt="Nexora Rank monochrome linked N logo" width={180} height={180} priority className="bot-avatar-image" />
                <span className="bot-online-dot" />
              </div>
              <div className="px-6 pb-6 pt-14 sm:px-8 sm:pb-8">
                <div className="flex items-center gap-2"><h2 className="text-2xl font-semibold tracking-[-.04em] text-white">Nexora</h2><span className="rounded bg-white px-1.5 py-0.5 text-[8px] font-black tracking-wide text-black">APP</span></div>
                <p className="mt-1 text-xs text-white/27">nexora#0001</p>
                <div className="mt-6 border-t border-white/[.07] pt-5">
                  <p className="text-[10px] font-semibold uppercase tracking-[.13em] text-white/28">About me</p>
                  <p className="mt-3 text-sm leading-6 text-white/62">Roblox ranking, linking, activity, and staff operations—safe, fast, and fully audited.</p>
                </div>
                <div className="mt-5 rounded-xl border border-white/[.07] bg-white/[.025] p-4">
                  <div className="flex items-center justify-between text-[10px]"><span className="flex items-center gap-2 text-white/46"><CircleDot className="size-3 text-emerald-400" /> Listening to operations</span><span className="text-white/22">/help</span></div>
                </div>
              </div>
            </div>
            <div className="bot-floating-chip chip-one"><ShieldCheck className="size-3.5" /> Policy passed</div>
            <div className="bot-floating-chip chip-two"><Link2 className="size-3.5" /> Identity linked</div>
          </div>
        </div>
      </section>

      <section className="border-y border-white/[.06] bg-white/[.015] px-5 py-7 sm:px-8">
        <div className="mx-auto grid max-w-7xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <BotMetric icon={UsersRound} value="One profile" label="Discord + Roblox identity" />
          <BotMetric icon={Clock3} value="Real time" label="Sessions and quota progress" />
          <BotMetric icon={Workflow} value="Policy first" label="Approvals before changes" />
          <BotMetric icon={LockKeyhole} value="Traceable" label="Every privileged action" />
        </div>
      </section>

      <section id="commands" className="section-pad px-5 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-12 lg:grid-cols-[.75fr_1.25fr]">
            <div className="lg:sticky lg:top-28 lg:self-start">
              <div className="section-kicker bot-kicker"><Command className="size-3.5" /> Quiet command surface</div>
              <h2 className="section-title">Fast in Discord. Deep in the dashboard.</h2>
              <p className="section-copy">Commands stay concise. Complex policy, review, history, and configuration live in Nexora’s control room where they are easier to understand.</p>
              <div className="mt-8 rounded-2xl border border-white/[.07] bg-white/[.018] p-5">
                <div className="flex items-center gap-2 text-xs font-medium text-white/60"><TerminalSquare className="size-4" /> Designed for Discord slash commands</div>
                <p className="mt-3 text-xs leading-6 text-white/28">Autocomplete, permission checks, private replies for identity flows, and readable errors—without command clutter.</p>
              </div>
            </div>
            <div className="bot-command-list">
              {commands.map(({ command, detail, icon: Icon, access }) => (
                <article className="bot-command-row" key={command}>
                  <span className="bot-command-icon"><Icon className="size-5" /></span>
                  <div className="min-w-0 flex-1"><code>{command}</code><p>{detail}</p></div>
                  <span className="bot-access-pill">{access}</span>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 py-24 sm:px-8 lg:py-32">
        <div className="mx-auto max-w-7xl">
          <div className="section-kicker bot-kicker"><Link2 className="size-3.5" /> Linking service</div>
          <h2 className="section-title">One verified person.<br />Two platforms.</h2>
          <div className="mt-12 grid gap-4 lg:grid-cols-3">
            {steps.map((step) => <article className="bot-step-card" key={step.number}><span>{step.number}</span><h3>{step.title}</h3><p>{step.text}</p></article>)}
          </div>
        </div>
      </section>

      <section id="permissions" className="px-5 py-24 sm:px-8 lg:py-32">
        <div className="bot-permission-panel mx-auto grid max-w-7xl gap-14 lg:grid-cols-[1fr_1fr]">
          <div>
            <div className="section-kicker bot-kicker"><KeyRound className="size-3.5" /> Least privilege</div>
            <h2 className="mt-5 text-4xl font-semibold tracking-[-.055em] text-white sm:text-5xl">The bot does not need Administrator.</h2>
            <p className="mt-5 max-w-xl text-sm leading-7 text-white/38">Nexora asks only for the Discord permissions a feature uses. Role management stays optional and the Nexora role must sit below every role it is allowed to sync.</p>
          </div>
          <div className="bot-permission-list">
            <PermissionRow title="View channels" text="Needed only where Nexora commands and updates are enabled." included />
            <PermissionRow title="Send messages + embeds" text="Replies, approval cards, and operation receipts." included />
            <PermissionRow title="Manage roles" text="Optional. Required only when Discord role sync is enabled." optional />
            <PermissionRow title="Administrator" text="Never required by Nexora Rank." />
          </div>
        </div>
      </section>

      <section className="px-5 pb-16 pt-12 sm:px-8">
        <div className="bot-cta mx-auto max-w-7xl">
          <Sparkles className="size-6 text-white/70" />
          <h2 className="mt-5 max-w-3xl text-balance text-4xl font-semibold tracking-[-.055em] text-white sm:text-6xl">The Discord surface for your whole Roblox operation.</h2>
          <p className="mt-5 max-w-xl text-sm leading-7 text-white/38">The public bot invite opens after permissions and real-world sync tests are complete. The secure web workspace is available now.</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/dashboard" className="bot-primary-button inline-flex h-12 items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold">Explore dashboard <ArrowRight className="size-4" /></Link>
            <Link href="/login" className="bot-secondary-button inline-flex h-12 items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold"><MessageSquareText className="size-4" /> Prepare connection</Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/[.06] px-5 py-8 sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-5 sm:flex-row">
          <div className="flex items-center gap-2.5"><BrandMark compact /><span className="text-sm font-semibold text-white">Nexora Rank</span><span className="ml-2 text-xs text-white/24">Discord operations, linked.</span></div>
          <div className="flex flex-wrap justify-center gap-5 text-xs text-white/32"><Link href="/">Home</Link><Link href="/dashboard">Demo</Link><Link href="/pricing">Pricing</Link><Link href="/legal/terms-of-service">Terms</Link><Link href="/legal/privacy">Privacy</Link><span>© 2026 Nexora</span></div>
        </div>
      </footer>
    </main>
  );
}

function BotMetric({ icon: Icon, value, label }: { icon: typeof Bot; value: string; label: string }) {
  return <div className="bot-metric"><Icon className="size-4" /><div><b>{value}</b><span>{label}</span></div></div>;
}

function PermissionRow({ title, text, included = false, optional = false }: { title: string; text: string; included?: boolean; optional?: boolean }) {
  return <div className="bot-permission-row"><span className={included || optional ? "allowed" : "denied"}>{included ? <Check className="size-4" /> : optional ? <Sparkles className="size-4" /> : <LockKeyhole className="size-4" />}</span><div><div className="flex items-center gap-2"><b>{title}</b>{optional && <small>OPTIONAL</small>}</div><p>{text}</p></div></div>;
}
