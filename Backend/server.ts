import { buildApplication } from "./config/application";
import { readEnv } from "./config/env";
import { registerShutdown } from "./config/shutdown";
async function start(): Promise<void> {
  const env = readEnv();
  const app = await buildApplication(env);
  registerShutdown(app);
  try { await app.listen({ port: env.port, host: env.host }); }
  catch (error) { app.log.error(error); await app.close(); process.exitCode = 1; }
}
void start().catch(() => { console.error("Backend startup failed. Check environment configuration and MongoDB availability."); process.exitCode = 1; });
