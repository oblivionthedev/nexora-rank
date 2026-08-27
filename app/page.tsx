import Link from "next/link";
import {
  Activity, ArrowRight, BarChart3, Blocks, Bot, Check, ChevronRight, Clock3,
  FileCheck2, Fingerprint, Gauge, GitBranch, LockKeyhole, Radio, ShieldCheck,
  Sparkles, UsersRound, Zap,
} from "lucide-react";
import { BrandMark } from "@/components/brand-mark";

const features = [
  { icon: GitBranch, eyebrow: "Rank operations", title: "Promote with guardrails.", description: "Role-aware promotion paths, approval steps, rank locks, cooldowns, and a permanent reason attached to every action.", tone: "violet" },
  { icon: Activity, eyebrow: "Activity intelligence", title: "Know who is showing up.", description: "Track sessions, minutes, streaks, quotas, and game presence without turning useful data into a spreadsheet maze.", tone: "cyan" },
  { icon: FileCheck2, eyebrow: "Applications", title: "From form to first shift.", description: "Create application flows, collaborate on reviews, trigger ranks, and deliver a clear decision to every applicant.", tone: "pink" },
  { icon: Blocks, eyebrow: "Automations", title: "Build rules, not busywork.", description: "Connect triggers, conditions, approvals, and actions in one readable automation canvas with safe test runs.", tone: "amber" },
];

const logRows = [
  { initials: "MP", name: "MiraPlays", action: "Promoted", meta: "Barista → Senior Barista", time: "12s" },
  { initials: "NX", name: "NexusVee", action: "Session ended", meta: "1h 42m • Main Store", time: "1m" },
  { initials: "KO", name: "KoriOnline", action: "Application approved", meta: "Staff Assistant", time: "4m" },
];

export default function Home() {
  return (
    <main className="site-shell overflow-hidden">
      <nav className="landing-nav" aria-label="Primary navigation">
        <Link href="/" className="flex items-center gap-2.5" aria-label="Nexora Rank home">
          <BrandMark /><span className="text-[15px] font-semibold tracking-[-0.02em] text-white">Nexora Rank</span>
        </Link>
        <div className="hidden items-center gap-7 text-sm text-white/58 md:flex">
          <a href="#platform" className="nav-link">Platform</a><a href="#workflow" className="nav-link">How it works</a><a href="#pricing" className="nav-link">Pricing</a><a href="#security" className="nav-link">Security</a>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/login" className="hidden rounded-xl px-4 py-2 text-sm font-medium text-white/68 transition hover:text-white sm:block">Sign in</Link>
          <Link href="/dashboard" className="button-glow inline-flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-semibold text-white">Open demo <ArrowRight className="size-3.5" /></Link>
        </div>
      </nav>

      <section className="hero-section px-5 pb-24 pt-20 sm:px-8 sm:pt-28 lg:pb-36 lg:pt-36">
        <div className="hero-orb hero-orb-one" /><div className="hero-orb hero-orb-two" />
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-4xl text-center">
            <div className="reveal-up inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-400/[0.07] px-3 py-1.5 text-xs font-medium text-violet-200">
              <span className="relative flex size-1.5"><span className="absolute inline-flex size-full animate-ping rounded-full bg-violet-300 opacity-60" /><span className="relative inline-flex size-1.5 rounded-full bg-violet-300" /></span>
              The new operating system for Roblox communities <ChevronRight className="size-3" />
            </div>
            <h1 className="reveal-up delay-1 mt-7 text-balance text-[clamp(3rem,7vw,6.6rem)] font-semibold leading-[0.91] tracking-[-0.068em] text-white">Run your group.<br /><span className="gradient-text">Not the busywork.</span></h1>
            <p className="reveal-up delay-2 mx-auto mt-7 max-w-2xl text-balance text-base leading-7 text-white/52 sm:text-lg sm:leading-8">Ranking, activity, applications, and automation in one calm control room—built for communities that have outgrown scattered bots.</p>
            <div className="reveal-up delay-3 mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href="/dashboard" className="button-glow inline-flex h-12 min-w-44 items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold text-white">Explore dashboard <ArrowRight className="size-4" /></Link>
              <Link href="/login" className="glass-button inline-flex h-12 min-w-40 items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold text-white/80"><Fingerprint className="size-4" /> Connect accounts</Link>
            </div>
            <p className="mt-4 text-xs text-white/30">Free to start · No card needed · OAuth integrations coming soon</p>
          </div>

          <div className="dashboard-stage reveal-up delay-4 mx-auto mt-16 max-w-6xl lg:mt-20">
            <div className="stage-glow" />
            <div className="dashboard-window">
              <div className="window-bar"><div className="flex items-center gap-1.5"><i /><i /><i /></div><div className="flex items-center gap-2 text-[11px] text-white/32"><LockKeyhole className="size-3" /> app.nexora.rank / overview</div><div className="size-6" /></div>
              <div className="preview-app">
                <aside className="preview-sidebar">
                  <div className="mb-7 flex items-center gap-2"><BrandMark compact /><span className="text-xs font-semibold text-white">Nexora</span></div>
                  {[Gauge, UsersRound, GitBranch, Activity, FileCheck2, Blocks].map((Icon, i) => <div key={i} className={`preview-nav-item ${i === 0 ? "active" : ""}`}><Icon className="size-3.5" /><span /></div>)}
                </aside>
                <div className="preview-main">
                  <div className="preview-topbar"><div><p>Good afternoon, Dusan</p><span>Here&apos;s what changed since your last visit.</span></div><div className="flex gap-2"><span className="topbar-pill" /><span className="topbar-avatar">DP</span></div></div>
                  <div className="preview-stats"><PreviewStat label="Active staff" value="42" change="+12%" icon={UsersRound} /><PreviewStat label="Rank actions" value="187" change="+24%" icon={GitBranch} /><PreviewStat label="Hours tracked" value="328" change="+8%" icon={Clock3} /></div>
                  <div className="preview-grid">
                    <div className="preview-card chart-card"><div className="card-head"><div><b>Activity pulse</b><span>Last 7 days</span></div><span className="mini-chip">Live</span></div><div className="chart-wrap" aria-label="Activity trend chart"><svg viewBox="0 0 500 150" role="img"><defs><linearGradient id="area" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#8b5cf6" stopOpacity=".34"/><stop offset="1" stopColor="#8b5cf6" stopOpacity="0"/></linearGradient></defs><path className="chart-grid" d="M0 25H500M0 75H500M0 125H500" /><path className="chart-area" d="M0 122 C45 114 54 82 98 91 S160 105 200 66 S273 96 310 54 S374 75 414 38 S465 42 500 22 L500 150 L0 150Z" /><path className="chart-line" d="M0 122 C45 114 54 82 98 91 S160 105 200 66 S273 96 310 54 S374 75 414 38 S465 42 500 22" /></svg></div></div>
                    <div className="preview-card log-card"><div className="card-head"><div><b>Live operations</b><span>Workspace activity</span></div><Radio className="size-3.5 text-emerald-400" /></div><div className="mt-3 space-y-1">{logRows.map((row) => <div className="log-row" key={row.name}><span className="log-avatar">{row.initials}</span><div><b>{row.name}</b><span>{row.action}</span><small>{row.meta}</small></div><time>{row.time}</time></div>)}</div></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-white/[0.06] bg-white/[0.018] px-5 py-8 sm:px-8"><div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-10 gap-y-4 text-xs font-medium uppercase tracking-[0.18em] text-white/25"><span>One workspace</span><span className="size-1 rounded-full bg-white/15" /><span>Every operation</span><span className="size-1 rounded-full bg-white/15" /><span>Complete history</span><span className="size-1 rounded-full bg-white/15" /><span>Built for teams</span></div></section>

      <section id="platform" className="section-pad px-5 sm:px-8"><div className="mx-auto max-w-7xl"><div className="mb-14 max-w-2xl"><div className="section-kicker"><Sparkles className="size-3.5" /> One connected platform</div><h2 className="section-title">All the tools your community actually needs.</h2><p className="section-copy">Designed together from the beginning, so every rank action, application, and session tells the same story.</p></div><div className="grid gap-4 md:grid-cols-2">{features.map(({ icon: Icon, eyebrow, title, description, tone }) => <article key={title} className={`feature-card tone-${tone}`}><div className="feature-icon"><Icon className="size-5" /></div><p className="mt-8 text-xs font-semibold uppercase tracking-[0.17em] text-white/35">{eyebrow}</p><h3 className="mt-3 text-2xl font-semibold tracking-[-0.035em] text-white sm:text-3xl">{title}</h3><p className="mt-4 max-w-md text-sm leading-7 text-white/46">{description}</p><div className="mt-9 inline-flex items-center gap-1.5 text-sm font-medium text-white/74">Explore capability <ArrowRight className="size-3.5" /></div><div className="feature-sheen" /></article>)}</div></div></section>

      <section id="workflow" className="section-pad px-5 sm:px-8"><div className="mx-auto grid max-w-7xl items-center gap-16 lg:grid-cols-[.85fr_1.15fr]"><div><div className="section-kicker"><Zap className="size-3.5" /> Safer by design</div><h2 className="section-title">Every action has context.</h2><p className="section-copy">Nexora Rank shows who requested a change, why it happened, what rules allowed it, and what changed next.</p><div className="mt-8 space-y-4">{["Permission-aware rank paths", "Approval flows for sensitive actions", "Searchable, exportable audit history"].map((item) => <div key={item} className="flex items-center gap-3 text-sm text-white/68"><span className="flex size-6 items-center justify-center rounded-full bg-emerald-400/10 text-emerald-300"><Check className="size-3.5" /></span>{item}</div>)}</div></div><div className="flow-console"><div className="flow-header"><span>Promotion workflow</span><span className="mini-chip">Ready</span></div><div className="flow-line"><FlowNode icon={Bot} label="Discord command" value="/promote MiraPlays" /><span className="flow-connector" /><FlowNode icon={ShieldCheck} label="Policy check" value="3 rules passed" success /><span className="flow-connector" /><FlowNode icon={GitBranch} label="Roblox rank" value="Senior Barista" /></div><div className="mx-5 mb-5 rounded-2xl border border-white/[0.07] bg-black/20 p-4 sm:mx-7 sm:mb-7"><div className="flex items-center justify-between"><div className="flex items-center gap-2 text-xs font-medium text-white/74"><ShieldCheck className="size-4 text-emerald-400" /> Safe to execute</div><span className="text-[10px] text-white/28">Preview mode</span></div><p className="mt-2 text-xs leading-5 text-white/34">MiraPlays meets the minimum activity requirement, follows an allowed rank path, and is not inside a promotion cooldown.</p></div></div></div></section>

      <section id="security" className="section-pad px-5 sm:px-8"><div className="security-panel mx-auto max-w-7xl"><div className="relative z-10 max-w-2xl"><div className="section-kicker"><LockKeyhole className="size-3.5" /> Trust center</div><h2 className="section-title">Built without asking for your Roblox cookie.</h2><p className="section-copy">Account connections will use official OAuth and scoped Open Cloud permissions. Your credentials stay with Roblox and Discord.</p></div><div className="relative z-10 mt-12 grid gap-4 sm:grid-cols-3"><TrustItem title="Scoped access" text="Connect only the permissions each workspace needs." /><TrustItem title="Encrypted secrets" text="Sensitive configuration never appears in dashboards or logs." /><TrustItem title="Action evidence" text="Every privileged operation leaves a readable audit record." /></div></div></section>

      <section id="pricing" className="section-pad px-5 sm:px-8"><div className="mx-auto max-w-5xl text-center"><div className="section-kicker mx-auto"><Sparkles className="size-3.5" /> Start simple</div><h2 className="section-title mx-auto">Your first workspace is free.</h2><p className="section-copy mx-auto">We&apos;re building the useful core first. Premium plans and checkout will arrive after the platform is stable.</p><div className="mt-10 grid gap-4 text-left md:grid-cols-3"><PriceCard name="Free" price="€0" description="For a growing community getting organized." items={["1 workspace", "Core rank operations", "Activity overview", "Applications"]} /><PriceCard featured name="Plus" price="Coming soon" description="For teams that need deeper control." items={["Advanced workflows", "Longer history", "Custom branding", "Priority sync"]} /><PriceCard name="Pro" price="Coming soon" description="For multi-group operations." items={["Multiple workspaces", "Developer API", "Advanced exports", "Priority support"]} /></div></div></section>

      <section className="px-5 pb-16 pt-8 sm:px-8"><div className="cta-panel mx-auto max-w-7xl text-center"><div className="relative z-10 mx-auto max-w-2xl"><BarChart3 className="mx-auto size-7 text-violet-300" /><h2 className="mt-5 text-4xl font-semibold tracking-[-0.05em] text-white sm:text-5xl">A better way to run the group.</h2><p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-white/48">Explore the interactive product preview now. Connect your real accounts when integrations launch.</p><Link href="/dashboard" className="button-glow mt-8 inline-flex h-12 items-center gap-2 rounded-xl px-5 text-sm font-semibold text-white">Open Nexora Rank <ArrowRight className="size-4" /></Link></div></div></section>

      <footer className="border-t border-white/[0.06] px-5 py-8 sm:px-8"><div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-5 sm:flex-row"><div className="flex items-center gap-2.5"><BrandMark compact /><span className="text-sm font-semibold text-white">Nexora Rank</span><span className="ml-2 text-xs text-white/24">Community operations, connected.</span></div><div className="flex gap-5 text-xs text-white/32"><a href="#security" className="hover:text-white">Security</a><a href="#pricing" className="hover:text-white">Plans</a><span>© 2026 Nexora</span></div></div></footer>
    </main>
  );
}

function PreviewStat({ label, value, change, icon: Icon }: { label: string; value: string; change: string; icon: typeof UsersRound }) { return <div className="preview-stat"><div><span>{label}</span><b>{value}</b><small>{change} this week</small></div><div className="stat-icon"><Icon className="size-3.5" /></div></div>; }
function FlowNode({ icon: Icon, label, value, success = false }: { icon: typeof Bot; label: string; value: string; success?: boolean }) { return <div className="flow-node"><div className={success ? "success" : ""}><Icon className="size-5" /></div><span>{label}</span><b>{value}</b></div>; }
function TrustItem({ title, text }: { title: string; text: string }) { return <article className="trust-item"><ShieldCheck className="size-5 text-violet-300" /><h3>{title}</h3><p>{text}</p></article>; }
function PriceCard({ name, price, description, items, featured = false }: { name: string; price: string; description: string; items: string[]; featured?: boolean }) { return <article className={`price-card ${featured ? "featured" : ""}`}>{featured && <span className="price-badge">PLANNED</span>}<p className="text-sm font-semibold text-white/72">{name}</p><h3>{price}</h3><p className="min-h-12 text-sm leading-6 text-white/38">{description}</p><div className="my-6 h-px bg-white/[0.07]" /><ul className="space-y-3">{items.map((item) => <li key={item}><Check className="size-3.5" />{item}</li>)}</ul></article>; }
