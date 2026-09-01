import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  Check,
  Coffee,
  Fingerprint,
  Gamepad2,
  KeyRound,
  LayoutDashboard,
  Rocket,
  ShieldCheck,
  Sparkles,
  UserRound,
  Webhook,
} from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { OnboardingIdentityAction } from "@/components/onboarding-identity-actions";
import { OnboardingSubmitButton } from "@/components/onboarding-submit-button";
import { OnboardingWorkspaceForm } from "@/components/onboarding-workspace-form";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { listRobloxGroups } from "@/lib/roblox-membership";
import {
  saveOwnerProfile,
  selectFreePlan,
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
  roblox_authorization_declined:
    "Roblox connection was cancelled. Your Discord session is still active.",
  roblox_oauth_failed:
    "Roblox could not complete the secure connection. Please try again.",
  roblox_resource_access_failed:
    "Roblox did not return the approved group permissions.",
  roblox_permissions_required:
    "Approve all requested Roblox group permissions to continue.",
  roblox_connection_save_failed:
    "Roblox connected, but Nexora could not save it securely.",
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
    beta_selected?: boolean;
    staff?: boolean;
  } | null;
  if (accessState?.blocked || accessState?.reason === "security_blocked") {
    await supabase.auth.signOut();
    redirect("/login?error=security_blocked");
  }
  const workspaceCreationAvailable = workspaceCreationEnabled || isStaff;
  const robloxAvailable =
    process.env.NEXT_PUBLIC_ROBLOX_OAUTH_ENABLED === "true";
  // Before provider approval Roblox remains optional. Turning the provider on
  // makes the one-time Open Cloud authorization part of setup automatically.
  const robloxRequired = robloxAvailable;
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
        { label: "Accounts", icon: Fingerprint },
        { label: "Roblox group", icon: Gamepad2 },
        { label: "Owner profile", icon: UserRound },
        { label: "Beta plan", icon: Sparkles },
        { label: "Workspace", icon: LayoutDashboard },
        { label: "Launch", icon: Rocket },
      ]
    : [
        { label: "Accounts", icon: Fingerprint },
        { label: "Owner profile", icon: UserRound },
        { label: "Beta plan", icon: Sparkles },
        { label: "Workspace", icon: LayoutDashboard },
        { label: "Launch", icon: Rocket },
      ];
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
          <span className="setup-beta"><i /> Beta access active</span>
          <Link href="/status">System status</Link>
          <form action={signOut}>
            <button type="submit">Sign out</button>
          </form>
        </div>
      </header>

      <div className="setup-shell">
        <aside className="setup-rail">
          <div>
            <div className="setup-access-card">
              <BadgeCheck />
              <span>
                <b>{isStaff ? "Staff access confirmed" : "You’re in the Beta"}</b>
                <small>Workspace creation is unlocked</small>
              </span>
            </div>
            <span className="setup-eyebrow">Workspace setup</span>
            <h1>Your new control room starts here.</h1>
            <p>
              We’ll confirm your accounts, owner details, plan, and community.
              Most teams finish in under three minutes.
            </p>
          </div>
          <ol className="setup-steps">
            {steps.map(({ label, icon: Icon }, index) => (
              <SetupRailStep
                key={label}
                number={index + 1}
                label={label}
                icon={<Icon />}
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
                Your provider passwords never touch Nexora. Every workspace
                action is permission checked and recorded.
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
              Setup step {activeStep} of {totalSteps}
            </span>
            <b>{Math.round((activeStep / totalSteps) * 100)}% · about {Math.max(1, totalSteps - activeStep)} min left</b>
          </div>
          {errorMessage ? (
            <div className="onboarding-error" role="alert">
              {errorMessage}
            </div>
          ) : null}

          {activeStep === 1 ? (
            <section className="setup-card">
              <div className="setup-icon">
                <Fingerprint />
              </div>
              <span className="setup-kicker">Account connections</span>
              <h2>First, let’s recognize you.</h2>
              <p>
                Discord confirms your Beta access and connects the server you’ll
                manage. Once Roblox OAuth is approved, one secure connection
                unlocks group selection and rank operations.
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
                      ? "Required once for groups, ranking and verified staff operations"
                      : "Optional until Roblox approves the Nexora OAuth application"
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
                  <OnboardingSubmitButton
                    idleLabel="Use this community"
                    pendingLabel="Saving your community…"
                  />
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
                <Building2 />
              </div>
              <span className="setup-kicker">Owner profile & security</span>
              <h2>Put a real person behind the workspace.</h2>
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
                <OnboardingSubmitButton
                  idleLabel="Save owner details"
                  pendingLabel="Saving your details…"
                />
              </form>
            </section>
          ) : null}

          {activeStep === planStep ? (
            <section className="setup-card">
              <div className="setup-icon">
                <Sparkles />
              </div>
              <span className="setup-kicker">Your Beta plan</span>
              <h2>Everything you need to start is included.</h2>
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
                <OnboardingSubmitButton
                  idleLabel="Activate Beta Free"
                  pendingLabel="Activating your plan…"
                  fullWidth
                />
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
                <LayoutDashboard />
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
                <OnboardingWorkspaceForm
                  communityName={profile?.selected_roblox_group_name}
                />
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
  icon,
  active,
  done,
}: {
  number: number;
  label: string;
  icon: React.ReactNode;
  active: boolean;
  done: boolean;
}) {
  return (
    <li className={active ? "active" : done ? "done" : ""}>
      <span>{done ? <Check /> : active ? icon : number}</span>
      <div>
        <b>{label}</b>
        <small>{done ? "Complete" : active ? "In progress" : "Up next"}</small>
      </div>
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
