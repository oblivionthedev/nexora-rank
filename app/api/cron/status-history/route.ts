import { getServiceHealth, recordServiceHealth } from "@/lib/service-status";
import {
  NEXORA_LOG_CHANNELS,
  nexoraLogBrand,
  sendNexoraOperationalLog,
} from "@/lib/operational-logs";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const { services, checkedAt } = await getServiceHealth();
  const result = await recordServiceHealth(services);
  const healthy = services.every((service) => service.state === "operational");
  await sendNexoraOperationalLog(NEXORA_LOG_CHANNELS.providerStatus, {
    title: healthy ? "All Nexora systems operational" : "Nexora status update",
    description: services
      .map(
        (service) =>
          `${service.state === "operational" ? "🟢" : service.state === "degraded" ? "🟠" : service.state === "outage" ? "🔴" : "⚪"} **${service.name}** — ${service.detail}`,
      )
      .join("\n"),
    color: 0x000000,
    author: nexoraLogBrand("Nexora Status"),
    footer: { text: "Automated provider health check" },
    timestamp: checkedAt,
  });
  return Response.json(
    { ...result, checkedAt },
    { status: result.ok ? 200 : 500 },
  );
}
