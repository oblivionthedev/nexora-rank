import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  Check,
  CircleDollarSign,
  Coffee,
  Gamepad2,
  KeyRound,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
  UserRound,
  UsersRound,
  Webhook,
} from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { OnboardingIdentityAction } from "@/components/onboarding-identity-actions";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { listRobloxGroups } from "@/lib/roblox-membership";
import {
  saveOwnerProfile,
  selectFreePlan,
  createOnboardingWorkspace,
  selectRobloxGroup,
} from "./actions";
import { signOut } from "@/app/dashboard/actions";

export const dynamic = "force-dynamic";

const messages: Record<string, string> = {
  identity_update_failed:
    "We could not save that account choice. Please try again.",
  invalid_profile: "Enter a valid first name, surname, and contact email.",
  weak_password:
    "Use at least 10 characters with uppercase, lowercase, and a number.",
  password_update_failed:
    "The backup password could not be enabled. You can leave it blank and continue with OAuth.",
  profile_update_failed: "Your profile could not be saved.",
  plan_update_failed: "The free plan could not be selected.",
  invalid_workspace:
    "Use a 2–64 character name and a lowercase URL such as my-community.",
  slug_taken: "That workspace URL is already taken.",
  workspace_failed: "The workspace could not be created.",
  workspace_creation_paused:
    "Workspace creation is temporarily paused while Nexora Beta applications are reviewed. Your account and application remain safe.",
  onboarding_incomplete:
    "Complete the earlier setup steps before creating a workspace.",
  roblox_not_ready:
    "Roblox OAuth is waiting for app approval and provider configuration.",
  roblox_identity_required: "Connect Roblox before creating a free workspace.",
  roblox_membership_required:
    "The workspace owner must join the Nexora Roblox community before creating a free workspace.",
  membership_check_unavailable:
    "Roblox could not be checked safely. Nothing was suspended; please try again shortly.",
  invalid_roblox_group: "Choose a Roblox community from the verified account.",
  roblox_groups_unavailable:
    "Roblox groups could not be loaded. Please try again shortly.",
  roblox_group_update_failed: "That Roblox community could not be saved.",
};

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; manage?: string }>;
}) {
  const supabase = await createClient();
  const [
    {
      data: { user },
    },
    params,
  ] = await Promise.all([supabase.auth.getUser(), searchParams]);
  if (!user) redirect("/login?next=/onboarding");

  await supabase.rpc("sync_auth_identities");

  const [
    { data: profile },
    { data: links },
    { data: membership },
    { data: policy },
    { data: platformSettings },
    { data: dashboardAccess },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select(
        "first_name, last_name, contact_email, plan_key, plan_selected_at, password_set_at, roblox_link_deferred_at, selected_roblox_group_id, selected_roblox_group_name, selected_roblox_group_role",
      )
      .eq("id", user.id)
      .single(),
    supabase
      .from("account_links")
      .select("provider, username, display_name, provider_user_id")
      .eq("user_id", user.id),
    supabase
      .from("workspace_members")
      .select("workspace_id")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle(),
    supabase.rpc("get_free_membership_policy"),
    supabase.rpc("get_public_platform_settings"),
    supabase.rpc("dashboard_access_state"),
  ]);

  const providerMap = new Map(
    (links ?? []).map((link) => [link.provider, link]),
  );
  const discordConnected = providerMap.has("discord");
  const robloxConnected = providerMap.has("roblox");
  const robloxIdentity = providerMap.get("roblox");
  const robloxGroupsResult = robloxIdentity?.provider_user_id
    ? await listRobloxGroups(robloxIdentity.provider_user_id)
    : null;
  const robloxGroups = robloxGroupsResult?.ok ? robloxGroupsResult.groups : [];
  const ownedRobloxGroups = robloxGroups.filter(
    (group) => group.roleRank === 255,
  );
  const membershipPolicy = policy as {
    enabled?: boolean;
    group_id?: string;
    grace_hours?: number;
  } | null;
  const membershipEnforced = Boolean(membershipPolicy?.enabled);
  const workspaceCreationEnabled = Boolean(
    (platformSettings as { workspace_creation_enabled?: boolean } | null)
      ?.workspace_creation_enabled,
  );
  const isStaff = Boolean(
    (dashboardAccess as { staff?: boolean } | null)?.staff,
  );
  const accessState = dashboardAccess as {
    blocked?: boolean;
    reason?: string;
  } | null;
  if (accessState?.blocked || accessState?.reason === "security_blocked") {
    await supabase.auth.signOut();
    redirect("/login?error=security_blocked");
  }
  const workspaceCreationAvailable = workspaceCreationEnabled || isStaff;
  const robloxAvailable =
    process.env.NEXT_PUBLIC_ROBLOX_OAUTH_ENABLED === "true";
  // Roblox remains optional while the live membership policy is disabled.
  // Once approval is complete, enabling that policy restores the required gate.
  const robloxRequired = membershipEnforced && robloxAvailable;
  const identityReady =
    discordConnected && (!robloxRequired || robloxConnected);
  if (membership && params.manage !== "identities")
    redirect(identityReady ? "/dashboard" : "/onboarding?manage=identities");
  const profileReady = Boolean(
    profile?.first_name && profile?.last_name && profile?.contact_email,
  );
  const planReady =
    profile?.plan_key === "free" && Boolean(profile.plan_selected_at);
  const groupStepRequired = robloxConnected;
  const groupReady =
    !groupStepRequired || Boolean(profile?.selected_roblox_group_id);
  const profileStep = groupStepRequired ? 3 : 2;
  const planStep = profileStep + 1;
  const workspaceStep = planStep + 1;
  const totalSteps = workspaceStep + 1;
  const activeStep =
    params.manage === "identities"
      ? 1
      : !identityReady
        ? 1
        : !groupReady
          ? 2
          : !profileReady
            ? profileStep
            : !planReady
              ? planStep
              : workspaceStep;
  const steps = groupStepRequired
    ? [
        "Accounts",
        "Roblox group",
        "Owner profile",
        "Free plan",
        "Workspace",
        "Launch",
      ]
    : ["Accounts", "Owner profile", "Free plan", "Workspace", "Launch"];
  const authEmail = user.email ?? "";
  const defaultFirstName = profile?.first_name ?? "";
  const defaultLastName = profile?.last_name ?? "";
  const errorMessage = params.error ? messages[params.error] : undefined;

  return (
    <main className="setup-page">
      <header className="setup-topbar">
        <Link href="/" className="setup-brand">
          <BrandMark />
          <span>Nexora Rank</span>
        </Link>
        <div className="setup-topbar-actions">
          <span className="setup-beta">Private beta</span>
          <Link href="/status">System status</Link>
          <form action={signOut}>
            <button type="submit">Sign out</button>
          </form>
        </div>
      </header>

      <div className="setup-shell">
        <aside className="setup-rail">
          <div>
            <span className="setup-eyebrow">Nexora onboarding</span>
            <h1>Build your community control room.</h1>
            <p>
              A focused setup for connected accounts, ownership, plan limits,
              and the workspace your team will run from.
            </p>
          </div>
          <ol className="setup-steps">
            {steps.map((label, index) => (
              <SetupRailStep
                key={label}
                number={index + 1}
                label={label}
                active={activeStep === index + 1}
                done={activeStep > index + 1}
              />
            ))}
          </ol>
          <div className="setup-rail-note">
            <ShieldCheck />
            <div>
              <b>Protected by design</b>
              <span>
                OAuth credentials stay with their providers. Nexora stores only
                the account details needed to operate your workspace.
              </span>
            </div>
          </div>
        </aside>

        <section className="setup-stage">
          <div className="setup-progress">
            <span
              style={{
                width: `${Math.round((activeStep / totalSteps) * 100)}%`,
              }}
            />
          </div>
          <div className="setup-stage-head">
            <span>
              Step {activeStep} of {totalSteps}
            </span>
            <b>{Math.round((activeStep / totalSteps) * 100)}% complete</b>
          </div>
          {errorMessage ? (
            <div className="onboarding-error" role="alert">
              {errorMessage}
            </div>
          ) : null}

          {activeStep === 1 ? (
            <section className="setup-card">
              <div className="setup-icon">
                <LockKeyhole />
              </div>
              <span className="setup-kicker">Account connections</span>
              <h2>Connect Discord to continue.</h2>
              <p>
                Discord powers server access. Roblox is optional for now and can
                be connected later when OAuth approval is ready.
              </p>
              <div className="provider-stack">
                <ProviderStatus
                  brand="discord"
                  name="Discord"
                  description="Required for sign-in, server access, membership and role sync"
                  state={discordConnected ? "connected" : "required"}
                  username={
                    providerMap.get("discord")?.display_name ??
                    providerMap.get("discord")?.username
                  }
                >
                  {!discordConnected ? (
                    <OnboardingIdentityAction provider="discord" />
                  ) : null}
                </ProviderStatus>
                <ProviderStatus
                  brand="roblox"
                  name="Roblox"
                  description={
                    robloxRequired
                      ? "Required for groups, ranking and in-game activity"
                      : "Optional for now — connect later when OAuth approval is ready"
                  }
                  state={
                    robloxConnected
                      ? "connected"
                      : robloxRequired
                        ? "required"
                        : "optional"
                  }
                  username={
                    providerMap.get("roblox")?.display_name ??
                    providerMap.get("roblox")?.username
                  }
                >
                  {!robloxConnected ? (
                    robloxAvailable ? (
                      <OnboardingIdentityAction provider="custom:roblox" />
                    ) : (
                      <span className="provider-availability">
                        OAuth approval pending
                      </span>
                    )
                  ) : null}
                </ProviderStatus>
              </div>
              {identityReady && membership ? (
                <Button asChild className="button-glow h-12 rounded-xl">
                  <Link href="/dashboard">
                    Return to dashboard <ArrowRight />
                  </Link>
                </Button>
              ) : null}
            </section>
          ) : null}

          {groupStepRequired && activeStep === 2 ? (
            <section className="setup-card">
              <div className="setup-icon">
                <Gamepad2 />
              </div>
              <span className="setup-kicker">Roblox community</span>
              <h2>Choose the group this workspace will run.</h2>
              <p>
                Nexora checked the groups visible on your connected Roblox
                account. This choice is separate from the Nexora support
                community required by the Free plan after OAuth approval.
              </p>
              {ownedRobloxGroups.length ? (
                <form action={selectRobloxGroup} className="setup-form">
                  <label>
                    <span>Group to manage</span>
                    <select
                      name="roblox_group_id"
                      required
                      defaultValue={
                        profile?.selected_roblox_group_id ??
                        (ownedRobloxGroups.length === 1
                          ? ownedRobloxGroups[0].id
                          : "")
                      }
                    >
                      <option value="" disabled>
                        Select a group you own
                      </option>
                      {ownedRobloxGroups.map((group) => (
                        <option value={group.id} key={group.id}>
                          {group.name} — owner
                        </option>
                      ))}
                    </select>
                    <small>
                      Nexora only lists groups owned by the connected Roblox
                      account. A single owned group is selected automatically.
                    </small>
                  </label>
                  <Button type="submit" className="button-glow h-12 rounded-xl">
                    Use this community <ArrowRight />
                  </Button>
                </form>
              ) : (
                <div className="onboarding-error" role="status">
                  {robloxGroupsResult && !robloxGroupsResult.ok
                    ? "Roblox could not return your groups right now. Refresh and try again."
                    : "This account does not own a Roblox group yet."}
                </div>
              )}
            </section>
          ) : null}

          {activeStep === profileStep ? (
            <section className="setup-card">
              <div className="setup-icon">
                <UserRound />
              </div>
              <span className="setup-kicker">Owner profile & security</span>
              <h2>Tell the workspace who owns it.</h2>
              <p>
                This information is used for account notices, audit attribution,
                and billing contacts when paid plans arrive.
              </p>
              <form action={saveOwnerProfile} className="setup-form">
                <div className="setup-form-grid">
                  <label>
                    <span>First name</span>
                    <input
                      name="first_name"
                      required
                      maxLength={60}
                      defaultValue={defaultFirstName}
                      autoComplete="given-name"
                      placeholder="Alex"
                    />
                  </label>
                  <label>
                    <span>Surname</span>
                    <input
                      name="last_name"
                      required
                      maxLength={60}
                      defaultValue={defaultLastName}
                      autoComplete="family-name"
                      placeholder="Morgan"
                    />
                  </label>
                </div>
                <label>
                  <span>Contact email</span>
                  <input
                    name="contact_email"
                    required
                    type="email"
                    maxLength={254}
                    defaultValue={profile?.contact_email ?? authEmail}
                    autoComplete="email"
                  />
                  <small>
                    Your OAuth login email stays managed by its provider.
                  </small>
                </label>
                <label>
                  <span>
                    Backup password <em>Optional</em>
                  </span>
                  <input
                    name="password"
                    type="password"
                    minLength={10}
                    maxLength={72}
                    autoComplete="new-password"
                    placeholder={
                      profile?.password_set_at
                        ? "Backup password already enabled"
                        : "10+ characters"
                    }
                  />
                  <small>
                    Optional email-login recovery. Stored only by Supabase Auth,
                    never by Nexora.
                  </small>
                </label>
                <Button type="submit" className="button-glow h-12 rounded-xl">
                  Save and continue <ArrowRight />
                </Button>
              </form>
            </section>
          ) : null}

          {activeStep === planStep ? (
            <section className="setup-card">
              <div className="setup-icon">
                <CircleDollarSign />
              </div>
              <span className="setup-kicker">Plan & billing</span>
              <h2>A useful free plan—not tiny, not excessive.</h2>
              <p>
                No payment method is needed. Paid checkout will only appear
                after billing, cancellation, and refund flows are ready.
              </p>
              <article className="setup-plan">
                <div className="setup-plan-top">
                  <div>
                    <span>Beta Free</span>
                    <h3>Community</h3>
                  </div>
                  <strong>
                    €0<small>/month</small>
                  </strong>
                </div>
                <div className="setup-plan-grid">
                  {[
                    "1 workspace",
                    "1 Discord server",
                    "1 Roblox group",
                    "Up to 500 linked members",
                    "10 staff seats",
                    "5,000 monthly API operations",
                    membershipEnforced
                      ? "Owner membership in the Nexora Roblox community"
                      : "Roblox community rule activates after OAuth approval",
                    "30-day audit history",
                    "Ranking, activity and applications",
                  ].map((feature) => (
                    <span key={feature}>
                      <Check />
                      {feature}
                    </span>
                  ))}
                </div>
                <div className="setup-plan-note">
                  <Sparkles />
                  <span>
                    {membershipEnforced
                      ? `If the owner later leaves community ${membershipPolicy?.group_id}, they have ${membershipPolicy?.grace_hours ?? 48} hours to rejoin before the next automated check can suspend the workspace.`
                      : "All core tools are included during beta. Roblox membership enforcement is off while OAuth approval is pending."}
                  </span>
                </div>
              </article>
              <form action={selectFreePlan}>
                <Button
                  type="submit"
                  className="button-glow h-12 w-full rounded-xl"
                >
                  Choose Beta Free <ArrowRight />
                </Button>
              </form>
              <aside className="setup-support">
                <Coffee />
                <div>
                  <b>Support stable updates</b>
                  <p>
                    If Nexora helps your community, you can support future
                    improvements through{" "}
                    <Link
                      href="https://www.roblox.com/catalog/17081871151/Nexora-Rank-Support"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Roblox
                    </Link>{" "}
                    or{" "}
                    <Link
                      href="https://ko-fi.com/obliviondev"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Ko-fi
                    </Link>
                    . Donations are optional and never unlock account access.
                  </p>
                </div>
              </aside>
            </section>
          ) : null}

          {activeStep === workspaceStep ? (
            <section className="setup-card">
              <div className="setup-icon">
                <UsersRound />
              </div>
              <span className="setup-kicker">Create workspace</span>
              <h2>
                {workspaceCreationAvailable
                  ? "Name the control center for your community."
                  : "Workspace creation is temporarily paused."}
              </h2>
              <p>
                {workspaceCreationAvailable
                  ? "Your workspace receives a permanent letters-and-numbers ID. It never changes, while the private 25-character API key can be replaced from the dashboard at any time."
                  : "We are reviewing the first Beta members before opening workspace setup. You can stay signed in, and your selected Beta access remains active."}
              </p>
              {workspaceCreationAvailable ? (
                <form action={createOnboardingWorkspace} className="setup-form">
                  <label>
                    <span>Workspace name</span>
                    <input
                      name="name"
                      required
                      minLength={2}
                      maxLength={64}
                      placeholder="Nexora Community"
                    />
                  </label>
                  <label>
                    <span>Workspace URL</span>
                    <div className="setup-slug">
                      <small>nexorarank.tech/w/</small>
                      <input
                        name="slug"
                        required
                        pattern="[a-z0-9][a-z0-9-]{1,46}[a-z0-9]"
                        placeholder="nexora-community"
                      />
                    </div>
                    <small>Lowercase letters, numbers and hyphens only.</small>
                  </label>
                  <Button type="submit" className="button-glow h-12 rounded-xl">
                    Create workspace <ArrowRight />
                  </Button>
                </form>
              ) : (
                <div className="onboarding-error" role="status">
                  New workspaces are paused during the Beta intake. No action is
                  required from you right now.
                </div>
              )}
              <div className="setup-capabilities">
                <span>
                  <Webhook /> Signed API requests
                </span>
                <span>
                  <KeyRound /> Server-only keys
                </span>
                <span>
                  <ShieldCheck /> Full audit trail
                </span>
              </div>
            </section>
          ) : null}
        </section>
      </div>
    </main>
  );
}

function SetupRailStep({
  number,
  label,
  active,
  done,
}: {
  number: number;
  label: string;
  active: boolean;
  done: boolean;
}) {
  return (
    <li className={active ? "active" : done ? "done" : ""}>
      <span>{done ? <Check /> : number}</span>
      <b>{label}</b>
    </li>
  );
}

function ProviderStatus({
  brand,
  name,
  description,
  state,
  username,
  children,
}: {
  brand: "discord" | "roblox";
  name: string;
  description: string;
  state: "connected" | "required" | "optional";
  username?: string | null;
  children?: React.ReactNode;
}) {
  const connected = state === "connected";
  const statusLabel = connected
    ? "Connected"
    : state === "required"
      ? "Required"
      : "Optional";
  return (
    <article className={`${state} ${brand}`}>
      <span className={`provider-icon ${brand}`}>
        <Image src={`/${brand}.svg`} alt="" width={22} height={22} />
      </span>
      <div>
        <div className="flex items-center gap-2">
          <b>{name}</b>
          <span className={`provider-pill ${state}`}>{statusLabel}</span>
        </div>
        <p>{connected && username ? username : description}</p>
      </div>
      <div className="provider-action">
        {children ?? (connected ? <Check /> : null)}
      </div>
    </article>
  );
}
