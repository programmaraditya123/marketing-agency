import type { FastifyInstance } from "fastify";
export default async function healthRoutes(app: FastifyInstance, options: { ready: () => Promise<void> }) {
  app.get("/", async () => ({ success: true, message: "Marketing agency backend" }));
  app.get("/health", async () => ({ status: "healthy" }));
  app.get("/ready", async () => { await options.ready(); return { status: "ready" }; });
}
