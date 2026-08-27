import Link from "next/link";
import {
  Activity, ArrowRight, Blocks, Bot, Check, Clock3,
  FileCheck2, Fingerprint, Gauge, GitBranch, LockKeyhole, Radio, ShieldCheck,
  UsersRound,
} from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { SiteNav } from "@/components/site-nav";

const features = [
  { icon: GitBranch, eyebrow: "Rank operations", title: "Promote with guardrails.", description: "Role-aware promotion paths, approval steps, rank locks, cooldowns, and a permanent reason attached to every action." },
  { icon: Activity, eyebrow: "Activity intelligence", title: "Know who is showing up.", description: "Track sessions, minutes, streaks, quotas, and game presence without turning useful data into a spreadsheet maze." },
  { icon: FileCheck2, eyebrow: "Applications", title: "From form to first shift.", description: "Create application flows, collaborate on reviews, trigger ranks, and deliver a clear decision to every applicant." },
  { icon: Blocks, eyebrow: "Automations", title: "Build rules, not busywork.", description: "Connect triggers, conditions, approvals, and actions in one readable automation canvas with safe test runs." },
];

const logRows = [
  { initials: "MP", name: "MiraPlays", action: "Promoted", meta: "Barista → Senior Barista", time: "12s" },
  { initials: "NX", name: "NexusVee", action: "Session ended", meta: "1h 42m • Main Store", time: "1m" },
  { initials: "KO", name: "KoriOnline", action: "Application approved", meta: "Staff Assistant", time: "4m" },
];

export default function Home() {
  return (
    <main className="site-shell overflow-hidden">
      <SiteNav />

      <section className="hero-section px-5 pb-24 pt-24 sm:px-8 sm:pt-32 lg:pb-32 lg:pt-40">
        <div className="mx-auto max-w-7xl">
          {/* Left-aligned, asymmetric: headline holds the left column, the
              supporting claim and actions sit in a narrower right column. */}
          <div className="grid items-end gap-x-16 gap-y-9 lg:grid-cols-[1.15fr_0.85fr]">
            <div>
              <Link href="/bot" className="hero-eyebrow">Nexora Identity Network — private beta</Link>
              <h1 className="reveal-up mt-6 text-[clamp(2.75rem,6vw,5.5rem)] font-semibold leading-[0.95] tracking-[-0.03em] text-white">Run your group.<br /><span className="gradient-text">Not the busywork.</span></h1>
            </div>
            <div className="reveal-up delay-2 lg:pb-3">
              <p className="max-w-md text-base leading-7 text-white/64">Connect Discord and Roblox identities, then run ranking, activity, applications, and automation from one auditable control room.</p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Link href="/login?next=/dashboard" className="button-glow inline-flex h-12 items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold">Start your workspace <ArrowRight className="size-4" aria-hidden="true" /></Link>
                <Link href="/security" className="glass-button inline-flex h-12 items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold text-white/80"><Fingerprint className="size-4" aria-hidden="true" /> How access works</Link>
              </div>
              <p className="mt-4 text-xs text-white/42">Free to start · No card needed · Discord OAuth</p>
            </div>
          </div>

          <div className="dashboard-stage reveal-up delay-4 mt-16 lg:mt-24">
            <div className="dashboard-window">
              <div className="window-bar"><div className="flex items-center gap-1.5"><i /><i /><i /></div><div className="flex items-center gap-2 text-[11px] text-white/32"><LockKeyhole className="size-3" /> nexorarank.tech / dashboard</div><div className="size-6" /></div>
              <div className="preview-app">
                <aside className="preview-sidebar">
                  <div className="mb-7 flex items-center gap-2"><BrandMark compact /><span className="text-xs font-semibold text-white">Nexora</span></div>
                  {[Gauge, UsersRound, GitBranch, Activity, FileCheck2, Blocks].map((Icon, i) => <div key={i} className={`preview-nav-item ${i === 0 ? "active" : ""}`}><Icon className="size-3.5" /><span /></div>)}
                </aside>
                <div className="preview-main">
                  <div className="preview-topbar"><div><p>Sunset Diner — operations</p><span>Here&apos;s what changed since your last visit.</span></div><div className="flex gap-2"><span className="topbar-pill" /><span className="topbar-avatar">SD</span></div></div>
                  <div className="preview-stats"><PreviewStat label="Active staff" value="42" change="+12%" icon={UsersRound} /><PreviewStat label="Rank actions" value="187" change="+24%" icon={GitBranch} /><PreviewStat label="Hours tracked" value="328" change="+8%" icon={Clock3} /></div>
                  <div className="preview-grid">
                    <div className="preview-card chart-card"><div className="card-head"><div><b>Activity pulse</b><span>Last 7 days</span></div><span className="mini-chip">Live</span></div><div className="chart-wrap" aria-label="Activity trend chart"><svg viewBox="0 0 500 150" role="img"><defs><linearGradient id="area" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#c9882e" stopOpacity=".34"/><stop offset="1" stopColor="#c9882e" stopOpacity="0"/></linearGradient></defs><path className="chart-grid" d="M0 25H500M0 75H500M0 125H500" /><path className="chart-area" d="M0 122 C45 114 54 82 98 91 S160 105 200 66 S273 96 310 54 S374 75 414 38 S465 42 500 22 L500 150 L0 150Z" /><path className="chart-line" d="M0 122 C45 114 54 82 98 91 S160 105 200 66 S273 96 310 54 S374 75 414 38 S465 42 500 22" /></svg></div></div>
                    <div className="preview-card log-card"><div className="card-head"><div><b>Live operations</b><span>Workspace activity</span></div><Radio className="size-3.5 text-emerald-400" /></div><div className="mt-3 space-y-1">{logRows.map((row) => <div className="log-row" key={row.name}><span className="log-avatar">{row.initials}</span><div><b>{row.name}</b><span>{row.action}</span><small>{row.meta}</small></div><time>{row.time}</time></div>)}</div></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-white/[0.06] bg-white/[0.018] px-5 py-8 sm:px-8"><div className="mx-auto flex max-w-6xl flex-wrap items-center justify-start gap-x-10 gap-y-4 font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-white/38"><span>One workspace</span><span className="size-1 rounded-full bg-white/15" /><span>Every operation</span><span className="size-1 rounded-full bg-white/15" /><span>Complete history</span><span className="size-1 rounded-full bg-white/15" /><span>Built for teams</span></div></section>

      <section id="platform" className="section-pad px-5 sm:px-8"><div className="mx-auto max-w-7xl"><div className="mb-14 max-w-2xl"><div className="section-kicker">01 &mdash; One connected platform</div><h2 className="section-title">All the tools your community actually needs.</h2><p className="section-copy">Designed together from the beginning, so every rank action, application, and session tells the same story.</p></div><div className="grid gap-4 md:grid-cols-2">{features.map(({ icon: Icon, eyebrow, title, description }) => <article key={title} className="feature-card"><p className="flex items-center gap-2.5 font-mono text-[11px] font-medium uppercase tracking-[0.1em] text-white/48"><span className="feature-icon"><Icon className="size-4" aria-hidden="true" /></span>{eyebrow}</p><h3 className="mt-5 text-2xl font-semibold tracking-[-0.02em] text-white">{title}</h3><p className="mt-3.5 max-w-md text-sm leading-7 text-white/58">{description}</p></article>)}</div></div></section>

      <section className="px-5 pb-20 sm:px-8 lg:pb-28"><div className="home-bot-panel mx-auto max-w-7xl"><div className="home-bot-mark"><BrandMark className="!h-20 !w-20 !rounded-[22px]" /></div><div className="relative z-10 max-w-2xl"><div className="section-kicker">Nexora for Discord</div><h2 className="mt-5 text-4xl font-semibold tracking-[-.055em] text-white sm:text-6xl">Every operation, one command away.</h2><p className="mt-5 max-w-xl text-sm leading-7 text-white/40">Link identities, request rank changes, review applications, inspect activity, and search the audit trail without turning Discord into a control panel maze.</p><Link href="/bot" className="home-bot-link mt-8 inline-flex items-center gap-2 text-sm font-semibold text-white">Explore the Discord bot <ArrowRight className="size-4" /></Link></div><div className="home-command-stack"><div><code>/link</code><span>Identity verified</span><Check className="size-4" /></div><div><code>/rank</code><span>Policy approved</span><ShieldCheck className="size-4" /></div><div><code>/audit</code><span>Receipt created</span><Fingerprint className="size-4" /></div></div></div></section>

      <section id="workflow" className="section-pad px-5 sm:px-8"><div className="mx-auto grid max-w-7xl items-center gap-16 lg:grid-cols-[.85fr_1.15fr]"><div><div className="section-kicker">02 &mdash; Safer by design</div><h2 className="section-title">Every action has context.</h2><p className="section-copy">Nexora Rank shows who requested a change, why it happened, what rules allowed it, and what changed next.</p><div className="mt-8 space-y-4">{["Permission-aware rank paths", "Approval flows for sensitive actions", "Searchable, exportable audit history"].map((item) => <div key={item} className="flex items-center gap-3 text-sm text-white/68"><span className="flex size-6 items-center justify-center rounded-full bg-emerald-400/10 text-emerald-300"><Check className="size-3.5" /></span>{item}</div>)}</div></div><div className="flow-console"><div className="flow-header"><span>Promotion workflow</span><span className="mini-chip">Ready</span></div><div className="flow-line"><FlowNode icon={Bot} label="Discord command" value="/promote MiraPlays" /><span className="flow-connector" /><FlowNode icon={ShieldCheck} label="Policy check" value="3 rules passed" success /><span className="flow-connector" /><FlowNode icon={GitBranch} label="Roblox rank" value="Senior Barista" /></div><div className="mx-5 mb-5 rounded-2xl border border-white/[0.07] bg-black/20 p-4 sm:mx-7 sm:mb-7"><div className="flex items-center justify-between"><div className="flex items-center gap-2 text-xs font-medium text-white/74"><ShieldCheck className="size-4 text-emerald-400" /> Safe to execute</div><span className="text-[10px] text-white/28">Preview mode</span></div><p className="mt-2 text-xs leading-5 text-white/34">MiraPlays meets the minimum activity requirement, follows an allowed rank path, and is not inside a promotion cooldown.</p></div></div></div></section>

      <section id="security" className="section-pad px-5 sm:px-8"><div className="security-panel mx-auto max-w-7xl"><div className="relative z-10 max-w-2xl"><div className="section-kicker">03 &mdash; Trust center</div><h2 className="section-title">Built without asking for your Roblox cookie.</h2><p className="section-copy">Account connections will use official OAuth and scoped Open Cloud permissions. Your credentials stay with Roblox and Discord.</p></div><div className="relative z-10 mt-12 grid gap-4 sm:grid-cols-3"><TrustItem title="Scoped access" text="Connect only the permissions each workspace needs." /><TrustItem title="Encrypted secrets" text="Sensitive configuration never appears in dashboards or logs." /><TrustItem title="Action evidence" text="Every privileged operation leaves a readable audit record." /></div></div></section>

      <section id="pricing" className="section-pad px-5 sm:px-8"><div className="mx-auto max-w-6xl"><div className="max-w-2xl"><div className="section-kicker">04 &mdash; Pricing</div><h2 className="section-title">Your first workspace is free.</h2><p className="section-copy">We&apos;re building the useful core first. Premium plans and checkout will arrive after the platform is stable.</p></div><div className="mt-10 grid gap-4 text-left md:grid-cols-3"><PriceCard name="Free" price="€0" description="For a growing community getting organized." items={["1 workspace", "Core rank operations", "Activity overview", "Applications"]} /><PriceCard featured name="Plus" price="Coming soon" description="For teams that need deeper control." items={["Advanced workflows", "Longer history", "Custom branding", "Priority sync"]} /><PriceCard name="Pro" price="Coming soon" description="For multi-group operations." items={["Multiple workspaces", "Developer API", "Advanced exports", "Priority support"]} /></div></div></section>

      <section className="px-5 pb-16 pt-8 sm:px-8"><div className="cta-panel mx-auto max-w-7xl"><div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between"><div className="max-w-xl"><h2 className="text-4xl font-semibold tracking-[-0.025em] text-white sm:text-5xl">A better way to run the group.</h2><p className="mt-4 max-w-lg text-sm leading-7 text-white/58">Sign in with Discord, create your workspace, and connect the community you operate.</p></div><Link href="/login?next=/dashboard" className="button-glow inline-flex h-12 shrink-0 items-center gap-2 rounded-xl px-5 text-sm font-semibold">Open Nexora Rank <ArrowRight className="size-4" aria-hidden="true" /></Link></div></div></section>

      <footer className="border-t border-white/[0.06] px-5 py-8 sm:px-8"><div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-5 sm:flex-row"><div className="flex items-center gap-2.5"><BrandMark compact /><span className="text-sm font-semibold text-white">Nexora Rank</span><span className="ml-2 text-xs text-white/24">Community operations, connected.</span></div><div className="flex flex-wrap justify-center gap-5 text-xs text-white/32"><Link href="/security" className="hover:text-white">Security</Link><Link href="/pricing" className="hover:text-white">Pricing</Link><Link href="/legal/terms-of-service" className="hover:text-white">Terms</Link><Link href="/legal/privacy" className="hover:text-white">Privacy</Link><Link href="/legal" className="hover:text-white">Legal</Link><span>© 2026 Nexora</span></div></div></footer>
    </main>
  );
}

function PreviewStat({ label, value, change, icon: Icon }: { label: string; value: string; change: string; icon: typeof UsersRound }) { return <div className="preview-stat"><div><span>{label}</span><b>{value}</b><small>{change} this week</small></div><div className="stat-icon"><Icon className="size-3.5" /></div></div>; }
function FlowNode({ icon: Icon, label, value, success = false }: { icon: typeof Bot; label: string; value: string; success?: boolean }) { return <div className="flow-node"><div className={success ? "success" : ""}><Icon className="size-5" /></div><span>{label}</span><b>{value}</b></div>; }
function TrustItem({ title, text }: { title: string; text: string }) { return <article className="trust-item"><ShieldCheck className="size-5 text-[#e8c489]" /><h3>{title}</h3><p>{text}</p></article>; }
function PriceCard({ name, price, description, items, featured = false }: { name: string; price: string; description: string; items: string[]; featured?: boolean }) { return <article className={`price-card ${featured ? "featured" : ""}`}>{featured && <span className="price-badge">PLANNED</span>}<p className="text-sm font-semibold text-white/72">{name}</p><h3>{price}</h3><p className="min-h-12 text-sm leading-6 text-white/38">{description}</p><div className="my-6 h-px bg-white/[0.07]" /><ul className="space-y-3">{items.map((item) => <li key={item}><Check className="size-3.5" />{item}</li>)}</ul></article>; }
