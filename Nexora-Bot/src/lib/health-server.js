import http from "node:http";

export function startHealthServer({ port, client, logger }) {
  const server = http.createServer((request, response) => {
    const healthy = client.isReady();
    const isHealthRoute = request.url === "/" || request.url === "/healthz";
    response.writeHead(isHealthRoute ? (healthy ? 200 : 503) : 404, {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    });
    response.end(JSON.stringify(isHealthRoute
      ? { ok: healthy, service: "nexora-bot", discord: healthy ? "connected" : "starting", uptime: Math.floor(process.uptime()) }
      : { ok: false, error: "not_found" }));
  });
  server.listen(port, "0.0.0.0", () => logger.info("Health server listening", { port }));
  return server;
}
