"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowRight,
  BadgeCheck,
  Bot,
  CircleCheckBig,
  Clock3,
  Fingerprint,
  Gamepad2,
  LockKeyhole,
  Sparkles,
  UsersRound,
} from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Provider = "discord" | "roblox";

const plan = {
  name: "Starter",
  price: "Free",
  description: "A mid-range launch tier for one workspace, core rank operations, and a clean setup path before billing exists.",
};

export default function SetupPage() {
  const searchParams = useSearchParams();
  const [stage, setStage] = useState(0);
  const [provider, setProvider] = useState<Provider>(searchParams.get("provider") === "roblox" ? "roblox" : "discord");
  const [name, setName] = useState("Avery");
  const [surname, setSurname] = useState("Stone");
  const [email, setEmail] = useState("avery@nexora.app");
  const [password, setPassword] = useState("");
  const [workspaceName, setWorkspaceName] = useState("Brew & Co.");
  const [workspaceId] = useState(() => `wrk_${Math.random().toString(36).slice(2, 10)}`);

  const appName = useMemo(() => `${workspaceName.replace(/\s+/g, " ").trim() || "Nexora"} App`, [workspaceName]);
  const workspaceSlug = useMemo(() => workspaceName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "workspace", [workspaceName]);
  const completed = [name, surname, email, workspaceName].filter(Boolean).length;

  return (
    <main className="auth-page">
      <div className="auth-aurora" />
      <ThemeToggle className="fixed right-5 top-5 z-20 sm:right-8 sm:top-8" />
      <Link href="/login" className="absolute left-5 top-5 z-10 inline-flex items-center gap-2 text-sm text-white/45 transition hover:text-white sm:left-8 sm:top-8">
        <LockKeyhole className="size-4" /> Back to sign-in
      </Link>
      <div className="grid w-full max-w-6xl gap-6 lg:grid-cols-[1.02fr_.98fr]">
        <section className="auth-card">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5"><BrandMark /><span className="text-base font-semibold text-white">Nexora Rank</span></div>
            <span className="rounded-full border border-white/10 bg-white/[.04] px-3 py-1 text-[10px] font-semibold uppercase tracking-[.14em] text-white/45">Setup flow</span>
          </div>
          <div className="mt-7 flex items-center justify-between gap-3 rounded-2xl border border-white/[.07] bg-white/[.018] p-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[.14em] text-white/24">Current sign-in order</p>
              <h1 className="mt-2 text-2xl font-semibold tracking-[-.045em] text-white">{provider === "discord" ? "Discord first, then Roblox" : "Roblox first, then Discord"}</h1>
              <p className="mt-2 max-w-xl text-sm leading-6 text-white/38">Finish both platform links, then enter your profile, billing placeholder, and workspace details. Billing is planned, but the first free plan is already reserved here.</p>
            </div>
            <div className="hidden rounded-2xl border border-blue-400/10 bg-blue-400/[.06] px-4 py-3 text-right sm:block">
              <p className="text-[10px] font-semibold uppercase tracking-[.14em] text-blue-200/70">Progress</p>
              <b className="mt-1 block text-2xl text-white">{completed}/4</b>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <SetupSwitch active={provider === "discord"} icon={Bot} label="Start with Discord" text="Then link Roblox during setup" onClick={() => setProvider("discord")} />
            <SetupSwitch active={provider === "roblox"} icon={Gamepad2} label="Start with Roblox" text="Then link Discord during setup" onClick={() => setProvider("roblox")} />
          </div>

          <div className="mt-6 space-y-4">
            <StageCard active={stage === 0} title="1. Name and account" description="Enter the profile details we need for the workspace." icon={Fingerprint}>
              <div className="grid gap-3 sm:grid-cols-2">
                <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Name" className="border-white/[.08] bg-white/[.025] text-white/75" />
                <Input value={surname} onChange={(event) => setSurname(event.target.value)} placeholder="Surname" className="border-white/[.08] bg-white/[.025] text-white/75" />
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <Input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email" className="border-white/[.08] bg-white/[.025] text-white/75" />
                <Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Password" className="border-white/[.08] bg-white/[.025] text-white/75" />
              </div>
            </StageCard>

            <StageCard active={stage === 1} title="2. Link the other platform" description="The setup flow always asks for both Discord and Roblox." icon={BadgeCheck}>
              <div className="grid gap-3 sm:grid-cols-2">
                <LinkPill label="Discord account link" state={provider === "discord" ? "connected" : "waiting"} />
                <LinkPill label="Roblox account link" state={provider === "roblox" ? "connected" : "waiting"} />
              </div>
              <p className="mt-3 text-xs leading-6 text-white/30">Nexora uses official authorization only. No security cookies, tokens, or raw passwords are ever stored in the product flow.</p>
            </StageCard>

            <StageCard active={stage === 2} title="3. Billing placeholder and rollover auth" description="One free plan is available now. Billing lands later." icon={Clock3}>
              <div className="grid gap-3 sm:grid-cols-2">
                <PlanCard title={plan.name} price={plan.price} selected description={plan.description} />
                <PlanCard title="Billing later" price="Planned" description="Checkout, renewals, and invoices will be added after the core product is stable." />
              </div>
              <div className="mt-3 rounded-xl border border-amber-400/10 bg-amber-400/[.04] p-3 text-xs leading-6 text-amber-100/70">Rollover authentication will be added after billing. This keeps the first launch focused on verified identity and workspace creation.</div>
            </StageCard>

            <StageCard active={stage === 3} title="4. Workspace and app" description="Create the workspace identity the dashboard and Roblox ranking will use." icon={UsersRound}>
              <div className="grid gap-3 sm:grid-cols-2">
                <Input value={workspaceName} onChange={(event) => setWorkspaceName(event.target.value)} placeholder="Workspace name" className="border-white/[.08] bg-white/[.025] text-white/75" />
                <div className="rounded-xl border border-white/[.07] bg-white/[.02] px-4 py-3 text-sm text-white/40"><span className="block text-[10px] uppercase tracking-[.14em] text-white/22">Workspace slug</span>{workspaceSlug}</div>
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <InfoCard label="Workspace ID" value={workspaceId} />
                <InfoCard label="App" value={appName} />
              </div>
            </StageCard>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Button variant="outline" className="border-white/10 bg-white/[.02] text-white/65 hover:bg-white/[.05] hover:text-white" onClick={() => setStage((value) => Math.max(0, value - 1))}>Back</Button>
            <Button
              className="button-glow flex-1"
              onClick={() => {
                if (stage < 3) {
                  setStage((value) => Math.min(3, value + 1));
                  return;
                }

                window.location.assign("/dashboard");
              }}
            >
              {stage < 3 ? "Continue setup" : "Open dashboard"} <ArrowRight />
            </Button>
          </div>
        </section>

        <aside className="space-y-4">
          <section className="auth-card">
            <div className="flex items-center gap-2.5"><BrandMark compact /><span className="text-sm font-semibold text-white">Setup summary</span></div>
            <div className="mt-6 space-y-3">
              <SummaryRow label="Name" value={`${name} ${surname}`} />
              <SummaryRow label="Email" value={email} />
              <SummaryRow label="Sign-in order" value={provider === "discord" ? "Discord first" : "Roblox first"} />
              <SummaryRow label="Plan" value="Starter · Free" />
              <SummaryRow label="Workspace ID" value={workspaceId} />
            </div>
            <div className="mt-6 rounded-2xl border border-blue-400/10 bg-blue-400/[.05] p-4 text-xs leading-6 text-white/38">
              The dashboard will use this workspace ID and app for rank operations, activity tracking, and future Roblox automation.
            </div>
          </section>

          <section className="auth-card">
            <div className="flex items-center gap-2.5 text-white/72"><Sparkles className="size-4 text-blue-300" /> What happens next</div>
            <div className="mt-5 space-y-3">
              <RoadmapRow title="Dedicated Supabase connection" text="Auth, session exchange, and workspace records will point at the Nexora project." />
              <RoadmapRow title="Billing system later" text="A proper checkout and renewal flow will be added after onboarding ships." />
              <RoadmapRow title="Dashboard + app handoff" text="Once the workspace exists, the dashboard can manage Roblox rank operations safely." />
            </div>
          </section>
        </aside>
      </div>
    </main>
  );
}

function SetupSwitch({ active, icon: Icon, label, text, onClick }: { active: boolean; icon: typeof Bot; label: string; text: string; onClick: () => void }) {
  return <button onClick={onClick} className={`rounded-2xl border p-4 text-left transition ${active ? "border-blue-400/25 bg-blue-400/[.08]" : "border-white/[.07] bg-white/[.02] hover:bg-white/[.04]"}`}><div className="flex items-center gap-3"><span className={`flex size-10 items-center justify-center rounded-xl ${active ? "bg-blue-400/15 text-blue-200" : "bg-white/[.04] text-white/55"}`}><Icon className="size-5" /></span><div><b className="block text-sm text-white">{label}</b><span className="block text-xs leading-5 text-white/30">{text}</span></div></div></button>;
}

function StageCard({ active, title, description, icon: Icon, children }: { active: boolean; title: string; description: string; icon: typeof Fingerprint; children: ReactNode }) {
  return <article className={`rounded-2xl border p-4 transition ${active ? "border-blue-400/20 bg-white/[.03]" : "border-white/[.07] bg-white/[.015]"}`}><div className="flex items-start gap-3"><span className="flex size-10 items-center justify-center rounded-xl bg-blue-400/[.08] text-blue-200"><Icon className="size-4" /></span><div className="min-w-0 flex-1"><h2 className="text-sm font-semibold text-white">{title}</h2><p className="mt-1 text-xs leading-5 text-white/32">{description}</p></div></div><div className="mt-4">{children}</div></article>;
}

function PlanCard({ title, price, description, selected = false }: { title: string; price: string; description: string; selected?: boolean }) {
  return <div className={`rounded-2xl border p-4 ${selected ? "border-emerald-400/20 bg-emerald-400/[.05]" : "border-white/[.07] bg-white/[.02]"}`}><div className="flex items-center justify-between gap-3"><div><b className="block text-sm text-white">{title}</b><span className="block text-xs text-white/30">{description}</span></div><span className="rounded-full border border-white/10 bg-white/[.04] px-2 py-1 text-[9px] font-semibold uppercase tracking-[.14em] text-white/40">{price}</span></div>{selected && <p className="mt-3 text-[10px] uppercase tracking-[.14em] text-emerald-200/70">Selected</p>}</div>;
}

function LinkPill({ label, state }: { label: string; state: string }) {
  const ready = state === "connected";
  return <div className={`rounded-xl border px-4 py-3 ${ready ? "border-emerald-400/15 bg-emerald-400/[.05]" : "border-white/[.07] bg-white/[.02]"}`}><div className="flex items-center justify-between gap-2"><span className="text-sm text-white/72">{label}</span><span className={`rounded-full px-2 py-1 text-[9px] font-semibold uppercase tracking-[.14em] ${ready ? "bg-emerald-400/10 text-emerald-200" : "bg-white/[.04] text-white/34"}`}>{state}</span></div></div>;
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border border-white/[.07] bg-white/[.02] px-4 py-3"><span className="block text-[10px] uppercase tracking-[.14em] text-white/22">{label}</span><span className="mt-1 block truncate text-sm text-white/72">{value}</span></div>;
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between gap-4 rounded-xl border border-white/[.06] bg-white/[.015] px-4 py-3"><span className="text-xs text-white/30">{label}</span><span className="truncate text-xs text-white/75">{value}</span></div>;
}

function RoadmapRow({ title, text }: { title: string; text: string }) {
  return <div className="rounded-xl border border-white/[.07] bg-white/[.015] p-4"><div className="flex items-center gap-2 text-sm font-medium text-white/78"><CircleCheckBig className="size-4 text-blue-300" />{title}</div><p className="mt-2 text-xs leading-6 text-white/30">{text}</p></div>;
}