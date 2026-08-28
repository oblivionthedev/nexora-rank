import { createMembershipAutomationClient } from "@/lib/roblox-membership";

export type HealthState = "operational" | "degraded" | "outage" | "unknown";

export type ServiceHealth = {
  key: string;
  name: string;
  description: string;
  state: HealthState;
  detail: string;
  href?: string;
  updatedAt?: string;
};

type StatusPageResponse = {
  page?: { updated_at?: string };
  status?: { indicator?: string; description?: string };
};

type StatusIoResponse = {
  result?: {
    status_overall?: { updated?: string; status?: string; status_code?: number };
  };
};

const statusSources = [
  {
    name: "Vercel edge network",
    key: "vercel",
    description: "Hosting, routing and server functions",
    endpoint: "https://www.vercel-status.com/api/v2/status.json",
    href: "https://www.vercel-status.com",
  },
  {
    name: "Supabase platform",
    key: "supabase",
    description: "Authentication and workspace data",
    endpoint: "https://status.supabase.com/api/v2/status.json",
    href: "https://status.supabase.com",
  },
  {
    name: "Discord platform",
    key: "discord",
    description: "Sign-in, servers, members and roles",
    endpoint: "https://discordstatus.com/api/v2/status.json",
    href: "https://discordstatus.com",
  },
  {
    name: "Roblox platform",
    key: "roblox",
    description: "OAuth, groups and ranking tools — optional in beta",
    endpoint: "https://api.status.io/1.0/status/59db90dbcdeb2f04dadcf16d",
    href: "https://status.roblox.com",
    format: "statusio",
  },
] as const;

function mapIndicator(indicator?: string): HealthState {
  if (indicator === "none") return "operational";
  if (indicator === "minor" || indicator === "maintenance") return "degraded";
  if (indicator === "major" || indicator === "critical") return "outage";
  return "unknown";
}

async function readStatusPage(source: (typeof statusSources)[number]): Promise<ServiceHealth> {
  try {
    const response = await fetch(source.endpoint, {
      headers: { accept: "application/json" },
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(4500),
    });
    if (!response.ok) throw new Error(`status ${response.status}`);
    if ("format" in source && source.format === "statusio") {
      const payload = await response.json() as StatusIoResponse;
      const overall = payload.result?.status_overall;
      const label = overall?.status ?? "Status available";
      const normalized = label.toLowerCase();
      const state: HealthState = normalized.includes("operational")
        ? "operational"
        : normalized.includes("degraded") || normalized.includes("maintenance")
          ? "degraded"
          : normalized.includes("outage") || normalized.includes("disruption")
            ? "outage"
            : "unknown";
      return {
        key: source.key,
        name: source.name,
        description: source.description,
        state,
        detail: label,
        href: source.href,
        updatedAt: overall?.updated,
      };
    }

    const payload = await response.json() as StatusPageResponse;
    return {
      key: source.key,
      name: source.name,
      description: source.description,
      state: mapIndicator(payload.status?.indicator),
      detail: payload.status?.description ?? "Status available",
      href: source.href,
      updatedAt: payload.page?.updated_at,
    };
  } catch {
    return {
      key: source.key,
      name: source.name,
      description: source.description,
      state: "unknown",
      detail: "Live status feed is temporarily unavailable",
      href: source.href,
    };
  }
}

async function readProjectAuth(): Promise<ServiceHealth> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !publishableKey) {
    return { key: "authentication", name: "Nexora authentication", description: "Project sign-in and session exchange", state: "unknown", detail: "Health check is not configured" };
  }

  try {
    const response = await fetch(`${url}/auth/v1/health`, {
      cache: "no-store",
      headers: { apikey: publishableKey },
      signal: AbortSignal.timeout(3500),
    });
    return {
      key: "authentication",
      name: "Nexora authentication",
      description: "Project sign-in and session exchange",
      state: response.ok ? "operational" : "outage",
      detail: response.ok ? "Accepting authentication requests" : `Health check returned ${response.status}`,
    };
  } catch {
    return { key: "authentication", name: "Nexora authentication", description: "Project sign-in and session exchange", state: "outage", detail: "Authentication health check did not respond" };
  }
}

export async function getServiceHealth(): Promise<{ services: ServiceHealth[]; checkedAt: string }> {
  const [auth, ...external] = await Promise.all([
    readProjectAuth(),
    ...statusSources.map(readStatusPage),
  ]);

  return {
    checkedAt: new Date().toISOString(),
    services: [
      { key: "website", name: "Nexora website", description: "Public website and workspace dashboard", state: "operational", detail: "Serving requests normally" },
      auth,
      ...external,
    ],
  };
}

export type StatusSnapshot = { service_key: string; checked_on: string; state: HealthState; detail: string | null };

export async function getStatusHistory(): Promise<StatusSnapshot[]> {
  const supabase = createMembershipAutomationClient();
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - 89);
  const { data } = await supabase.from("service_status_snapshots").select("service_key, checked_on, state, detail").gte("checked_on", since.toISOString().slice(0, 10)).order("checked_on");
  return (data ?? []) as StatusSnapshot[];
}

export async function recordServiceHealth(services: ServiceHealth[]) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return { ok: false as const, error: "missing_secret" };
  const supabase = createMembershipAutomationClient();
  const { data, error } = await supabase.rpc("record_status_snapshots", {
    candidate_secret: secret,
    snapshots: services.map((service) => ({ key: service.key, state: service.state, detail: service.detail })),
  });
  return error ? { ok: false as const, error: "record_failed" } : { ok: true as const, written: data ?? 0 };
}
