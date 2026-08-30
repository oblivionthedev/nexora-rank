import http from "node:http";

export function startHealthServer({ port, client, logger }) {
  const server = http.createServer((request, response) => {
    if (request.url !== "/health") {
      response.writeHead(404).end("Not found");
      return;
    }
    response
      .writeHead(client.isReady() ? 200 : 503, {
        "content-type": "application/json",
      })
      .end(
        JSON.stringify({
          ok: client.isReady(),
          service: "nexora-support",
          readyAt: client.readyAt?.toISOString() || null,
        }),
      );
  });
  server.listen(port, () => logger.info("Health server listening", { port }));
  return server;
}
