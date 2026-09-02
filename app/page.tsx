import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Activity,
  ArrowRight,
  Award,
  Bot,
  Check,
  ChevronDown,
  ChevronRight,
  CircleDot,
  Clock3,
  FileCheck2,
  Fingerprint,
  Gauge,
  KeyRound,
  LayoutDashboard,
  LockKeyhole,
  MessageSquareText,
  Radio,
  ScrollText,
  ShieldCheck,
  Sparkles,
  Timer,
  UsersRound,
  Workflow,
  Zap,
} from "lucide-react";
import { BrandMark } from "@/components/brand-mark";

type HomeProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const features = [
  {
    icon: Award,
    title: "Policy-based ranking",
    text: "Define who can request rank changes, which paths are allowed, and when an approval is required before anything happens.",
  },
  {
    icon: Activity,
    title: "Activity and quotas",
    text: "Record sessions, compare progress with team quotas, and understand participation without piecing together spreadsheets.",
  },
  {
    icon: FileCheck2,
    title: "Applications",
    text: "Build application forms, collect responses, organize review, and keep decisions connected to the workspace.",
  },
  {
    icon: Workflow,
    title: "Automations",
    text: "Turn repeatable operations into rules with a visible run history, so your team can automate without losing oversight.",
  },
  {
    icon: MessageSquareText,
    title: "Discord communications",
    text: "Send plain messages or branded embeds with headers, colors, images, footers, and a custom server nickname.",
  },
  {
    icon: ScrollText,
    title: "Complete audit history",
    text: "See who changed what, when it happened, and which workspace action produced the result.",
  },
];

const questions = [
  [
    "Is Nexora only a Discord bot?",
    "No. The bot is the fast command layer inside Discord. The dashboard is the control center for policies, forms, activity, automations, members, connections, and history.",
  ],
  [
    "Is Roblox required right now?",
    "Yes. Every workspace owner must connect Roblox through official OAuth and select a group they own before launch. Nexora never requests passwords or Roblox cookies.",
  ],
  [
    "Does the bot need Administrator?",
    "No. Nexora is designed around specific permissions. Messaging needs channel access and Send Messages; role sync needs Manage Roles only when you choose to use it.",
  ],
  [
    "Can multiple people manage one workspace?",
    "Yes. Invite members by email, assign roles, remove access, or transfer ownership. Sensitive changes remain visible in workspace history.",
  ],
  [
    "What happens if I delete a workspace?",
    "After you type the exact workspace name and confirm, the workspace and its connected records are permanently deleted. Archive it instead if you may need it again.",
  ],
  [
    "How much does the beta cost?",
    "The current beta starts free. Paid checkout is not active, and future plans will be explained before billing is introduced.",
  ],
];

export default async function Home({ searchParams }: HomeProps) {
  const params = await searchParams;
  const oauthCode = Array.isArray(params.code) ? params.code[0] : params.code;
  if (oauthCode) {
    const callbackParams = new URLSearchParams({
      code: oauthCode,
      next: "/dashboard",
    });
    redirect(`/auth/callback?${callbackParams.toString()}`);
  }

  return (
    <main className="home-page">
      <nav className="home-nav" aria-label="Primary navigation">
        <Link href="/" className="home-brand" aria-label="Nexora Rank home">
          <BrandMark />
          <span>Nexora Rank</span>
        </Link>
        <div className="home-nav-links">
          <Link href="/">Home</Link>
          <a href="#how-it-works">How it works</a>
          <Link href="/partners">Partners</Link>
          <Link href="/beta">Beta</Link>
          <details className="home-nav-more">
            <summary>
              More <ChevronDown />
            </summary>
            <div>
              <Link href="/groups">Communities using Nexora</Link>
              <Link href="/verify">Discord verification</Link>
              <Link href="https://discord.gg/YY9nXqqWTk" target="_blank">
                Community &amp; support
              </Link>
              <Link href="/bot">Discord bot</Link>
              <Link href="/investors">Investors</Link>
              <Link href="/pricing">Pricing</Link>
              <Link href="/security">Security</Link>
              <Link href="/status">Status</Link>
              <Link href="/team">Team</Link>
            </div>
          </details>
        </div>
        <div className="home-nav-actions">
          <Link href="/login?next=/dashboard" className="home-signin">
            Sign in
          </Link>
          <Link
            href="/login?next=/dashboard"
            className="home-primary home-primary-small"
          >
            Open Nexora <ArrowRight />
          </Link>
        </div>
      </nav>

      <section className="home-hero">
        <div className="home-hero-grid" aria-hidden="true" />
        <div className="home-hero-glow" aria-hidden="true" />
        <div className="home-hero-copy">
          <div className="home-status">
            <span>
              <Radio />
            </span>{" "}
            Nexora is live in beta
          </div>
          <h1>
            Your Roblox community.
            <br />
            <em>One operating system.</em>
          </h1>
          <p>
            Nexora brings Discord operations, staff management, ranking
            policies, activity, applications, and automations into one secure
            workspace built for Roblox communities.
          </p>
          <div className="home-hero-actions">
            <Link href="/login?next=/dashboard" className="home-primary">
              Create your workspace <ArrowRight />
            </Link>
            <a href="#platform" className="home-secondary">
              See what Nexora does <ChevronRight />
            </a>
          </div>
          <div className="home-proof-row">
            <span>
              <Check /> Free beta access
            </span>
            <span>
              <Check /> Official Roblox OAuth required
            </span>
            <span>
              <Check /> No Administrator permission
            </span>
          </div>
        </div>

        <div
          className="home-product-stage"
          aria-label="Nexora workspace preview"
        >
          <div className="home-product-window">
            <div className="home-window-bar">
              <div>
                <i />
                <i />
                <i />
              </div>
              <span>nexora / workspace overview</span>
              <small>Live</small>
            </div>
            <div className="home-window-body">
              <aside>
                <div className="home-preview-brand">
                  <BrandMark compact />
                  <b>Nexora</b>
                </div>
                {[
                  LayoutDashboard,
                  Award,
                  Timer,
                  FileCheck2,
                  Workflow,
                  MessageSquareText,
                ].map((Icon, index) => (
                  <span className={index === 0 ? "active" : ""} key={index}>
                    <Icon />
                    <i />
                  </span>
                ))}
              </aside>
              <div className="home-preview-main">
                <header>
                  <div>
                    <small>Workspace</small>
                    <h2>Atlas Community</h2>
                  </div>
                  <span>
                    <CircleDot /> Operational
                  </span>
                </header>
                <div className="home-preview-metrics">
                  <article>
                    <span>Active staff</span>
                    <strong>24</strong>
                    <small>+4 this week</small>
                  </article>
                  <article>
                    <span>Quota progress</span>
                    <strong>78%</strong>
                    <small>On track</small>
                  </article>
                  <article>
                    <span>Open reviews</span>
                    <strong>12</strong>
                    <small>3 new today</small>
                  </article>
                </div>
                <div className="home-preview-grid">
                  <article className="home-activity-card">
                    <div className="home-card-title">
                      <div>
                        <b>Activity overview</b>
                        <small>Minutes recorded this week</small>
                      </div>
                      <span>7 days</span>
                    </div>
                    <div className="home-chart" aria-hidden="true">
                      {[42, 65, 51, 78, 59, 88, 72].map((height, index) => (
                        <i key={index} style={{ height: `${height}%` }} />
                      ))}
                    </div>
                    <div className="home-chart-labels">
                      <span>Mon</span>
                      <span>Tue</span>
                      <span>Wed</span>
                      <span>Thu</span>
                      <span>Fri</span>
                      <span>Sat</span>
                      <span>Sun</span>
                    </div>
                  </article>
                  <article className="home-events-card">
                    <div className="home-card-title">
                      <div>
                        <b>Recent operations</b>
                        <small>Audited workspace events</small>
                      </div>
                    </div>
                    <ul>
                      <li>
                        <span className="rank">
                          <Award />
                        </span>
                        <div>
                          <b>Rank approved</b>
                          <small>Moderator → Senior Moderator</small>
                        </div>
                        <time>2m</time>
                      </li>
                      <li>
                        <span className="form">
                          <FileCheck2 />
                        </span>
                        <div>
                          <b>Application reviewed</b>
                          <small>Staff intake · accepted</small>
                        </div>
                        <time>14m</time>
                      </li>
                      <li>
                        <span className="session">
                          <Timer />
                        </span>
                        <div>
                          <b>Session completed</b>
                          <small>Patrol · 46 minutes</small>
                        </div>
                        <time>1h</time>
                      </li>
                    </ul>
                  </article>
                </div>
              </div>
            </div>
          </div>
          <div className="home-floating-card home-floating-discord">
            <Image src="/discord.svg" alt="" width={22} height={22} />
            <div>
              <b>Discord connected</b>
              <span>Commands and messages ready</span>
            </div>
            <Check />
          </div>
          <div className="home-floating-card home-floating-policy">
            <ShieldCheck />
            <div>
              <b>Policy check passed</b>
              <span>Rank request approved</span>
            </div>
          </div>
        </div>
      </section>

      <section className="home-platform-strip" aria-label="Platform overview">
        <p>Built to connect the places your community already works</p>
        <div>
          <span className="discord">
            <Image src="/discord.svg" alt="Discord" width={25} height={25} />{" "}
            Discord
          </span>
          <i>+</i>
          <span className="roblox">
            <Image src="/roblox.svg" alt="Roblox" width={24} height={24} />{" "}
            Roblox
          </span>
          <i>→</i>
          <span className="nexora">
            <BrandMark compact /> Nexora workspace
          </span>
        </div>
      </section>

      <section className="home-intro" id="platform">
        <div className="home-section-label">
          <Sparkles /> What Nexora is
        </div>
        <div className="home-intro-grid">
          <h2>
            Stop running your community through scattered commands, forms, and
            spreadsheets.
          </h2>
          <div>
            <p>
              Nexora is a community operations platform. It gives owners and
              staff one place to manage the work behind a Roblox group—from
              connected accounts and ranking to applications, activity,
              communications, and accountability.
            </p>
            <p>
              The Discord bot keeps everyday actions close to your team. The
              dashboard holds the deeper configuration, permissions, review
              queues, and history that should never be hidden inside a command.
            </p>
          </div>
        </div>
        <div className="home-principles">
          <article>
            <span>01</span>
            <h3>One source of truth</h3>
            <p>
              Members, roles, policies, activity, forms, connections, and
              records live in the same workspace.
            </p>
          </article>
          <article>
            <span>02</span>
            <h3>Rules before actions</h3>
            <p>
              Permissions and policies decide whether sensitive operations are
              allowed before Nexora runs them.
            </p>
          </article>
          <article>
            <span>03</span>
            <h3>History after actions</h3>
            <p>
              Privileged changes create a clear trail your leadership team can
              review later.
            </p>
          </article>
        </div>
      </section>

      <section className="home-features">
        <div className="home-section-heading">
          <div>
            <div className="home-section-label">
              <LayoutDashboard /> The complete platform
            </div>
            <h2>Everything your team needs to operate clearly.</h2>
          </div>
          <p>
            Start with the tools you need today. Add deeper policies and
            automations as your team grows.
          </p>
        </div>
        <div className="home-feature-grid">
          {features.map(({ icon: Icon, title, text }, index) => (
            <article
              key={title}
              className={index === 0 || index === 5 ? "featured" : ""}
            >
              <span>
                <Icon />
              </span>
              <small>0{index + 1}</small>
              <h3>{title}</h3>
              <p>{text}</p>
              <Link href="/login?next=/dashboard">
                Explore in dashboard <ArrowRight />
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="home-identity-section">
        <div className="home-identity-visual">
          <div className="identity-line" aria-hidden="true" />
          <div className="identity-node discord">
            <Image
              src="/discord.svg"
              alt="Discord logo"
              width={40}
              height={40}
            />
            <span>Discord</span>
            <small>Commands, roles and communications</small>
          </div>
          <div className="identity-center">
            <BrandMark />
            <b>One member profile</b>
            <small>Shared account and permissions</small>
            <div>
              <span>Linked</span>
              <Check />
            </div>
          </div>
          <div className="identity-node roblox">
            <Image src="/roblox.svg" alt="Roblox logo" width={40} height={40} />
            <span>Roblox</span>
            <small>Account and group context</small>
          </div>
        </div>
        <div className="home-identity-copy">
          <div className="home-section-label">
            <Fingerprint /> Connected accounts
          </div>
          <h2>One person across Discord and Roblox.</h2>
          <p>
            Nexora is designed to connect a member’s Discord account with the
            Roblox account they choose, so policies and records refer to the
            same person across your operation.
          </p>
          <ul>
            <li>
              <Check />
              <span>
                <b>Private linking flow</b>Credentials never belong in Discord
                messages.
              </span>
            </li>
            <li>
              <Check />
              <span>
                <b>Shared permission context</b>Roles and workspace access stay
                understandable.
              </span>
            </li>
            <li>
              <Check />
              <span>
                <b>Verified Roblox ownership</b>Every workspace is connected to
                a group selected from the owner’s authorized account.
              </span>
            </li>
          </ul>
          <Link href="/beta">
            Apply for Nexora Beta <ArrowRight />
          </Link>
        </div>
      </section>

      <section className="home-process" id="how-it-works">
        <div className="home-section-heading">
          <div>
            <div className="home-section-label">
              <Zap /> How it works
            </div>
            <h2>From a new workspace to a working operation.</h2>
          </div>
          <p>
            Nexora keeps setup understandable and separates platform
            installation from personal sign-in.
          </p>
        </div>
        <div className="home-process-grid">
          <article>
            <span>01</span>
            <div>
              <UsersRound />
              <h3>Create a workspace</h3>
              <p>
                Name your community, invite the people who help run it, and
                assign only the access each person needs.
              </p>
            </div>
          </article>
          <article>
            <span>02</span>
            <div>
              <Bot />
              <h3>Connect Discord</h3>
              <p>
                Install the Nexora bot in your server, connect the server to the
                workspace, and choose which channels it can use.
              </p>
            </div>
          </article>
          <article>
            <span>03</span>
            <div>
              <Gauge />
              <h3>Configure operations</h3>
              <p>
                Add ranking paths, activity quotas, application forms, message
                templates, and automation rules.
              </p>
            </div>
          </article>
          <article>
            <span>04</span>
            <div>
              <ScrollText />
              <h3>Run and review</h3>
              <p>
                Let staff work from Discord or the dashboard while owners
                monitor requests, results, and audit history.
              </p>
            </div>
          </article>
        </div>
      </section>

      <section className="home-security" id="security">
        <div className="home-security-copy">
          <div className="home-section-label">
            <ShieldCheck /> Security by design
          </div>
          <h2>Powerful controls should never mean unlimited access.</h2>
          <p>
            Nexora is structured around workspace roles, scoped integrations,
            protected server-side secrets, and visible operational records.
          </p>
          <Link href="/security">
            Visit the trust center <ArrowRight />
          </Link>
        </div>
        <div className="home-security-list">
          <article>
            <span>
              <KeyRound />
            </span>
            <div>
              <h3>Least-privilege bot permissions</h3>
              <p>
                Nexora does not require Discord Administrator permission.
                Optional features ask only for what they use.
              </p>
            </div>
          </article>
          <article>
            <span>
              <LockKeyhole />
            </span>
            <div>
              <h3>Secrets stay server-side</h3>
              <p>
                Service credentials are kept out of browser bundles, while API
                keys are stored as one-way hashes.
              </p>
            </div>
          </article>
          <article>
            <span>
              <ScrollText />
            </span>
            <div>
              <h3>Auditable operations</h3>
              <p>
                Rank actions, member management, automations, and other
                sensitive changes leave reviewable records.
              </p>
            </div>
          </article>
          <article>
            <span>
              <ShieldCheck />
            </span>
            <div>
              <h3>Clear workspace controls</h3>
              <p>
                Transfer ownership, archive safely, or permanently delete only
                after typing the exact workspace name.
              </p>
            </div>
          </article>
        </div>
      </section>

      <section className="home-beta">
        <div>
          <div className="home-section-label">
            <Radio /> Available now
          </div>
          <h2>
            Built for real communities.
            <br />
            Growing in public beta.
          </h2>
        </div>
        <div className="home-beta-card">
          <span className="home-beta-live">
            <i /> Live
          </span>
          <h3>Start with a free workspace</h3>
          <p>
            Core workspace management, Discord connection, communications,
            ranking, activity, applications, automations, and history are
            available. Roblox OAuth and verified group ownership are required;
            the current Beta plan remains free.
          </p>
          <Link href="/login?next=/dashboard" className="home-primary">
            Open Nexora <ArrowRight />
          </Link>
        </div>
      </section>

      <section className="home-faq">
        <div className="home-faq-title">
          <div className="home-section-label">
            <MessageSquareText /> Common questions
          </div>
          <h2>Clear answers before you connect anything.</h2>
          <p>
            Everything important about the current beta, platform access, and
            permissions.
          </p>
        </div>
        <div className="home-faq-list">
          {questions.map(([question, answer], index) => (
            <details key={question} open={index === 0}>
              <summary>
                <span>{question}</span>
                <i>+</i>
              </summary>
              <p>{answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="home-final-cta">
        <div className="home-final-grid" aria-hidden="true" />
        <BrandMark />
        <div className="home-section-label">
          <Sparkles /> Your community, organized
        </div>
        <h2>
          Give your staff one place
          <br />
          to do the work properly.
        </h2>
        <p>
          Create a workspace, connect Discord, and bring your community
          operations out of scattered tools.
        </p>
        <div>
          <Link href="/beta" className="home-primary">
            Apply for the Beta <ArrowRight />
          </Link>
          <Link href="/investors" className="home-secondary">
            Investor overview
          </Link>
        </div>
      </section>

      <footer className="home-footer">
        <div className="home-footer-main">
          <div>
            <Link href="/" className="home-brand">
              <BrandMark />
              <span>Nexora Rank</span>
            </Link>
            <p>
              The operations workspace for Roblox communities using Discord.
            </p>
          </div>
          <div>
            <b>Product</b>
            <a href="#platform">Platform</a>
            <Link href="/beta">Beta program</Link>
            <Link href="/pricing">Pricing</Link>
            <Link href="/status">Status</Link>
          </div>
          <div>
            <b>Company</b>
            <Link href="/investors">Investors</Link>
            <Link href="/team">Team</Link>
            <Link href="/security">Security</Link>
            <Link href="/legal">Legal center</Link>
          </div>
          <div>
            <b>Get started</b>
            <Link href="/beta">Apply for Beta</Link>
            <Link href="/login">Sign in</Link>
            <Link href="/dashboard">Dashboard</Link>
            <Link href="/onboarding">Create workspace</Link>
          </div>
        </div>
        <div className="home-footer-bottom">
          <span>© 2026 Nexora Rank</span>
          <div>
            <Link href="/legal/terms-of-service">Terms</Link>
            <Link href="/legal/privacy">Privacy</Link>
            <Link href="/legal/cookies">Cookies</Link>
          </div>
          <span>Independent from Discord and Roblox</span>
        </div>
      </footer>
    </main>
  );
}
