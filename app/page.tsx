import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Activity, ArrowRight, Blocks, Check, Clock3, FileCheck2, Fingerprint,
  Gauge, GitBranch, LayoutGrid, Link2, ListChecks, LockKeyhole, Radio,
  ShieldCheck, Sparkle, TrendingUp, UsersRound,
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

// The product render's navigation, grouped the way the real workspace is.
type RailItem = { icon: typeof Gauge; label: string; active?: boolean; soon?: boolean };

const railGroups: { label: string; items: RailItem[] }[] = [
  { label: "Workspace", items: [
    { icon: Gauge, label: "Overview", active: true },
    { icon: Activity, label: "Activity" },
    { icon: UsersRound, label: "Members" },
  ] },
  { label: "Operations", items: [
    { icon: GitBranch, label: "Ranking" },
    { icon: FileCheck2, label: "Applications" },
    { icon: Blocks, label: "Automations" },
    { icon: ListChecks, label: "Quotas", soon: true },
  ] },
  { label: "Identity", items: [
    { icon: Link2, label: "Connections" },
    { icon: Fingerprint, label: "Audit trail" },
  ] },
];

type HomeProps = {
  searchParams: Promise<{ code?: string | string[] }>;
};

export default async function Home({ searchParams }: HomeProps) {
  // Supabase falls back to the configured Site URL when a requested OAuth
  // redirect is missing from its allow-list. Do not discard the one-time code
  // in that case: send it through the normal PKCE session exchange and setup.
  const params = await searchParams;
  const oauthCode = Array.isArray(params.code) ? params.code[0] : params.code;
  if (oauthCode) {
    redirect(`/auth/callback?code=${encodeURIComponent(oauthCode)}&next=%2Fonboarding`);
  }

  return (
    <main className="site-shell island-clearance overflow-hidden">
      <SiteNav />

      <section className="below-island px-5 pb-20 pt-6 sm:px-8 lg:pb-28">
        <div className="mx-auto max-w-7xl">
          {/* Asymmetric: the headline holds the wide column, the supporting
              claim and actions sit bottom-aligned in the narrower one. */}
          <div className="grid items-end gap-x-16 gap-y-9 lg:grid-cols-[1.12fr_0.88fr]">
            <div>
              <Link href="/team" className="chip" data-tone="brass">
                <Sparkle className="size-3" aria-hidden="true" />
                Nexora Identity Network — private beta
              </Link>
              <h1 className="mt-6 font-display text-[clamp(2.7rem,5.6vw,5.1rem)] font-extrabold leading-[0.96] tracking-[-0.03em] text-white">
                Run your group.
                <br />
                <span className="text-[#d79a9a]">Not the busywork.</span>
              </h1>
            </div>
            <div className="lg:pb-3">
              <p className="max-w-md text-base leading-7 text-white/64">
                Connect Discord and Roblox identities, then run ranking, activity, applications,
                and automation from one auditable control room.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Link href="/login?next=/onboarding" className="pill pill-solid pill-lg">
                  Start your workspace <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
                <Link href="/security" className="pill pill-ghost pill-lg">
                  <Fingerprint className="size-4" aria-hidden="true" /> How access works
                </Link>
              </div>
              <p className="mt-4 text-xs text-white/48">Free to start · No card needed · Discord OAuth</p>
            </div>
          </div>

          {/* Product render. The ambient field is bounded by .stage and always
              sits behind the chassis — never loose behind body copy. */}
          <div className="stage mt-12 lg:mt-16">
            <div className="stage-field" aria-hidden="true" />
            <div className="stage-inner p-4 sm:p-10 lg:p-16">
              <div className="chassis">
                <div className="chassis-screen">
                  <div className="flex items-center gap-2 border-b border-white/[0.07] px-4 py-2.5">
                    <div className="flex items-center gap-1.5">
                      <span className="size-2 rounded-full bg-white/12" />
                      <span className="size-2 rounded-full bg-white/12" />
                      <span className="size-2 rounded-full bg-white/12" />
                    </div>
                    <div className="mx-auto flex items-center gap-1.5 font-mono text-[10px] text-white/38">
                      <LockKeyhole className="size-2.5" aria-hidden="true" /> nexorarank.tech/dashboard
                    </div>
                    <div className="size-6" />
                  </div>

                  <div className="grid sm:grid-cols-[188px_1fr]">
                    {/* Grouped rail with mono section labels. */}
                    <aside className="hidden border-r border-white/[0.06] bg-white/[0.014] sm:block">
                      <div className="flex items-center gap-2 px-5 pt-5">
                        <BrandMark compact />
                        <span className="font-display text-xs font-extrabold text-white">Nexora</span>
                      </div>
                      <div className="rail">
                        {railGroups.map((group) => (
                          <div key={group.label} className="rail-group">
                            <p className="microlabel">{group.label}</p>
                            {group.items.map((item) => (
                              <span
                                key={item.label}
                                className="rail-item"
                                data-active={item.active ? "true" : undefined}
                                data-disabled={item.soon ? "true" : undefined}
                              >
                                <item.icon className="size-3.5" aria-hidden="true" />
                                {item.label}
                                {item.soon && <span className="rail-soon">Soon</span>}
                              </span>
                            ))}
                          </div>
                        ))}
                      </div>
                    </aside>

                    <div className="p-4 sm:p-6">
                      <p className="microlabel">Overview</p>
                      <h3 className="mt-1.5 font-display text-lg font-extrabold tracking-[-0.02em] text-white sm:text-xl">
                        Sunset Diner — operations
                      </h3>
                      <p className="mt-1 text-xs text-white/52">Here&apos;s what changed since your last visit.</p>

                      {/* Segmented pill control — pill riding in a trough. */}
                      <div className="segmented mt-5">
                        <span className="segment" data-active="true"><Gauge className="size-3.5" aria-hidden="true" /> Overview</span>
                        <span className="segment"><Activity className="size-3.5" aria-hidden="true" /> Activity</span>
                        <span className="segment" data-collapse="sm"><GitBranch className="size-3.5" aria-hidden="true" /> Ranking</span>
                        <span className="segment" data-collapse="lg"><LayoutGrid className="size-3.5" aria-hidden="true" /> Departments</span>
                      </div>

                      <div className="mt-5 grid gap-3 sm:grid-cols-3">
                        <Stat label="Active staff" value="42" delta="+12% this week" dir="up" icon={UsersRound} />
                        <Stat label="Rank actions" value="187" delta="+24% this week" dir="up" icon={GitBranch} />
                        <Stat label="Hours tracked" value="328" delta="+8% this week" dir="up" icon={Clock3} />
                      </div>

                      <div className="mt-3 grid gap-3 lg:grid-cols-[1.35fr_1fr]">
                        <div className="glass-faint p-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="microlabel">Activity pulse</p>
                              <p className="mt-1 text-[13px] font-semibold text-white">Last 7 days</p>
                            </div>
                            <span className="chip" data-tone="live"><span className="chip-dot" />Live</span>
                          </div>
                          <div className="mt-3" aria-label="Activity trend chart">
                            <svg viewBox="0 0 500 150" role="img" className="w-full">
                              <defs>
                                <linearGradient id="pulse" x1="0" x2="0" y1="0" y2="1">
                                  <stop offset="0" stopColor="#d79a9a" stopOpacity=".3" />
                                  <stop offset="1" stopColor="#d79a9a" stopOpacity="0" />
                                </linearGradient>
                              </defs>
                              <path d="M0 25H500M0 75H500M0 125H500" stroke="rgba(255,255,255,.06)" strokeWidth="1" />
                              <path d="M0 122 C45 114 54 82 98 91 S160 105 200 66 S273 96 310 54 S374 75 414 38 S465 42 500 22 L500 150 L0 150Z" fill="url(#pulse)" />
                              <path d="M0 122 C45 114 54 82 98 91 S160 105 200 66 S273 96 310 54 S374 75 414 38 S465 42 500 22" fill="none" stroke="#d79a9a" strokeWidth="2.2" strokeLinecap="round" />
                            </svg>
                          </div>
                        </div>

                        <div className="glass-faint p-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="microlabel">Live operations</p>
                              <p className="mt-1 text-[13px] font-semibold text-white">Workspace activity</p>
                            </div>
                            <Radio className="size-3.5 text-[#d79a9a]" aria-hidden="true" />
                          </div>
                          <div className="mt-3 space-y-2">
                            {logRows.map((row) => (
                              <div key={row.name} className="flex items-center gap-2.5">
                                <span className="flex size-7 flex-none items-center justify-center rounded-full bg-white/[0.07] font-mono text-[9px] font-medium text-white/70">
                                  {row.initials}
                                </span>
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-[12px] font-semibold text-white">
                                    {row.name} <span className="font-normal text-white/50">{row.action}</span>
                                  </p>
                                  <p className="truncate font-mono text-[10px] text-white/42">{row.meta}</p>
                                </div>
                                <time className="font-mono text-[10px] text-white/38">{row.time}</time>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-white/[0.06] px-5 py-8 sm:px-8">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-10 gap-y-4">
          {["One workspace", "Every operation", "Complete history", "Built for teams"].map((item, i) => (
            <span key={item} className="flex items-center gap-10">
              {i > 0 && <span className="size-1 rounded-full bg-white/15" />}
              <span className="microlabel">{item}</span>
            </span>
          ))}
        </div>
      </section>

      <section id="platform" className="section-pad px-5 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 max-w-2xl">
            <p className="microlabel">01 — One connected platform</p>
            <h2 className="section-title mt-4">All the tools your community actually needs.</h2>
            <p className="section-copy">
              Designed together from the beginning, so every rank action, application, and session
              tells the same story.
            </p>
          </div>
          <div className="grid gap-3.5 md:grid-cols-2">
            {features.map(({ icon: Icon, eyebrow, title, description }) => (
              <article key={title} className="glass p-6 sm:p-7">
                <p className="flex items-center gap-2.5">
                  <span className="stat-icon"><Icon className="size-3.5" aria-hidden="true" /></span>
                  <span className="microlabel">{eyebrow}</span>
                </p>
                <h3 className="mt-5 font-display text-2xl font-extrabold tracking-[-0.022em] text-white">{title}</h3>
                <p className="mt-3.5 max-w-md text-sm leading-7 text-white/62">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 pb-20 sm:px-8 lg:pb-28">
        <div className="stage mx-auto max-w-7xl">
          <div className="stage-field" aria-hidden="true" />
          <div className="stage-inner glass-strong grid gap-10 p-7 sm:p-12 lg:grid-cols-[1.1fr_.9fr] lg:items-center">
            <div>
              <p className="microlabel">The people behind Nexora</p>
              <h2 className="mt-4 font-display text-4xl font-extrabold tracking-[-0.03em] text-white sm:text-5xl">
                Small team. Serious standard.
              </h2>
              <p className="mt-5 max-w-xl text-sm leading-7 text-white/58">
                Nexora is built by Roblox community operators who care about reliable tools,
                careful permissions, and support that speaks plainly.
              </p>
              <Link href="/team" className="pill pill-ghost mt-8">
                Meet the team <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </div>
            <div className="space-y-2.5">
              {[
                { label: "Product", text: "Focused community operations", icon: Sparkle },
                { label: "Safety", text: "Reviewed access and audit trails", icon: ShieldCheck },
                { label: "Support", text: "Human help during private beta", icon: UsersRound },
              ].map(({ label, text, icon: Icon }) => (
                <div key={label} className="glass-faint flex items-center gap-3 px-4 py-3.5">
                  <span className="font-mono text-[11px] font-medium uppercase tracking-wider text-[#d79a9a]">{label}</span>
                  <span className="flex-1 text-[13px] text-white/62">{text}</span>
                  <Icon className="size-4 text-[#d79a9a]" aria-hidden="true" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="workflow" className="section-pad px-5 sm:px-8">
        <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[.85fr_1.15fr]">
          <div>
            <p className="microlabel">02 — Safer by design</p>
            <h2 className="section-title mt-4">Every action has context.</h2>
            <p className="section-copy">
              Nexora Rank shows who requested a change, why it happened, what rules allowed it, and
              what changed next.
            </p>
            <div className="mt-8 space-y-4">
              {["Permission-aware rank paths", "Approval flows for sensitive actions", "Searchable, exportable audit history"].map((item) => (
                <div key={item} className="flex items-center gap-3 text-sm text-white/70">
                  <span className="flex size-6 flex-none items-center justify-center rounded-full bg-[#d79a9a]/10 text-[#d79a9a]">
                    <Check className="size-3.5" aria-hidden="true" />
                  </span>
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="glass p-6 sm:p-8">
            <div className="flex items-center justify-between">
              <p className="microlabel">Promotion workflow</p>
              <span className="chip" data-tone="live"><span className="chip-dot" />Ready</span>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <FlowNode icon={UsersRound} label="Authorized staff" value="Request received" />
              <FlowNode icon={ShieldCheck} label="Policy check" value="3 rules passed" success />
              <FlowNode icon={GitBranch} label="Roblox rank" value="Senior Barista" />
            </div>
            <div className="glass-faint mt-3 p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 text-xs font-medium text-white/76">
                  <ShieldCheck className="size-4 text-[#d79a9a]" aria-hidden="true" /> Safe to execute
                </span>
                <span className="microlabel">Preview mode</span>
              </div>
              <p className="mt-2 text-xs leading-5 text-white/50">
                MiraPlays meets the minimum activity requirement, follows an allowed rank path, and
                is not inside a promotion cooldown.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="security" className="section-pad px-5 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <p className="microlabel">03 — Trust center</p>
            <h2 className="section-title mt-4">Built without asking for your Roblox cookie.</h2>
            <p className="section-copy">
              Account connections use official OAuth and scoped Open Cloud permissions. Your
              credentials stay with Roblox and Discord.
            </p>
          </div>
          <div className="mt-10 grid gap-3.5 sm:grid-cols-3">
            <TrustItem title="Scoped access" text="Connect only the permissions each workspace needs." />
            <TrustItem title="Encrypted secrets" text="Sensitive configuration never appears in dashboards or logs." />
            <TrustItem title="Action evidence" text="Every privileged operation leaves a readable audit record." />
          </div>
        </div>
      </section>

      <section id="pricing" className="section-pad px-5 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-2xl">
            <p className="microlabel">04 — Pricing</p>
            <h2 className="section-title mt-4">Your first workspace is free.</h2>
            <p className="section-copy">
              We&apos;re building the useful core first. Premium plans and checkout will arrive after
              the platform is stable.
            </p>
          </div>
          <div className="mt-10 grid gap-3.5 md:grid-cols-3">
            <PriceCard name="Free" price="€0" description="For a growing community getting organized." items={["1 workspace", "Core rank operations", "Activity overview", "Applications"]} />
            <PriceCard featured name="Plus" price="Coming soon" description="For teams that need deeper control." items={["Advanced workflows", "Longer history", "Custom branding", "Priority sync"]} />
            <PriceCard name="Pro" price="Coming soon" description="For multi-group operations." items={["Multiple workspaces", "Developer API", "Advanced exports", "Priority support"]} />
          </div>
        </div>
      </section>

      <section className="px-5 pb-16 pt-8 sm:px-8">
        <div className="stage mx-auto max-w-7xl">
          <div className="stage-field" aria-hidden="true" />
          <div className="stage-inner glass-strong flex flex-col gap-8 p-8 sm:p-12 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-xl">
              <h2 className="font-display text-4xl font-extrabold tracking-[-0.028em] text-white sm:text-5xl">
                A better way to run the group.
              </h2>
              <p className="mt-4 max-w-lg text-sm leading-7 text-white/60">
                Sign in with Discord, create your workspace, and connect the community you operate.
              </p>
            </div>
            <Link href="/login?next=/dashboard" className="pill pill-solid pill-lg shrink-0">
              Open Nexora Rank <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/[0.06] px-5 py-8 sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-5 sm:flex-row">
          <div className="flex items-center gap-2.5">
            <BrandMark compact />
            <span className="font-display text-sm font-extrabold text-white">Nexora Rank</span>
            <span className="ml-2 text-xs text-white/34">Community operations, connected.</span>
          </div>
          <div className="flex flex-wrap justify-center gap-5 text-xs text-white/42">
            <Link href="/security" className="hover:text-white">Security</Link>
            <Link href="/pricing" className="hover:text-white">Pricing</Link>
            <Link href="/legal/terms-of-service" className="hover:text-white">Terms</Link>
            <Link href="/legal/privacy" className="hover:text-white">Privacy</Link>
            <Link href="/legal" className="hover:text-white">Legal</Link>
            <span>© 2026 Nexora</span>
          </div>
        </div>
      </footer>
    </main>
  );
}

function Stat({ label, value, delta, dir, icon: Icon }: { label: string; value: string; delta: string; dir: "up" | "down"; icon: typeof UsersRound }) {
  return (
    <div className="stat glass-faint">
      <div className="stat-head">
        <p className="microlabel">{label}</p>
        <span className="stat-icon"><Icon className="size-3.5" aria-hidden="true" /></span>
      </div>
      <p className="numeral stat-value">{value}</p>
      <p className="stat-delta" data-dir={dir}>
        <TrendingUp className="mr-1 inline size-3" aria-hidden="true" />
        {delta}
      </p>
    </div>
  );
}

function FlowNode({ icon: Icon, label, value, success = false }: { icon: typeof UsersRound; label: string; value: string; success?: boolean }) {
  return (
    <div className="glass-faint p-4">
      <span className={`stat-icon ${success ? "!text-[#d79a9a]" : ""}`}><Icon className="size-4" aria-hidden="true" /></span>
      <p className="microlabel mt-3">{label}</p>
      <p className="mt-1.5 font-mono text-[12px] font-medium text-white">{value}</p>
    </div>
  );
}

function TrustItem({ title, text }: { title: string; text: string }) {
  return (
    <article className="glass p-6">
      <span className="stat-icon"><ShieldCheck className="size-4" aria-hidden="true" /></span>
      <h3 className="mt-4 font-display text-base font-extrabold tracking-[-0.015em] text-white">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-white/58">{text}</p>
    </article>
  );
}

function PriceCard({ name, price, description, items, featured = false }: { name: string; price: string; description: string; items: string[]; featured?: boolean }) {
  return (
    <article className={featured ? "glass-strong p-7" : "glass p-7"}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-white/78">{name}</p>
        {featured && <span className="chip" data-tone="brass">Planned</span>}
      </div>
      <h3 className="numeral mt-4 text-3xl">{price}</h3>
      <p className="mt-2 min-h-10 text-sm leading-6 text-white/52">{description}</p>
      <div className="my-6 h-px bg-white/[0.08]" />
      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item} className="flex items-center gap-2.5 text-sm text-white/70">
            <Check className="size-3.5 flex-none text-[#d79a9a]" aria-hidden="true" />
            {item}
          </li>
        ))}
      </ul>
    </article>
  );
}
