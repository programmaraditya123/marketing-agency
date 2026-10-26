import type { FastifyInstance } from "fastify";
export function registerShutdown(app: FastifyInstance): void {
  let stopping = false;
  const stop = async () => {
    if (stopping) return;
    stopping = true;
    try { await app.close(); } catch (error) { app.log.error(error); process.exitCode = 1; }
  };
  process.once("SIGTERM", stop);
  process.once("SIGINT", stop);
}
